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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

    // Get Google tokens from request body
    const body = await req.json();
    const googleAccessToken = body.provider_token;
    const googleRefreshToken = body.provider_refresh_token;

    if (!googleAccessToken || !googleRefreshToken) {
      throw new Error('No Google tokens provided in request body');
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