import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Categories for merchants
const MERCHANT_CATEGORIES = [
  'foodDelivery',
  'onlineShopping',
  'groceries',
  'travel',
  'transportation',
  'entertainment',
  'banking',
  'healthcare',
  'education',
  'fashion',
  'utilities'
];
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { bankName, month, googleAccessToken, userId } = await req.json();
    let authenticatedUserId;
    // If userId is provided (scheduled call), use service role and skip JWT validation
    if (userId) {
      authenticatedUserId = userId;
      console.log(`Processing transactions via scheduled sync for user ${userId}`);
    } else {
      // Regular user call - validate JWT
      const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
      const authHeader = req.headers.get('Authorization');
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError || !user) {
        return new Response(JSON.stringify({
          error: 'Unauthorized'
        }), {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      authenticatedUserId = user.id;
    }
    if (!googleAccessToken) {
      return new Response(JSON.stringify({
        error: 'Google access token is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Start background processing with Google token
    // @ts-ignore EdgeRuntime is available in Deno Deploy
    const result = await processTransactionsBackground(authenticatedUserId, bankName, month, googleAccessToken);
    // If called from scheduled sync, return the actual result
    if (userId) {
      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // For regular calls, use background processing
    // @ts-ignore EdgeRuntime is available in Deno Deploy
    EdgeRuntime.waitUntil(processTransactionsBackground(authenticatedUserId, bankName, month, googleAccessToken));
    return new Response(JSON.stringify({
      success: true,
      message: 'Transaction processing started in background'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in process-transactions function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
async function processTransactionsBackground(userId, bankName, month, googleAccessToken) {
  try {
    console.log(`Processing transactions for user ${userId}, bank ${bankName}, month ${month}`);
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    let emailsProcessed = 0;
    let transactionsCreated = 0;
    // Step 1: Check if bank exists for user
    const { data: bank, error: bankError } = await supabaseClient.from('user_banks').select('*').eq('user_id', userId).ilike('bank_name', bankName).maybeSingle();
    if (bankError) {
      console.error('Error querying bank:', bankError);
      return;
    }
    if (!bank) {
      console.error(`Bank '${bankName}' not found for user ${userId}`);
      return;
    }
    // Step 2: Check for latest transaction date for that month
    const [monthNum, year] = month.split('/');
    const startDate = new Date(`${year}-${monthNum.padStart(2, '0')}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    const { data: latestTransaction } = await supabaseClient.from('transactions').select('mail_time').eq('bank_id', bank.id).gte('mail_time', startDate.toISOString()).lte('mail_time', endDate.toISOString()).order('mail_time', {
      ascending: false
    }).limit(1);
    // Step 3: Create Gmail query
    let gmailQuery;
    const bankEmail = getBankEmail(bankName);
    if (latestTransaction && latestTransaction.length > 0) {
      // Start from day after latest transaction
      const lastDate = new Date(latestTransaction[0].mail_time);
      lastDate.setDate(lastDate.getDate());
      const afterDate = formatDateForGmail(lastDate);
      const beforeDate = formatDateForGmail(endDate);
      gmailQuery = `from:(${bankEmail}) (debited OR credited OR balance) after:${afterDate} before:${beforeDate}`;
    } else {
      // Process entire month
      const afterDate = formatDateForGmail(startDate);
      const beforeDate = formatDateForGmail(endDate);
      gmailQuery = `from:(${bankEmail}) (debited OR credited OR balance) after:${afterDate} before:${beforeDate}`;
    }
    console.log('Gmail query:', gmailQuery);
    // Step 4: Fetch emails using the provided Google access token
    const emails = await fetchGmailMessages(googleAccessToken, gmailQuery);
    console.log(`Found ${emails.length} emails to process`);
    if (emails.length === 0) {
      return;
    }
    // Step 5: Process emails and extract transactions
    const transactions = await parseTransactions(emails);
    console.log(`Parsed ${transactions.length} transactions`);
    emailsProcessed = emails.length;
    // Step 6: Store transactions in database with category lookup
    const transactionsToInsert = await Promise.all(transactions.map(async (tx) => {
      let category = 'Other';
      
      // Look up category from merchants table if merchant exists
      if (tx.merchant && tx.merchant !== 'others' && tx.merchant !== 'bank') {
        const { data: merchantData } = await supabaseClient
          .from('merchants')
          .select('category')
          .eq('merchant_name', tx.merchant)
          .maybeSingle();
        
        if (merchantData && merchantData.category) {
          category = merchantData.category;
        }
      }
      
      return {
        mail_id: tx.id,
        bank_id: bank.id,
        mail_time: tx.mailTime,
        transaction_type: tx.transactionType,
        snippet: tx.snippet,
        amount: tx.amount || 0,
        merchant: tx.merchant,
        category: category
      };
    }));
    if (transactionsToInsert.length > 0) {
      const { error: insertError } = await supabaseClient.from('transactions').upsert(transactionsToInsert, {
        onConflict: 'mail_id',
        ignoreDuplicates: true
      });
      if (insertError) {
        console.error('Error inserting transactions:', insertError);
      } else {
        console.log(`Successfully stored ${transactionsToInsert.length} transactions`);
        transactionsCreated = transactionsToInsert.length;
      }
    }
    return {
      success: true,
      emailsProcessed,
      transactionsCreated
    };
  } catch (error) {
    console.error('Error in background processing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      emailsProcessed: 0,
      transactionsCreated: 0
    };
  }
}
function getBankEmail(bankName) {
  const bankEmails = {
    'hdfc': 'alerts@hdfcbank.net',
    'sbi': 'alerts@sbi.co.in',
    'icici': 'alerts@icicibank.com',
    'axis': 'alerts@axisbank.com'
  };
  return bankEmails[bankName.toLowerCase()] || `alerts@${bankName.toLowerCase()}bank.net`;
}
function formatDateForGmail(date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}
async function fetchGmailMessages(accessToken, query) {
  try {
    let currentAccessToken = accessToken;
    let response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`, {
      headers: {
        'Authorization': `Bearer ${currentAccessToken}`
      }
    });
    // If token expired, try to refresh it
    if (response.status === 401) {
      console.log('Access token expired during transaction processing, attempting refresh...');
      const refreshedToken = await refreshAccessTokenForProcessing();
      if (refreshedToken) {
        currentAccessToken = refreshedToken;
        response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`, {
          headers: {
            'Authorization': `Bearer ${currentAccessToken}`
          }
        });
      }
    }
    if (!response.ok) {
      console.error('Gmail API error:', response.status, await response.text());
      throw new Error(`Gmail API error: ${response.status}`);
    }
    const data = await response.json();
    const messageIds = data.messages || [];
    const messages = [];
    for (const msg of messageIds){
      let messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: {
          'Authorization': `Bearer ${currentAccessToken}`
        }
      });
      // Retry with refreshed token if needed
      if (messageResponse.status === 401 && currentAccessToken !== accessToken) {
        messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: {
            'Authorization': `Bearer ${currentAccessToken}`
          }
        });
      }
      if (messageResponse.ok) {
        const messageData = await messageResponse.json();
        messages.push({
          id: messageData.id,
          snippet: messageData.snippet,
          internalDate: messageData.internalDate
        });
      }
    }
    return messages;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    return [];
  }
}
async function parseTransactions(emails) {
  const results = [];
  const unknownMerchants = new Set();
  // First pass: parse all transactions
  for (const email of emails){
    const transaction = await parseTransaction(email);
    results.push(transaction);
    // Collect unknown merchants
    if (transaction.merchant && transaction.merchant !== 'others' && transaction.merchant !== 'bank' && !isPersonName(transaction.merchant)) {
      unknownMerchants.add(transaction.merchant);
    }
  }
  // Second pass: process unknown merchants with OpenAI
  if (unknownMerchants.size > 0) {
    console.log(`Processing ${unknownMerchants.size} unknown merchants with OpenAI`);
    const merchantCategories = await categorizeWithOpenAI(Array.from(unknownMerchants));
    // Store merchants in database
    await storeMerchants(merchantCategories);
  }
  return results;
}
async function parseTransaction(email) {
  const raw = email.snippet || "";
  const text = raw.toLowerCase();
  const mailTime = new Date(Number(email.internalDate)).toISOString();
  // Detect transaction type
  let transactionType = "others";
  if (text.includes("debited")) transactionType = "debit";
  else if (text.includes("credited")) transactionType = "credit";
  else if (text.includes("available balance") || text.includes("balance")) transactionType = "balance";
  // Extract amount
  let amount = null;
  if ([
    "debit",
    "credit",
    "balance"
  ].includes(transactionType)) {
    amount = extractAmountFromText(raw);
  }
  // Extract merchant
  let merchant = extractMerchant(raw);
  if (transactionType === "balance") merchant = "bank";
  return {
    mailTime,
    id: email.id,
    transactionType,
    snippet: email.snippet,
    amount,
    merchant
  };
}
function extractAmountFromText(text) {
  if (!text || typeof text !== "string") return null;
  text = text.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
  const patterns = [
    /(?:rs\.|rs|inr)[^\d\-]{0,10}([0-9]{1,3}(?:[0-9,]*)(?:\.[0-9]+)?)/i,
    /available balance[^\d]{0,60}([0-9,]+(?:\.[0-9]+)?)/i,
    /was[^\d]{0,10}([0-9,]+(?:\.[0-9]+)?)/i,
    /(?:amount|debit(?:ed)?|credit(?:ed)?)[^\d]{0,30}([0-9,]+(?:\.[0-9]+)?)/i,
    /([0-9,]+\.[0-9]{2,})/g
  ];
  for (const pattern of patterns){
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, "");
      const parsed = Number(cleaned);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return null;
}
function extractMerchant(raw) {
  let merchant = "others";
  // Extract person names from UPI transactions
  const personNameMatch = raw.match(/(?:to|by)\s+VPA\s+[^\s@]+@[^\s]+\s+(?:Ms\s+)?([A-Z][A-Z\s]+[A-Z])(?:\s+on\s+\d{2}-\d{2}-\d{2})/i);
  const creditPersonMatch = raw.match(/by VPA\s+[^\s@]+@[^\s]+\s+(?:Ms\s+)?([A-Z][A-Z\s]+[A-Z])(?:\s+on\s+\d{2}-\d{2}-\d{2})/i);
  const debitPersonMatch = raw.match(/to VPA\s+[^\s@]+@[^\s]+\s+(?:Ms\s+)?([A-Z][A-Z\s]+[A-Z])(?:\s+on\s+\d{2}-\d{2}-\d{2})/i);
  if (personNameMatch) {
    merchant = personNameMatch[1].trim();
  } else if (creditPersonMatch) {
    merchant = creditPersonMatch[1].trim();
  } else if (debitPersonMatch) {
    merchant = debitPersonMatch[1].trim();
  } else {
    // Handle debit card transactions
    const debitCardMatch = raw.match(/at\s+([A-Z][A-Z\s]+[A-Z])(?:\s+on\s+\d{2}\s+\w{3},\s+\d{4})/i);
    if (debitCardMatch) {
      merchant = debitCardMatch[1].trim();
    } else {
      // Fallback logic
      const text = raw.toLowerCase();
      const vpaMatch = text.match(/to vpa\s+([^\s@]+)/i);
      const atMatch = text.match(/at\s+([a-zA-Z0-9\s.&'-]+)/i);
      const payByMatch = text.match(/by vpa\s+([^\s@]+)/i);
      if (vpaMatch) merchant = vpaMatch[1];
      else if (payByMatch) merchant = payByMatch[1];
      else if (atMatch) merchant = atMatch[1].trim();
    }
  }
  // Clean merchant string
  merchant = (merchant || "others").replace(/[0-9.@_-].*$/, "");
  merchant = merchant.replace(/\b(ltd|limited|pvt|private|llp)\b/gi, "").trim();
  merchant = merchant.toLowerCase();
  if (!merchant) merchant = "others";
  return merchant;
}
function isPersonName(merchant) {
  const words = merchant.split(' ');
  if (!/^[a-z\s]+$/.test(merchant) || words.length < 2 || words.length > 4) {
    return false;
  }
  const businessTerms = [
    'ltd',
    'limited',
    'pvt',
    'private',
    'llp',
    'inc',
    'corp',
    'company',
    'music',
    'streaming',
    'ride',
    'booking',
    'services',
    'solutions',
    'technologies',
    'systems',
    'group',
    'holdings',
    'enterprises',
    'international',
    'global',
    'worldwide',
    'digital',
    'online',
    'web'
  ];
  for (const word of words){
    if (businessTerms.includes(word)) {
      return false;
    }
  }
  return true;
}
async function categorizeWithOpenAI(merchants) {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not found');
      return {};
    }
    const prompt = `You are a categorization assistant.  
Your task is to classify a merchant or business name into one of the following categories:  

["foodDelivery", "onlineShopping", "groceries", "travel", "transportation", "entertainment", "banking", "healthcare", "education", "fashion", "utilities", "other"]

---

## Rules

### 1. Person vs Company
- If the name looks like a **person’s name** → return "other".  
- If it is a company/merchant → continue.

### 2. Popular Identity Priority
- If a company has multiple meanings, **choose the most popular and widely known identity**.  
- Example: Apple → banking? No → Apple Inc (tech) → not "other".  
- Example: Abhibus → popular online bus ticket booking → must be "travel".  

### 3. Category Mapping
- **foodDelivery** → Zomato, Swiggy, Uber Eats (delivery platforms)  
- **onlineShopping** → Amazon, Flipkart, Myntra (e-commerce / marketplaces)  
- **groceries** → BigBasket, Instacart, DMart (grocery/supermarkets)  
- **travel** → Abhibus, MakeMyTrip, Yatra, OYO, Airbnb, Redbus (travel booking, hotels, airlines, bus/train booking)  
- **transportation** → Ola, Uber, Rapido (ride sharing, taxi, cab, logistics)  
- **entertainment** → Netflix, BookMyShow, Hotstar, Spotify (movies, music, gaming, streaming, events)  
- **banking** → HDFC Bank, SBI, Paytm, Razorpay (banks, cards, wallets, fintech)  
- **healthcare** → Apollo, 1mg, PharmEasy (hospitals, clinics, pharmacies)  
- **education** → Byju’s, Coursera, Udemy (schools, colleges, courses, edtech)  
- **fashion** → H&M, Zara, Nike, Myntra Fashion (clothing, shoes, accessories)  
- **utilities** → Jio, Airtel, Vodafone, BESCOM, MSEB (telecom, internet, electricity, water, gas, DTH)  
- **other** → Person names, unclear, or no strong match  

### 4. Fallback Rule
- Never return "other" for a known/popular brand.  
- Only use "other" if the name is **unidentifiable or definitely a person**.

---

Now, categorize strictly into one of the categories and return JSON only:

${merchants.join('\n')}

IMPORTANT: Respond with ONLY a valid JSON object. No additional text or explanation.  
Keys = merchant names, Values = their categories.  

Example format:  
{"merchant name": "category", "another merchant": "category"}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        let jsonStr = content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        return {};
      }
    }
    return {};
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return {};
  }
}
async function storeMerchants(merchantCategories) {
  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    
    // Only save merchants that are not categorized as "other"
    const merchants = Object.entries(merchantCategories)
      .filter(([name, category]) => (category as string).toLowerCase() !== 'other')
      .map(([name, category])=>({
        merchant_name: name,
        category: category
      }));
    if (merchants.length > 0) {
      const { error } = await supabaseClient.from('merchants').upsert(merchants, {
        onConflict: 'merchant_name',
        ignoreDuplicates: true
      });
      if (error) {
        console.error('Error storing merchants:', error);
      } else {
        console.log(`Successfully stored ${merchants.length} merchants`);
      }
    }
  } catch (error) {
    console.error('Error in storeMerchants:', error);
  }
}
async function refreshAccessTokenForProcessing() {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    // Get the current session to use the user's JWT
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      console.error('No session token available for refresh');
      return null;
    }
    const refreshResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/refresh-google-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      console.log('Successfully refreshed Google access token for processing');
      return refreshData.access_token;
    } else {
      const errorData = await refreshResponse.json();
      console.error('Token refresh failed during processing:', errorData);
      return null;
    }
  } catch (error) {
    console.error('Error refreshing access token during processing:', error);
    return null;
  }
}
