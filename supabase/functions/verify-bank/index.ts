import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase clients
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

interface BankVerificationRequest {
  bankName: string;
  googleAccessToken: string;
}

interface BankEmailResult {
  success: boolean;
  messages?: any[];
  error?: string;
}

interface BankAccountExtractionResult {
  success: boolean;
  bankAccountNo?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await authenticateUser(req);
    const { bankName, googleAccessToken } = await req.json() as BankVerificationRequest;

    console.log(`Bank verification request - Bank: ${bankName}, User: ${user.id}`);

    if (!googleAccessToken) {
      throw new Error('Google access token is required. Please sign in with Google.');
    }

    const searchQuery = getBankSearchQuery(bankName);
    const emailResult = await fetchBankEmails(googleAccessToken, searchQuery);
    
    if (!emailResult.success) {
      return createErrorResponse(emailResult.error || 'Failed to fetch emails');
    }

    if (!emailResult.messages || emailResult.messages.length === 0) {
      return createErrorResponse(
        `No transaction emails found from ${bankName}. Please enable email alerts/notifications for your ${bankName} account and ensure you have recent transaction emails, then try again.`,
        false
      );
    }

    const accountResult = extractBankAccountNo(emailResult.messages[0], bankName);
    
    if (!accountResult.success || !accountResult.bankAccountNo) {
      return createErrorResponse(
        `Could not extract bank account number from ${bankName} email. Please ensure your email notifications are properly configured and contain transaction details, then try again.`,
        false
      );
    }

    const existingBank = await checkExistingBank(user.id, bankName, accountResult.bankAccountNo);
    if (existingBank) {
      return createErrorResponse(
        `${bankName.toUpperCase()} bank with account number ${accountResult.bankAccountNo} is already added.`,
        false
      );
    }

    const savedBank = await saveBankToDatabase(user.id, bankName, accountResult.bankAccountNo);
    
    console.log(`Bank verified and saved successfully: ${bankName} - ${accountResult.bankAccountNo}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${bankName.toUpperCase()} bank verified successfully!`,
      bank: savedBank
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in verify-bank function:', error);
    return createErrorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
});

// Helper Functions

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  return user;
}

function getBankSearchQuery(bankName: string): string {
  const normalizedBankName = bankName.toLowerCase();
  
  switch (normalizedBankName) {
    case 'hdfc':
      return 'from:alerts@hdfcbank.net available balance';
    default:
      throw new Error(`Bank ${bankName} is not supported yet`);
  }
}

function createErrorResponse(message: string, isServerError: boolean = true): Response {
  return new Response(JSON.stringify({ 
    success: false, 
    error: message 
  }), {
    status: isServerError ? 500 : 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function checkExistingBank(userId: string, bankName: string, bankAccountNo: string): Promise<boolean> {
  const { data: existingBank, error: checkError } = await supabaseAdmin
    .from('user_banks')
    .select('*')
    .eq('user_id', userId)
    .eq('bank_name', bankName.toUpperCase())
    .eq('bank_account_no', bankAccountNo)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking existing bank:', checkError);
    throw new Error('Failed to check existing bank records');
  }

  return !!existingBank;
}

async function saveBankToDatabase(userId: string, bankName: string, bankAccountNo: string) {
  const { data: savedBank, error: saveError } = await supabaseAdmin
    .from('user_banks')
    .insert({
      user_id: userId,
      bank_name: bankName.toUpperCase(),
      bank_account_no: bankAccountNo
    })
    .select()
    .single();

  if (saveError) {
    console.error('Error saving bank:', saveError);
    throw new Error('Failed to save bank information');
  }

  return savedBank;
}

async function fetchBankEmails(accessToken: string, query: string): Promise<BankEmailResult> {
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
      return {
        success: false,
        error: `Gmail API error: ${response.status} - ${errorText}`
      };
    }

    const data = await response.json();
    
    if (!data.messages || data.messages.length === 0) {
      return {
        success: true,
        messages: []
      };
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
      return {
        success: false,
        error: 'Failed to fetch message details'
      };
    }

    const messageData = await messageResponse.json();
    console.log(`Successfully fetched bank email for verification`);
    
    return {
      success: true,
      messages: [messageData]
    };

  } catch (error) {
    console.error('Error fetching bank emails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function extractBankAccountNo(message: any, bankName: string): BankAccountExtractionResult {
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

    console.log('Email content for bank account extraction:', emailContent.substring(0, 200));

    // HDFC bank account number pattern: looks for patterns like XX1234, XX****1234, etc.
    if (bankName.toLowerCase() === 'hdfc') {
      // Pattern for HDFC bank account numbers: XX followed by 4 digits or **** followed by 4 digits
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
            return {
              success: true,
              bankAccountNo: match
            };
          } else {
            // Extract last 4 digits and format as XX****
            const digits = match.replace(/X/g, '').replace(/\*/g, '');
            if (digits.length >= 4) {
              return {
                success: true,
                bankAccountNo: `XX${digits.slice(-4)}`
              };
            }
          }
        }
      }
    }

    console.log(`No bank account number pattern found for ${bankName}`);
    return {
      success: false,
      error: `No bank account number pattern found for ${bankName}`
    };
  } catch (error) {
    console.error('Error extracting card number:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}