import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bankName, googleAccessToken } = await req.json();
    
    if (!bankName || !googleAccessToken) {
      throw new Error('Bank name and Google access token are required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Generate Gmail search query based on bank name
    let gmailQuery = '';
    let supportedBank = '';
    
    if (bankName.toLowerCase().includes('hdfc')) {
      gmailQuery = 'from:(alerts@hdfcbank.net) balance';
      supportedBank = 'HDFC Bank';
    } else if (bankName.toLowerCase().includes('icici')) {
      gmailQuery = 'from:(imobile@icicibank.com) balance';
      supportedBank = 'ICICI Bank';
    } else if (bankName.toLowerCase().includes('sbi') || bankName.toLowerCase().includes('state bank')) {
      gmailQuery = 'from:(sbi.card@sbi.co.in) balance';
      supportedBank = 'State Bank of India';
    } else {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Bank not supported. Currently supporting HDFC, ICICI, and SBI banks.' 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get user email for the query
    const userEmail = user.email;
    if (!userEmail) {
      throw new Error('User email not found');
    }

    // Construct final Gmail query with user email
    const finalQuery = `${gmailQuery} to:(${userEmail})`;

    // Fetch messages from Gmail
    const gmailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(finalQuery)}&maxResults=1`,
      {
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!gmailResponse.ok) {
      throw new Error(`Gmail API error: ${gmailResponse.status}`);
    }

    const gmailData = await gmailResponse.json();
    
    if (!gmailData.messages || gmailData.messages.length === 0) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'No recent balance emails found from this bank. Please check if you have recent transaction emails.' 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get the latest message details
    const messageId = gmailData.messages[0].id;
    const messageResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!messageResponse.ok) {
      throw new Error(`Gmail message API error: ${messageResponse.status}`);
    }

    const messageData = await messageResponse.json();
    const emailContent = messageData.snippet || '';

    // Extract account number from email content using regex
    const accountNumberRegex = /(?:acc?(?:ount)?[\s\-:]*(?:no|number)?[\s\-:]*|a\/c[\s\-:]*(?:no|number)?[\s\-:]*|account[\s\-:]*|a\/c[\s\-:]*)[^\d]*(\d{9,18})/i;
    const accountMatch = emailContent.match(accountNumberRegex);
    
    if (!accountMatch || !accountMatch[1]) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Could not find a valid account number in the recent email. Please ensure you have recent bank emails with account details.' 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    const accountNumber = accountMatch[1];

    // Basic account number validation (length and numeric check)
    const isValidAccountNumber = /^[0-9]{9,18}$/.test(accountNumber.replace(/\s/g, ''));

    if (!isValidAccountNumber) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Invalid account number format. Account number should be 9-18 digits.' 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Check if bank already exists for this user
    const { data: existingBank, error: checkError } = await supabase
      .from('user_banks')
      .select('id')
      .eq('user_id', user.id)
      .eq('bank_account_no', accountNumber)
      .single();

    if (existingBank) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'This bank account is already added to your profile.' 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: 'Bank details are valid and can be added.',
        accountNumber: accountNumber,
        bankName: supportedBank
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error verifying bank:', error);
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