import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessEmailRequest {
  userId: string;
  emailAddress: string;
  historyId: string;
  monitorId: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
  };
}

serve(async (req) => {
  console.log(`Process email notifications received ${req.method} request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user (for non-webhook calls)
    let authUserId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (!authError && user) {
        authUserId = user.id;
      }
    }

    const { userId, emailAddress, historyId, monitorId }: ProcessEmailRequest = await req.json();
    
    // Validate that authenticated user matches the userId (if auth header present)
    if (authUserId && authUserId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Processing email notifications for user ${userId}, historyId: ${historyId}`);

    // Log processing start
    await supabase.from('processing_logs').insert({
      user_id: userId,
      log_level: 'info',
      message: 'Started processing email notifications',
      details: { historyId, emailAddress, monitorId }
    });

    // Get user's Google access token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('provider_token')
      .eq('user_id', userId)
      .single();

    let accessToken: string;
    if (profileError || !profile?.provider_token) {
      console.log('No provider token found, attempting to get from auth user metadata');
      
      // Fallback: try to get from auth user metadata
      const { data: authUser, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError || !authUser.user?.user_metadata?.provider_token) {
        console.error('No access token available for user:', userId);
        
        await supabase.from('processing_logs').insert({
          user_id: userId,
          log_level: 'error',
          message: 'No Google access token available',
          details: { profileError, userError }
        });
        
        return new Response(
          JSON.stringify({ error: 'No Google access token available' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      accessToken = authUser.user.user_metadata.provider_token;
    } else {
      accessToken = profile.provider_token;
    }

    // Get Gmail history to find new messages
    const historyUrl = `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}&maxResults=100`;
    
    let historyResponse = await fetch(historyUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle token refresh if needed
    if (historyResponse.status === 401) {
      console.log('Access token expired, attempting refresh...');
      
      const refreshedToken = await refreshAccessToken(supabase, userId);
      if (!refreshedToken) {
        await supabase.from('processing_logs').insert({
          user_id: userId,
          log_level: 'error',
          message: 'Failed to refresh access token',
          details: { historyId }
        });
        
        return new Response(
          JSON.stringify({ error: 'Failed to refresh access token' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Retry with refreshed token
      historyResponse = await fetch(historyUrl, {
        headers: {
          'Authorization': `Bearer ${refreshedToken}`,
          'Content-Type': 'application/json',
        },
      });
      accessToken = refreshedToken;
    }

    if (!historyResponse.ok) {
      const errorText = await historyResponse.text();
      console.error('Gmail history API error:', errorText);
      
      await supabase.from('processing_logs').insert({
        user_id: userId,
        log_level: 'error',
        message: 'Gmail history API error',
        details: { status: historyResponse.status, error: errorText }
      });
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Gmail history' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const historyData = await historyResponse.json();
    console.log('Gmail history response:', historyData);

    if (!historyData.history || historyData.history.length === 0) {
      console.log('No new messages in Gmail history');
      return new Response(
        JSON.stringify({ message: 'No new messages found' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get user's bank patterns for filtering
    const { data: monitor } = await supabase
      .from('email_monitors')
      .select('bank_patterns')
      .eq('id', monitorId)
      .single();

    const bankPatterns = monitor?.bank_patterns || [];
    console.log('Bank patterns for filtering:', bankPatterns);

    // Extract message IDs from history and filter for bank-related emails
    const messageIds: string[] = [];
    for (const historyItem of historyData.history) {
      if (historyItem.messagesAdded) {
        for (const messageAdded of historyItem.messagesAdded) {
          messageIds.push(messageAdded.message.id);
        }
      }
    }

    if (messageIds.length === 0) {
      console.log('No new messages found in history');
      return new Response(
        JSON.stringify({ message: 'No new messages found' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Found ${messageIds.length} new messages to check`);

    let queuedCount = 0;
    // Process each message
    for (const messageId of messageIds) {
      try {
        // Get message details
        const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
        
        const messageResponse = await fetch(messageUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!messageResponse.ok) {
          console.error(`Failed to fetch message ${messageId}`);
          continue;
        }

        const messageData = await messageResponse.json();
        const fromHeader = messageData.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from');
        const subjectHeader = messageData.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject');
        
        const fromEmail = fromHeader?.value || '';
        const subject = subjectHeader?.value || '';
        
        console.log(`Message ${messageId} - From: ${fromEmail}, Subject: ${subject}`);

        // Check if this email matches any bank email addresses
        let isBankEmail = false;
        for (const pattern of bankPatterns) {
          if (typeof pattern === 'string') {
            // Check if the fromEmail matches the pattern exactly or contains it
            if (fromEmail.toLowerCase().includes(pattern.toLowerCase())) {
              isBankEmail = true;
              console.log(`Message ${messageId} matched pattern: ${pattern}`);
              break;
            }
          }
        }

        if (!isBankEmail) {
          console.log(`Message ${messageId} does not match bank patterns, skipping`);
          continue;
        }

        console.log(`Message ${messageId} matches bank patterns, queuing for processing`);

        // Add to processing queue
        const { error: queueError } = await supabase
          .from('email_processing_queue')
          .insert({
            user_id: userId,
            email_id: messageId,
            gmail_message_id: messageId,
            status: 'pending',
            scheduled_at: new Date().toISOString()
          });

        if (queueError) {
          console.error(`Failed to queue message ${messageId}:`, queueError);
          
          await supabase.from('processing_logs').insert({
            user_id: userId,
            log_level: 'error',
            message: `Failed to queue message for processing`,
            details: { messageId, error: queueError.message }
          });
        } else {
          queuedCount++;
          console.log(`Successfully queued message ${messageId} for processing`);
        }

      } catch (error: any) {
        console.error(`Error processing message ${messageId}:`, error);
        
        await supabase.from('processing_logs').insert({
          user_id: userId,
          log_level: 'error',
          message: `Error processing message`,
          details: { messageId, error: error.message }
        });
      }
    }

    // Trigger background processing if we have queued items
    if (queuedCount > 0) {
      console.log(`Triggering background processor for ${queuedCount} queued messages`);
      
      // Trigger background processing (fire and forget)
      const { error: processorError } = await supabase.functions.invoke('background-transaction-processor', {
        body: { userId }
      });

      if (processorError) {
        console.error('Failed to trigger background processor:', processorError);
        
        await supabase.from('processing_logs').insert({
          user_id: userId,
          log_level: 'warn',
          message: 'Failed to trigger background processor',
          details: { error: processorError.message, queuedCount }
        });
      }
    }

    await supabase.from('processing_logs').insert({
      user_id: userId,
      log_level: 'info',
      message: 'Completed processing email notifications',
      details: { 
        historyId, 
        totalMessages: messageIds.length, 
        queuedMessages: queuedCount 
      }
    });

    return new Response(
      JSON.stringify({ 
        message: 'Email notifications processed successfully',
        totalMessages: messageIds.length,
        queuedMessages: queuedCount
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Process email notifications error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

async function refreshAccessToken(supabase: any, userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('refresh-google-token', {
      body: { userId }
    });

    if (error) {
      console.error('Token refresh error:', error);
      return null;
    }

    return data.access_token;
  } catch (error) {
    console.error('Error calling refresh token function:', error);
    return null;
  }
}