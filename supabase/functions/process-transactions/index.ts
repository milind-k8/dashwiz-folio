import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Load the merchant reference data
const merchantReference = {
  "HDFC": {
    "patterns": [
      "HDFC Bank",
      "HDFCBANK",
      "HDFC BANK LTD"
    ],
    "debitKeywords": ["debited", "spent", "purchase", "payment", "withdrawal"],
    "creditKeywords": ["credited", "received", "deposit", "salary", "refund"]
  },
  "ICICI": {
    "patterns": [
      "ICICI Bank",
      "ICICIBANK",
      "ICICI BANK LTD"
    ],
    "debitKeywords": ["debited", "spent", "purchase", "payment", "withdrawal"],
    "creditKeywords": ["credited", "received", "deposit", "salary", "refund"]
  },
  "SBI": {
    "patterns": [
      "State Bank of India",
      "SBI",
      "SBIN"
    ],
    "debitKeywords": ["debited", "spent", "purchase", "payment", "withdrawal"],
    "creditKeywords": ["credited", "received", "deposit", "salary", "refund"]
  }
};

function extractTransactionDetails(snippet: string, subject: string = '') {
  const text = (snippet + ' ' + subject).toLowerCase();
  
  // Amount extraction
  const amountMatch = text.match(/(?:rs\.?\s*|inr\s*|₹\s*)([0-9,]+(?:\.[0-9]{2})?)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
  
  // Transaction type detection
  let transactionType = 'debit';
  for (const [bank, config] of Object.entries(merchantReference)) {
    if (config.creditKeywords.some(keyword => text.includes(keyword))) {
      transactionType = 'credit';
      break;
    }
  }
  
  // Merchant extraction
  let merchant = null;
  const merchantPatterns = [
    /at\s+([A-Z][A-Z0-9\s]+)/i,
    /merchant\s+([A-Z][A-Z0-9\s]+)/i,
    /to\s+([A-Z][A-Z0-9\s]+)/i
  ];
  
  for (const pattern of merchantPatterns) {
    const match = text.match(pattern);
    if (match) {
      merchant = match[1].trim();
      break;
    }
  }
  
  return {
    amount,
    transactionType,
    merchant
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bankName, googleAccessToken } = await req.json();
    
    if (!bankName || !googleAccessToken) {
      throw new Error('Missing required parameters: bankName, googleAccessToken');
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

    // Find or create bank record for user
    let bankRecord;
    const { data: existingBank } = await supabase
      .from('user_banks')
      .select('*')
      .eq('user_id', user.id)
      .eq('bank_name', bankName.toUpperCase())
      .single();

    if (existingBank) {
      bankRecord = existingBank;
    } else {
      // Create new bank record
      const { data: newBank, error: bankError } = await supabase
        .from('user_banks')
        .insert({
          user_id: user.id,
          bank_name: bankName.toUpperCase(),
          bank_account_no: 'Unknown' // Will be updated when we get more info
        })
        .select()
        .single();

      if (bankError) {
        throw new Error('Failed to create bank record');
      }
      bankRecord = newBank;
    }

    // Build Gmail API query for the specific bank and month
    const bankEmailMap: { [key: string]: string[] } = {
      'HDFC': ['noreply@hdfcbank.com', 'alerts@hdfcbank.com'],
      'ICICI': ['noreply@icicibank.com', 'alerts@icicibank.com'],
      'SBI': ['noreply@sbi.co.in', 'alerts@sbi.co.in']
    };

    const bankEmails = bankEmailMap[bankName.toUpperCase()] || [];
    if (bankEmails.length === 0) {
      throw new Error('Unsupported bank');
    }

    // Find the last transaction for this bank to determine starting point
    const { data: lastTransaction } = await supabase
      .from('transactions')
      .select('mail_time')
      .eq('bank_id', bankRecord.id)
      .order('mail_time', { ascending: false })
      .limit(1)
      .single();

    let startDate, endDate;
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
    const currentYear = now.getFullYear();
    
    if (lastTransaction) {
      // Start from the day after the last transaction
      const lastTransactionDate = new Date(lastTransaction.mail_time);
      lastTransactionDate.setDate(lastTransactionDate.getDate() + 1);
      startDate = `${lastTransactionDate.getFullYear()}/${String(lastTransactionDate.getMonth() + 1).padStart(2, '0')}/${String(lastTransactionDate.getDate()).padStart(2, '0')}`;
    } else {
      // If no transactions, start from beginning of current month
      startDate = `${currentYear}/${String(currentMonth).padStart(2, '0')}/01`;
    }
    
    // End at the end of current month
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    endDate = `${nextYear}/${String(nextMonth).padStart(2, '0')}/01`;
    
    const fromQuery = bankEmails.map(email => `from:${email}`).join(' OR ');
    let gmailQuery = `(${fromQuery})`;
    gmailQuery += ` after:${startDate} before:${endDate}`;
    
    gmailQuery += ` after:${startDate} before:${endDate}`;

    console.log('Gmail query:', gmailQuery);

    // Fetch Gmail messages
    const gmailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(gmailQuery)}&maxResults=100`,
      {
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
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
              'Authorization': `Bearer ${googleAccessToken}`,
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

    console.log(`Fetched ${messagesWithDetails.length} messages`);

    const processedTransactions = [];

    for (const message of messagesWithDetails) {
      if (!message.payload || !message.payload.headers) continue;

      // Extract email details
      const headers = message.payload.headers;
      const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
      const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
      const snippet = message.snippet || '';

      // Extract transaction details
      const { amount, transactionType, merchant } = extractTransactionDetails(snippet, subject);

      if (amount > 0) {
        // Check if transaction already exists
        const { data: existingTransaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('mail_id', message.id)
          .single();

        if (existingTransaction) {
          console.log('Transaction already exists for mail_id:', message.id);
          continue;
        }

        // Insert transaction
        const { data: transaction, error: insertError } = await supabase
          .from('transactions')
          .insert({
            bank_id: bankRecord.id,
            amount,
            transaction_type: transactionType,
            mail_time: new Date(date).toISOString(),
            merchant,
            snippet,
            mail_id: message.id
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting transaction:', insertError);
        } else {
          processedTransactions.push(transaction);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedCount: processedTransactions.length,
        transactions: processedTransactions 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing transactions:', error);
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