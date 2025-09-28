import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = req.method === 'POST' ? await req.json() : {};
    const specificUserId = requestBody.userId; // Optional user ID for targeted sync

    console.log(specificUserId 
      ? `Starting email sync for user: ${specificUserId}` 
      : 'Starting scheduled email sync for all users...'
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let userTokens;
    
    if (specificUserId) {
      // Process specific user (called from webhook)
      const { data, error: tokensError } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', specificUserId)
        .eq('sync_status', 'active')
        .single();

      if (tokensError) {
        console.error('Error fetching user token:', tokensError);
        throw new Error('Failed to fetch user token');
      }

      userTokens = data ? [data] : [];
    } else {
      // Get all active users with tokens that need syncing (haven't synced in the last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error: tokensError } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('sync_status', 'active')
        .or(`last_sync_at.is.null,last_sync_at.lt.${oneHourAgo}`);

      if (tokensError) {
        console.error('Error fetching user tokens:', tokensError);
        throw new Error('Failed to fetch user tokens');
      }

      userTokens = data || [];
    }

    console.log(`Found ${userTokens.length} users to sync`);

    if (userTokens.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: specificUserId 
          ? 'User does not need syncing or is not active'
          : 'No users need syncing at this time',
        users_synced: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process users in background
    // @ts-ignore EdgeRuntime is available in Deno Deploy
    EdgeRuntime.waitUntil(processAllUsers(supabase, userTokens));

    return new Response(JSON.stringify({
      success: true,
      message: specificUserId 
        ? `Email sync initiated for user ${specificUserId}`
        : 'Email sync initiated for all eligible users',
      users_to_sync: userTokens.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scheduled email sync:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processAllUsers(supabase: any, userTokens: any[]) {
  let successCount = 0;
  let failCount = 0;

  for (const userToken of userTokens) {
    try {
      await processUserSync(supabase, userToken);
      successCount++;
      console.log(`Successfully synced user ${userToken.user_id}`);
    } catch (error) {
      console.error(`Failed to sync user ${userToken.user_id}:`, error);
      failCount++;
      
        // Log the error
        await supabase
          .from('email_sync_logs')
          .insert({
            user_id: userToken.user_id,
            status: 'failed',
            sync_completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
            emails_processed: 0,
            transactions_created: 0
          });
    }
  }

  console.log(`Sync completed. Success: ${successCount}, Failed: ${failCount}`);
}

async function processUserSync(supabase: any, userToken: any) {
  // Create sync log
  const { data: syncLog } = await supabase
    .from('email_sync_logs')
    .insert({
      user_id: userToken.user_id,
      status: 'running'
    })
    .select()
    .single();

  try {
    // Check if token needs refresh
    const needsRefresh = !userToken.token_expires_at || 
      new Date(userToken.token_expires_at).getTime() < Date.now() + 10 * 60 * 1000;

    let accessToken = userToken.google_access_token;

    if (needsRefresh || !accessToken) {
      console.log(`Refreshing token for user ${userToken.user_id}`);
      accessToken = await refreshUserToken(supabase, userToken);
    }

    if (!accessToken) {
      throw new Error('No valid access token available');
    }

    // Get user's banks
    const { data: banks } = await supabase
      .from('user_banks')
      .select('*')
      .eq('user_id', userToken.user_id);

    if (!banks || banks.length === 0) {
      await supabase
        .from('email_sync_logs')
        .update({
          status: 'completed',
          sync_completed_at: new Date().toISOString(),
          emails_processed: 0,
          transactions_created: 0
        })
        .eq('id', syncLog.id);
      return;
    }

    // For each bank, call the existing process-transactions function
    let totalEmails = 0;
    let totalTransactions = 0;

    for (const bank of banks) {
      try {
        // Calculate the date range - last hour or since last sync
        const fromDate = userToken.last_sync_at 
          ? new Date(userToken.last_sync_at)
          : new Date(Date.now() - 60 * 60 * 1000);
        
        const month = `${fromDate.getMonth() + 1}/${fromDate.getFullYear()}`; // Format as "M/YYYY"
        
        // Call process-transactions function for this bank
        console.log(`Calling process-transactions for ${bank.bank_name} with userId: ${userToken.user_id}`);
        const { data, error } = await supabase.functions.invoke('process-transactions', {
          body: {
            bankName: bank.bank_name,
            month: month,
            googleAccessToken: accessToken,
            userId: userToken.user_id // Pass userId for scheduled calls
          }
        });

        if (error) {
          console.error(`Error processing ${bank.bank_name}:`, error);
        } else if (data) {
          totalEmails += data.emailsProcessed || 0;
          totalTransactions += data.transactionsCreated || 0;
        }
      } catch (bankError) {
        console.error(`Error processing bank ${bank.bank_name}:`, bankError);
      }
    }

    // Update sync log with success
    await supabase
      .from('email_sync_logs')
      .update({
        status: 'completed',
        sync_completed_at: new Date().toISOString(),
        emails_processed: totalEmails,
        transactions_created: totalTransactions
      })
      .eq('id', syncLog.id);

    // Update user token last sync time
    await supabase
      .from('user_tokens')
      .update({ 
        last_sync_at: new Date().toISOString()
      })
      .eq('id', userToken.id);

  } catch (error) {
    // Update sync log with error
    await supabase
      .from('email_sync_logs')
      .update({
        status: 'failed',
        sync_completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', syncLog.id);
    
    throw error;
  }
}

async function refreshUserToken(supabase: any, userToken: any): Promise<string | null> {
  try {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: userToken.google_refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Token refresh failed:', response.status, await response.text());
      
      // Mark token as expired
      await supabase
        .from('user_tokens')
        .update({ sync_status: 'expired' })
        .eq('id', userToken.id);
      
      throw new Error('Failed to refresh Google access token');
    }

    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    // Update stored tokens
    await supabase
      .from('user_tokens')
      .update({
        google_access_token: tokenData.access_token,
        token_expires_at: expiresAt.toISOString(),
        sync_status: 'active'
      })
      .eq('id', userToken.id);

    return tokenData.access_token;

  } catch (error) {
    console.error(`Failed to refresh token for user ${userToken.user_id}:`, error);
    throw error;
  }
}