import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the JWT token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get request parameters (readonly only)
    let maxResults = 10;
    let query = '';

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      maxResults = parseInt(searchParams.get('maxResults') || '10');
      query = searchParams.get('q') || '';
    } else if (req.method === 'POST') {
      const body = await req.json();
      maxResults = body.maxResults || 10;
      query = body.query || '';
    }

    console.log(`Gmail API request - Method: ${req.method}, MaxResults: ${maxResults}, Query: ${query}, User: ${user.id}`);

    // Get Google access token from user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      throw new Error('No active session found. User needs to sign in.');
    }

    // For Google OAuth, the provider token should be available in the session
    const googleAccessToken = sessionData.session.provider_token;

    if (!googleAccessToken) {
      throw new Error('No Google access token found. Please sign out and sign in again with Google.');
    }

    // Only support readonly operations
    const result = await fetchMessages(googleAccessToken, maxResults, query);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gmail function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchMessages(accessToken: string, maxResults: number, query: string): Promise<{ messages: GmailMessage[] }> {
  try {
    // Build Gmail API URL
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
    });
    
    if (query) {
      params.append('q', query);
    }

    let currentAccessToken = accessToken;
    let response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
      headers: {
        'Authorization': `Bearer ${currentAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // If token expired, try to refresh it
    if (response.status === 401) {
      console.log('Access token expired, attempting refresh...');
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        currentAccessToken = refreshedToken;
        response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
          headers: {
            'Authorization': `Bearer ${currentAccessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gmail API error:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Gmail access token expired. Please sign out and sign in again with Google.');
      }
      
      throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.messages || data.messages.length === 0) {
      return { messages: [] };
    }

    // Fetch detailed message data
    const messages = await Promise.all(
      data.messages.map(async (message: { id: string }) => {
        let messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
          headers: {
            'Authorization': `Bearer ${currentAccessToken}`,
            'Content-Type': 'application/json',
          },
        });

        // Retry with refreshed token if needed
        if (messageResponse.status === 401 && currentAccessToken !== accessToken) {
          messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
            headers: {
              'Authorization': `Bearer ${currentAccessToken}`,
              'Content-Type': 'application/json',
            },
          });
        }

        if (!messageResponse.ok) {
          console.error('Failed to fetch message details:', message.id);
          return null;
        }

        return await messageResponse.json();
      })
    );

    // Filter out failed requests
    const validMessages = messages.filter((msg): msg is GmailMessage => msg !== null);

    console.log(`Successfully fetched ${validMessages.length} messages`);
    return { messages: validMessages };

  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    // Use the user's session token for authorization
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      console.error('No session token available for refresh');
      return null;
    }

    const refreshResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/refresh-google-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      console.log('Successfully refreshed Google access token');
      return refreshData.access_token;
    } else {
      const errorData = await refreshResponse.json();
      console.error('Token refresh failed:', errorData);
      return null;
    }
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}
