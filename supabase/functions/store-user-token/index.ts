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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get current session to extract Google tokens
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      throw new Error('No active session found');
    }

    const googleAccessToken = sessionData.session.provider_token;
    const googleRefreshToken = sessionData.session.provider_refresh_token;

    if (!googleRefreshToken) {
      throw new Error('No Google refresh token available');
    }

    // Calculate token expiration (Google tokens typically expire in 1 hour)
    const tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now

    // Store or update user token
    const { error: upsertError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: user.id,
        google_access_token: googleAccessToken,
        google_refresh_token: googleRefreshToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        sync_status: 'active'
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error storing user token:', upsertError);
      throw new Error('Failed to store user token');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'User token stored successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in store-user-token function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});