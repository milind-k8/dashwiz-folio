import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { maxResults = 10, query = '' } = await req.json();
    
    // Get the user's session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Create supabase admin client to get user info
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Get user's provider token
    const { data: session, error: sessionError } = await supabase.auth.admin.getUserById(user.id);
    if (sessionError || !session?.user?.user_metadata?.provider_token) {
      throw new Error('Gmail access token expired. Please sign out and sign in again with Google.');
    }

    const accessToken = session.user.user_metadata.provider_token;

    // Build Gmail API query
    let gmailQuery = 'from:(noreply@hdfcbank.com OR alerts@hdfcbank.com OR noreply@icicibank.com OR alerts@icicibank.com OR noreply@sbi.co.in OR alerts@sbi.co.in)';
    if (query) {
      gmailQuery += ` ${query}`;
    }

    // Call Gmail API
    const gmailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(gmailQuery)}&maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text();
      throw new Error(`Gmail API error: ${gmailResponse.status} - ${errorText}`);
    }

    const data = await gmailResponse.json();
    
    // Get detailed message info for each message
    const messagesWithDetails = await Promise.all(
      (data.messages || []).map(async (message: any) => {
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (messageResponse.ok) {
          return await messageResponse.json();
        }
        return message;
      })
    );

    return new Response(
      JSON.stringify({ messages: messagesWithDetails }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
})