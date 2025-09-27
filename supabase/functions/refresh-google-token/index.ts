import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRefreshResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
}

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

    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      throw new Error('No active session found');
    }

    const refreshToken = sessionData.session.provider_refresh_token;
    
    if (!refreshToken) {
      throw new Error('No refresh token available. User needs to re-authenticate.');
    }

    // Refresh the Google access token
    const newTokens = await refreshGoogleAccessToken(refreshToken);

    // Update the session with the new access token
    await updateSessionWithNewToken(supabase, sessionData.session, newTokens.access_token);

    return new Response(JSON.stringify({
      success: true,
      access_token: newTokens.access_token,
      expires_in: newTokens.expires_in
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in refresh-google-token function:', error);
    
    // Check if it's a re-authentication needed error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const needsReauth = errorMessage.includes('refresh token') || 
                       errorMessage.includes('re-authenticate') ||
                       errorMessage.includes('invalid_grant');

    return new Response(JSON.stringify({ 
      error: errorMessage,
      needsReauth 
    }), {
      status: needsReauth ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshGoogleAccessToken(refreshToken: string): Promise<TokenRefreshResponse> {
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
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Google token refresh failed:', response.status, errorData);
    throw new Error('Failed to refresh Google access token. User needs to re-authenticate.');
  }

  const tokenData = await response.json();
  
  if (!tokenData.access_token) {
    throw new Error('Invalid token response from Google');
  }

  return tokenData;
}

async function updateSessionWithNewToken(supabase: any, session: any, newAccessToken: string) {
  try {
    // Update the session with new provider token
    const { error } = await supabase.auth.updateUser({
      data: {
        provider_token: newAccessToken,
        token_updated_at: new Date().toISOString()
      }
    });

    if (error) {
      console.error('Failed to update session with new token:', error);
    } else {
      console.log('Successfully updated session with new access token');
    }
  } catch (error) {
    console.error('Error updating session:', error);
  }
}