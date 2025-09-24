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
    const { messages, bankId } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages data');
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

    const processedTransactions = [];

    for (const message of messages) {
      if (!message.payload || !message.payload.headers) continue;

      // Extract email details
      const headers = message.payload.headers;
      const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
      const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
      const snippet = message.snippet || '';

      // Extract transaction details
      const { amount, transactionType, merchant } = extractTransactionDetails(snippet, subject);

      if (amount > 0) {
        // Insert transaction
        const { data: transaction, error: insertError } = await supabase
          .from('transactions')
          .insert({
            bank_id: bankId,
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