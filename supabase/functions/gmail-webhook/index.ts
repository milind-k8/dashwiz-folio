import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bank email addresses we monitor
const BANK_EMAILS = [
  'alerts@hdfcbank.net',
  'alerts@sbi.co.in',
  'alerts@icicibank.com',
  'alerts@axisbank.com',
  'alerts@kotakbank.com',
  'alerts@yesbank.in',
  'alerts@bankofbaroda.in',
  'alerts@indianbank.in',
  'alerts@canarabank.in',
  'alerts@pnb.co.in'
];

interface GmailPushNotification {
  message: {
    data: string; // Base64 encoded JSON
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

interface PubSubMessage {
  emailAddress: string;
  historyId: string;
}

serve(async (req) => {
  console.log('Gmail webhook received request:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Gmail webhook verification - respond to GET requests
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const challenge = url.searchParams.get('hub.challenge');
    const verifyToken = url.searchParams.get('hub.verify_token');
    
    console.log('Gmail webhook verification request');
    
    // You should validate the verify_token here in production
    if (challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    return new Response('Webhook endpoint active', { status: 200 });
  }

  // Handle POST requests (actual push notifications)
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const notification: GmailPushNotification = await req.json();
    console.log('Received Gmail push notification:', notification);

    if (!notification.message?.data) {
      console.log('No message data in notification');
      return new Response('No message data', { status: 400 });
    }

    // Decode the base64 message data
    const messageData = JSON.parse(atob(notification.message.data)) as PubSubMessage;
    console.log('Decoded message data:', messageData);

    const userEmail = messageData.emailAddress;
    if (!userEmail) {
      console.log('No email address in message data');
      return new Response('No email address', { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email address (from their Google auth)
    const { data: userTokens, error: userError } = await supabase
      .from('user_tokens')
      .select('user_id, google_access_token')
      .eq('sync_status', 'active')
      .not('google_access_token', 'is', null);

    if (userError) {
      console.error('Error fetching user tokens:', userError);
      return new Response('Database error', { status: 500 });
    }

    if (!userTokens || userTokens.length === 0) {
      console.log('No active user tokens found');
      return new Response('No active users', { status: 200 });
    }

    // For now, we'll process all active users since we can't directly match email
    // In production, you'd want to store the Gmail email address with the user token
    console.log(`Processing Gmail notification for ${userTokens.length} active users`);

    // Process each user's banks
    for (const userToken of userTokens) {
      try {
        // Get user's banks
        const { data: userBanks, error: banksError } = await supabase
          .from('user_banks')
          .select('id, bank_name')
          .eq('user_id', userToken.user_id);

        if (banksError) {
          console.error('Error fetching user banks:', banksError);
          continue;
        }

        if (!userBanks || userBanks.length === 0) {
          console.log(`No banks found for user ${userToken.user_id}`);
          continue;
        }

        // Process each bank
        for (const bank of userBanks) {
          try {
            console.log(`Processing bank ${bank.bank_name} for user ${userToken.user_id}`);
            
            // Get current month for processing
            const now = new Date();
            const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // Call the existing process-transactions function
            const { data: processResult, error: processError } = await supabase.functions.invoke(
              'process-transactions',
              {
                body: {
                  bankName: bank.bank_name,
                  month: month,
                  googleAccessToken: userToken.google_access_token,
                  userId: userToken.user_id
                }
              }
            );

            if (processError) {
              console.error(`Error processing transactions for bank ${bank.bank_name}:`, processError);
            } else {
              console.log(`Successfully processed transactions for bank ${bank.bank_name}:`, processResult);
            }
          } catch (bankError) {
            console.error(`Error processing bank ${bank.bank_name}:`, bankError);
          }
        }
      } catch (userError) {
        console.error(`Error processing user ${userToken.user_id}:`, userError);
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Gmail notification processed successfully',
      processedUsers: userTokens.length 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Error processing Gmail webhook:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});