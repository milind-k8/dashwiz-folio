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

    // Get request parameters
    let maxResults = 10;
    let query = '';
    let action = 'list';
    let emailData = null;

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      maxResults = parseInt(searchParams.get('maxResults') || '10');
      query = searchParams.get('q') || '';
      action = searchParams.get('action') || 'list';
    } else if (req.method === 'POST') {
      const body = await req.json();
      maxResults = body.maxResults || 10;
      query = body.query || '';
      action = body.action || 'send';
      emailData = body;
    }

    console.log(`Gmail API request - Method: ${req.method}, Action: ${action}, MaxResults: ${maxResults}, Query: ${query}, User: ${user.id}`);

    // Get user's Google access token from Supabase session
    const { data: session } = await supabase.auth.getSession();
    const googleAccessToken = session?.session?.provider_token;

    if (!googleAccessToken) {
      throw new Error('No Google access token found. User needs to sign in with Google.');
    }

    let result;
    
    switch (action) {
      case 'list':
        result = await fetchMessages(googleAccessToken, maxResults, query);
        break;
      case 'send':
        if (!emailData) {
          throw new Error('Email data is required for send action');
        }
        result = await sendEmail(googleAccessToken, emailData.to, emailData.subject, emailData.body);
        break;
      default:
        throw new Error('Invalid action. Supported actions: list, send');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gmail function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
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

    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gmail API error:', response.status, errorText);
      throw new Error(`Gmail API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.messages || data.messages.length === 0) {
      return { messages: [] };
    }

    // Fetch detailed message data
    const messages = await Promise.all(
      data.messages.map(async (message: { id: string }) => {
        const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

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

async function sendEmail(accessToken: string, to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string }> {
  try {
    // Create the email content
    const emailContent = [
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');

    // Encode the email in base64url format
    const encodedEmail = btoa(emailContent)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gmail send API error:', response.status, errorText);
      throw new Error(`Failed to send email: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Successfully sent email with message ID: ${data.id}`);
    
    return { success: true, messageId: data.id };

  } catch (error) {
    console.error('Error sending Gmail message:', error);
    throw error;
  }
}