import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GmailNotification {
  message: {
    data: string;
    messageId: string;
    publishTime: string;
  };
}

interface PubSubMessage {
  emailAddress: string;
  historyId: string;
}

serve(async (req) => {
  console.log(`Gmail webhook received ${req.method} request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      // Handle subscription verification
      const url = new URL(req.url);
      const challenge = url.searchParams.get('hub.challenge');
      const mode = url.searchParams.get('hub.mode');
      
      if (mode === 'subscribe' && challenge) {
        console.log('Gmail webhook subscription verified');
        return new Response(challenge, { status: 200 });
      }
    }

    if (req.method === 'POST') {
      // Handle Gmail push notifications
      const notification: GmailNotification = await req.json();
      console.log('Received Gmail notification:', notification);

      if (!notification.message?.data) {
        console.warn('No message data in notification');
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Decode the base64 message data
      const messageData = JSON.parse(atob(notification.message.data)) as PubSubMessage;
      console.log('Decoded message data:', messageData);

      const emailAddress = messageData.emailAddress;
      const historyId = messageData.historyId;

      if (!emailAddress || !historyId) {
        console.warn('Missing emailAddress or historyId in notification');
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Find users with this email address and active monitoring
      // First, find the user with this email address
      const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(emailAddress);
      
      if (userError || !user) {
        console.log(`No user found for email address: ${emailAddress}`);
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Then find their active email monitor
      const { data: monitors, error: monitorsError } = await supabase
        .from('email_monitors')
        .select('*')
        .eq('user_id', user.id)
        .eq('monitoring_enabled', true);

      if (monitorsError) {
        console.error('Error fetching email monitors:', monitorsError);
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      if (!monitors || monitors.length === 0) {
        console.log('No active email monitors found');
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Process notifications for each user with active monitoring
      for (const monitor of monitors) {
        // Check if this is a newer history ID (avoid duplicate processing)
        const currentHistoryId = parseInt(historyId);
        const lastProcessedId = parseInt(monitor.gmail_history_id || '0');

        if (currentHistoryId <= lastProcessedId) {
          console.log(`Skipping already processed history ID ${historyId} for user ${monitor.user_id}`);
          continue;
        }

        // Trigger email processing for this user
        console.log(`Triggering email processing for user ${monitor.user_id}, historyId: ${historyId}`);
        
        const { error: processError } = await supabase.functions.invoke('process-email-notifications', {
          body: {
            userId: monitor.user_id,
            emailAddress,
            historyId,
            monitorId: monitor.id
          }
        });

        if (processError) {
          console.error(`Error triggering email processing for user ${monitor.user_id}:`, processError);
          
          // Log the error to processing_logs
          await supabase.from('processing_logs').insert({
            user_id: monitor.user_id,
            log_level: 'error',
            message: 'Failed to trigger email processing',
            details: { error: processError.message, historyId, emailAddress }
          });
        }

        // Update the last processed history ID
        await supabase
          .from('email_monitors')
          .update({ gmail_history_id: historyId })
          .eq('id', monitor.id);
      }

      console.log('Gmail webhook processing completed');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  } catch (error: any) {
    console.error('Gmail webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});