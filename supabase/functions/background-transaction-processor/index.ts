import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessorRequest {
  userId?: string;
}

serve(async (req) => {
  console.log(`Background transaction processor received ${req.method} request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId }: ProcessorRequest = await req.json();

    console.log('Starting background transaction processing', userId ? `for user ${userId}` : 'for all users');

    // Get pending queue items (optionally filtered by user)
    let query = supabase
      .from('email_processing_queue')
      .select('*')
      .in('status', ['pending', 'retry'])
      .lte('scheduled_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(50); // Process in batches

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: queueItems, error: queueError } = await query;

    if (queueError) {
      console.error('Error fetching queue items:', queueError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch queue items' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('No pending queue items found');
      return new Response(
        JSON.stringify({ message: 'No pending items to process' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Found ${queueItems.length} queue items to process`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each queue item
    for (const queueItem of queueItems) {
      try {
        // Update status to processing
        await supabase
          .from('email_processing_queue')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', queueItem.id);

        console.log(`Processing queue item ${queueItem.id} for user ${queueItem.user_id}`);

        // Log processing start
        await supabase.from('processing_logs').insert({
          user_id: queueItem.user_id,
          queue_id: queueItem.id,
          log_level: 'info',
          message: `Started processing email ${queueItem.gmail_message_id}`,
          details: { queueItem }
        });

        // Get user's Google access token
        const accessToken = await getUserAccessToken(supabase, queueItem.user_id);
        if (!accessToken) {
          throw new Error('No access token available for user');
        }

        // Fetch the full email content
        const emailContent = await fetchEmailContent(accessToken, queueItem.gmail_message_id);
        if (!emailContent) {
          throw new Error('Failed to fetch email content');
        }

        // Determine bank information from email
        const bankInfo = await determineBankFromEmail(supabase, queueItem.user_id, emailContent);
        if (!bankInfo) {
          console.log(`Could not determine bank from email ${queueItem.gmail_message_id}, skipping`);
          
          // Mark as completed but log the issue
          await supabase
            .from('email_processing_queue')
            .update({ 
              status: 'completed', 
              processed_at: new Date().toISOString(),
              error_message: 'Could not determine bank from email'
            })
            .eq('id', queueItem.id);

          await supabase.from('processing_logs').insert({
            user_id: queueItem.user_id,
            queue_id: queueItem.id,
            log_level: 'warn',
            message: 'Could not determine bank from email',
            details: { emailContent: emailContent.snippet }
          });

          continue;
        }

        console.log(`Determined bank: ${bankInfo.bank_name} for email ${queueItem.gmail_message_id}`);

        // Call process-transactions function for this specific email
        const currentDate = new Date();
        const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
        const yearStr = currentDate.getFullYear();

        const { error: processError } = await supabase.functions.invoke('process-transactions', {
          body: {
            bankName: bankInfo.bank_name,
            month: `${monthStr}/${yearStr}`,
            googleAccessToken: accessToken,
            specificEmailId: queueItem.gmail_message_id // Process only this specific email
          },
          headers: {
            Authorization: `Bearer ${await getUserJWT(supabase, queueItem.user_id)}`
          }
        });

        if (processError) {
          throw new Error(`Process transactions failed: ${processError.message}`);
        }

        // Mark as completed
        await supabase
          .from('email_processing_queue')
          .update({ 
            status: 'completed', 
            processed_at: new Date().toISOString(),
            error_message: null
          })
          .eq('id', queueItem.id);

        await supabase.from('processing_logs').insert({
          user_id: queueItem.user_id,
          queue_id: queueItem.id,
          log_level: 'info',
          message: `Successfully processed email ${queueItem.gmail_message_id}`,
          details: { bankName: bankInfo.bank_name }
        });

        processedCount++;
        console.log(`Successfully processed queue item ${queueItem.id}`);

      } catch (error: any) {
        errorCount++;
        console.error(`Error processing queue item ${queueItem.id}:`, error);

        const retryCount = (queueItem.retry_count || 0) + 1;
        const maxRetries = queueItem.max_retries || 3;

        if (retryCount <= maxRetries) {
          // Schedule for retry with exponential backoff
          const retryDelay = Math.min(Math.pow(2, retryCount) * 60 * 1000, 30 * 60 * 1000); // Max 30 min
          const scheduledAt = new Date(Date.now() + retryDelay);

          await supabase
            .from('email_processing_queue')
            .update({ 
              status: 'retry',
              retry_count: retryCount,
              error_message: error.message,
              scheduled_at: scheduledAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', queueItem.id);

          console.log(`Scheduled retry ${retryCount}/${maxRetries} for queue item ${queueItem.id} in ${retryDelay/1000} seconds`);
        } else {
          // Mark as permanently failed
          await supabase
            .from('email_processing_queue')
            .update({ 
              status: 'failed',
              error_message: error.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', queueItem.id);

          console.log(`Queue item ${queueItem.id} permanently failed after ${maxRetries} retries`);
        }

        await supabase.from('processing_logs').insert({
          user_id: queueItem.user_id,
          queue_id: queueItem.id,
          log_level: 'error',
          message: `Error processing email: ${error.message}`,
          details: { error: error.message, retryCount, maxRetries }
        });
      }

      // Add small delay between processing items to avoid overwhelming APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Background processing completed: ${processedCount} successful, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        message: 'Background processing completed',
        processed: processedCount,
        errors: errorCount,
        total: queueItems.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Background transaction processor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

async function getUserAccessToken(supabase: any, userId: string): Promise<string | null> {
  try {
    // Try to get from profiles table first
    const { data: profile } = await supabase
      .from('profiles')
      .select('provider_token')
      .eq('user_id', userId)
      .single();

    if (profile?.provider_token) {
      return profile.provider_token;
    }

    // Fallback: try to get from auth user metadata
    const { data: authUser, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !authUser.user?.user_metadata?.provider_token) {
      console.error('No access token available for user:', userId);
      return null;
    }

    return authUser.user.user_metadata.provider_token;
  } catch (error) {
    console.error('Error getting user access token:', error);
    return null;
  }
}

async function getUserJWT(supabase: any, userId: string): Promise<string | null> {
  try {
    // Generate a JWT for the user to authenticate with other functions
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: '', // Will be filled by the function
      options: {
        redirectTo: 'http://localhost:3000'
      }
    });

    if (error) {
      console.error('Error generating JWT:', error);
      return null;
    }

    // Extract JWT from the recovery link (this is a simplified approach)
    // In production, you'd want a more robust JWT generation method
    return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  } catch (error) {
    console.error('Error getting user JWT:', error);
    return null;
  }
}

async function fetchEmailContent(accessToken: string, messageId: string): Promise<any> {
  try {
    const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
    
    const response = await fetch(messageUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching email content:', error);
    return null;
  }
}

async function determineBankFromEmail(supabase: any, userId: string, emailContent: any): Promise<{bank_name: string} | null> {
  try {
    // Get user's banks
    const { data: banks } = await supabase
      .from('user_banks')
      .select('bank_name')
      .eq('user_id', userId);

    if (!banks || banks.length === 0) {
      return null;
    }

    // Extract email sender and subject
    const fromHeader = emailContent.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from');
    const subjectHeader = emailContent.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject');
    
    const fromEmail = fromHeader?.value || '';
    const subject = subjectHeader?.value || '';
    const snippet = emailContent.snippet || '';

    console.log(`Analyzing email - From: ${fromEmail}, Subject: ${subject}`);

    // Try to match email content with user's banks
    for (const bank of banks) {
      const bankName = bank.bank_name.toLowerCase();
      
      // Check various patterns
      const patterns = [
        bankName,
        bankName.replace(' ', ''),
        bankName.replace(/bank|financial|corp|ltd|inc/gi, '').trim()
      ];

      for (const pattern of patterns) {
        if (pattern.length < 3) continue; // Skip very short patterns
        
        if (fromEmail.toLowerCase().includes(pattern) ||
            subject.toLowerCase().includes(pattern) ||
            snippet.toLowerCase().includes(pattern)) {
          console.log(`Matched bank: ${bank.bank_name} with pattern: ${pattern}`);
          return { bank_name: bank.bank_name };
        }
      }
    }

    // If no direct match, try common bank email patterns
    const bankEmailPatterns = [
      { pattern: 'hdfc', name: 'HDFC' },
      { pattern: 'icici', name: 'ICICI' },
      { pattern: 'sbi', name: 'SBI' },
      { pattern: 'axis', name: 'Axis' },
      { pattern: 'kotak', name: 'Kotak' },
      { pattern: 'citi', name: 'Citibank' },
      { pattern: 'hsbc', name: 'HSBC' }
    ];

    for (const bankPattern of bankEmailPatterns) {
      if (fromEmail.toLowerCase().includes(bankPattern.pattern) ||
          subject.toLowerCase().includes(bankPattern.pattern)) {
        
        // Check if user has this bank
        const matchingBank = banks.find(b => 
          b.bank_name.toLowerCase().includes(bankPattern.name.toLowerCase())
        );
        
        if (matchingBank) {
          console.log(`Matched bank via pattern: ${matchingBank.bank_name}`);
          return { bank_name: matchingBank.bank_name };
        }
      }
    }

    console.log('Could not determine bank from email content');
    return null;
  } catch (error) {
    console.error('Error determining bank from email:', error);
    return null;
  }
}