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

interface BankVerificationRequest {
  bankName: string;
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

    const { bankName }: BankVerificationRequest = await req.json();

    console.log(`Bank verification request - Bank: ${bankName}, User: ${user.id}`);

    // Get Google access token from user session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      throw new Error('No active session found. User needs to sign in.');
    }

    const googleAccessToken = sessionData.session.provider_token;

    if (!googleAccessToken) {
      throw new Error('No Google access token found. Please sign out and sign in again with Google.');
    }

    // Search for bank emails based on bank name
    let searchQuery = '';
    
    if (bankName.toLowerCase() === 'hdfc') {
      searchQuery = 'from:alerts@hdfcbank.net available balance';
    } else {
      throw new Error(`Bank ${bankName} is not supported yet`);
    }

    // Fetch Gmail messages
    const gmailResult = await fetchBankEmails(googleAccessToken, searchQuery);
    
    if (!gmailResult.messages || gmailResult.messages.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `No emails found from ${bankName}. Please make sure you have balance alerts enabled.` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract card number from the first email
    const cardNumber = extractCardNumber(gmailResult.messages[0], bankName);
    
    if (!cardNumber) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Could not extract card number from ${bankName} email.` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if bank already exists for user
    const { data: existingBank, error: checkError } = await supabase
      .from('user_banks')
      .select('*')
      .eq('user_id', user.id)
      .eq('bank_name', bankName.toUpperCase())
      .eq('card_number', cardNumber)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing bank:', checkError);
      throw new Error('Failed to check existing bank records');
    }

    if (existingBank) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `${bankName.toUpperCase()} bank with card number ${cardNumber} is already added.` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save bank to database
    const { data: savedBank, error: saveError } = await supabase
      .from('user_banks')
      .insert({
        user_id: user.id,
        bank_name: bankName.toUpperCase(),
        card_number: cardNumber
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving bank:', saveError);
      throw new Error('Failed to save bank information');
    }

    console.log(`Bank verified and saved successfully: ${bankName} - ${cardNumber}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${bankName.toUpperCase()} bank verified successfully!`,
      bank: savedBank
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in verify-bank function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchBankEmails(accessToken: string, query: string) {
  try {
    const params = new URLSearchParams({
      maxResults: '1',
      q: query
    });

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

    // Fetch detailed message data for the first message
    const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${data.messages[0].id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!messageResponse.ok) {
      console.error('Failed to fetch message details:', data.messages[0].id);
      return { messages: [] };
    }

    const messageData = await messageResponse.json();
    console.log(`Successfully fetched bank email for verification`);
    
    return { messages: [messageData] };

  } catch (error) {
    console.error('Error fetching bank emails:', error);
    throw error;
  }
}

function extractCardNumber(message: any, bankName: string): string | null {
  try {
    // Get email content from snippet or payload
    let emailContent = message.snippet || '';
    
    // Try to get more detailed content from payload
    if (message.payload && message.payload.parts) {
      const textPart = message.payload.parts.find((part: any) => 
        part.mimeType === 'text/plain' || part.mimeType === 'text/html'
      );
      if (textPart && textPart.body && textPart.body.data) {
        try {
          emailContent += ' ' + atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } catch (e) {
          console.log('Could not decode email body, using snippet only');
        }
      }
    }

    console.log('Email content for card extraction:', emailContent.substring(0, 200));

    // HDFC card number pattern: looks for patterns like XX1234, XX****1234, etc.
    if (bankName.toLowerCase() === 'hdfc') {
      // Pattern for HDFC card numbers: XX followed by 4 digits or **** followed by 4 digits
      const patterns = [
        /XX(\*{4}|\d{4})/g,  // XX**** or XX1234
        /\*{4}(\d{4})/g,     // ****1234
        /X{2}(\d{4})/g,      // XX1234
      ];

      for (const pattern of patterns) {
        const matches = emailContent.match(pattern);
        if (matches && matches.length > 0) {
          const match = matches[0];
          // Format as XX**** where **** are the last 4 digits
          if (match.includes('****')) {
            return match;
          } else {
            // Extract last 4 digits and format as XX****
            const digits = match.replace(/X/g, '').replace(/\*/g, '');
            if (digits.length >= 4) {
              return `XX${digits.slice(-4)}`;
            }
          }
        }
      }
    }

    console.log(`No card number pattern found for ${bankName}`);
    return null;
  } catch (error) {
    console.error('Error extracting card number:', error);
    return null;
  }
}