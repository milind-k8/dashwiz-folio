import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`Debug user auth received ${req.method} request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get detailed user information
    const { data: authUser, error: userError } = await supabase.auth.admin.getUserById(user.id);
    
    const debugInfo = {
      userId: user.id,
      email: user.email,
      userError,
      hasUser: !!authUser.user,
      userMetadata: authUser.user?.user_metadata || {},
      identities: authUser.user?.identities?.map(identity => ({
        provider: identity.provider,
        hasProviderToken: !!identity.identity_data?.provider_token,
        identityDataKeys: Object.keys(identity.identity_data || {}),
        // Don't log the actual token for security
      })) || [],
      appMetadata: authUser.user?.app_metadata || {},
      lastSignInAt: authUser.user?.last_sign_in_at,
      createdAt: authUser.user?.created_at
    };

    console.log('Debug user auth info:', JSON.stringify(debugInfo, null, 2));

    return new Response(
      JSON.stringify({ 
        message: 'User auth debug info retrieved',
        data: debugInfo
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Debug user auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});