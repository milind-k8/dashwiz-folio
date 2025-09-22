// transactionParser.js
import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MERCHANT_FILE = "merchantMap.json";

// Load local merchant cache
let merchantMap = {};
if (fs.existsSync(MERCHANT_FILE)) {
  merchantMap = JSON.parse(fs.readFileSync(MERCHANT_FILE, "utf8"));
}


// --------- Check if merchant is a person name ---------
function isPersonName(merchant) {
  // More strict person name detection
  const words = merchant.split(' ');
  
  // Must be 2-4 words, all lowercase letters and spaces only
  if (!/^[a-z\s]+$/.test(merchant) || words.length < 2 || words.length > 4) {
    return false;
  }
  
  // Exclude business-related terms
  const businessTerms = [
    'ltd', 'limited', 'pvt', 'private', 'llp', 'inc', 'corp', 'company',
    'music', 'streaming', 'ride', 'booking', 'services', 'solutions',
    'technologies', 'systems', 'group', 'holdings', 'enterprises',
    'international', 'global', 'worldwide', 'digital', 'online', 'web'
  ];
  
  // If any word matches business terms, it's not a person
  for (const word of words) {
    if (businessTerms.includes(word)) {
      return false;
    }
  }
  
  // Additional check: if it contains common business name patterns
  if (merchant.includes('music') || 
      merchant.includes('streaming') || 
      merchant.includes('ride') || 
      merchant.includes('booking') ||
      merchant.includes('services')) {
    return false;
  }
  
  return true;
}

// --------- Categorize Merchant (Cache + Fallback) ---------
async function categorizeMerchant(merchant) {
  merchant = (merchant || "").toLowerCase();

  // Step 1: Check if it's a person name
  if (isPersonName(merchant)) {
    return "person";
  }

  // Step 2: Check in merchant map (businesses only)
  if (merchantMap[merchant]) {
    return merchantMap[merchant];
  }

  // Step 3: Default to "others" for unknown merchants
  return "others";
}

// --------- Batch process unknown merchants with LLM ---------
async function processUnknownMerchants(unknownMerchants) {
  if (unknownMerchants.length === 0) return;

  try {
    const prompt = `Analyze the following list of merchant/business names and identify which ones are actual businesses/companies vs person names.

For each business/company, provide the category from this list:
- foodDelivery (food delivery, restaurants, cafes, fast food)
- onlineShopping (e-commerce, online stores, marketplaces)
- groceries (grocery stores, supermarkets, food retail)
- travel (travel booking, airlines, hotels, transport)
- travel (taxi, ride sharing, transportation services)
- entertainment (movies, music, gaming, streaming, events)
- banking (financial services, payments, fintech)
- healthcare (hospitals, pharmacies, medical services)
- education (schools, courses, educational services)
- fashion (clothing, accessories, beauty)
- utilities (telecom, electricity, water, internet)

Merchant names to analyze:
${unknownMerchants.join('\n')}

IMPORTANT: Respond with ONLY a valid JSON object. No additional text or explanation. Keys are merchant names and values are their categories. Only include merchants that are actual businesses/companies. Skip person names.

Example format:
{"merchant name": "category", "another merchant": "category"}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    if (completion.choices?.[0]?.message?.content) {
      const response = completion.choices[0].message.content.trim();
      console.log("LLM Response:", response);
      
      try {
        // Try to extract JSON from response if it's wrapped in other text
        let jsonStr = response;
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        
        const newMerchants = JSON.parse(jsonStr);
        
        // Add new merchants to the map
        Object.entries(newMerchants).forEach(([merchant, category]) => {
          if (merchantMap[merchant] !== category) {
            merchantMap[merchant] = category;
            console.log(`Added new merchant: ${merchant} → ${category}`);
          }
        });
        
        // Save updated map
        fs.writeFileSync(MERCHANT_FILE, JSON.stringify(merchantMap, null, 2));
        console.log(`✅ Added ${Object.keys(newMerchants).length} new merchants to map`);
        
      } catch (parseError) {
        console.error("Failed to parse LLM response:", parseError.message);
        console.error("Raw response:", response);
      }
    }
  } catch (error) {
    console.error("Error processing unknown merchants:", error.message);
  }
}

// --------- Robust amount extractor ---------
function extractAmountFromText(text) {
  if (!text || typeof text !== "string") return null;
  // normalize multiple spaces and weird unicode spaces
  text = text.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();

  // Try several targeted regexes in order (most specific → general)
  const patterns = [
    // currency right before number (handles "INR 1,23,456.78" and "Rs. 1,23,456.78")
    /(?:rs\.|rs|inr)[^\d\-]{0,10}([0-9]{1,3}(?:[0-9,]*)(?:\.[0-9]+)?)/i,

    // available balance followed shortly by a number
    /available balance[^\d]{0,60}([0-9,]+(?:\.[0-9]+)?)/i,

    // phrases like "was Rs 1,23,456.78" or "was 1,23,456.78"
    /was[^\d]{0,10}([0-9,]+(?:\.[0-9]+)?)/i,

    // any explicit currency token followed by number (another attempt)
    /(?:amount|debit(?:ed)?|credit(?:ed)?)[^\d]{0,30}([0-9,]+(?:\.[0-9]+)?)/i,

    // generic: first decimal number with 2+ decimals (e.g., 123.45)
    /([0-9,]+\.[0-9]{2,})/g
  ];

  // Try sequential patterns
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const cleaned = m[1].replace(/,/g, "");
      const parsed = Number(cleaned);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  // If still no match, find all decimal-looking tokens and pick the most plausible
  const decimals = text.match(/[0-9,]+\.[0-9]{2}/g);
  if (decimals && decimals.length) {
    // pick the one with most digits (likely the real amount, not 'xx6661' or '18' from date)
    let best = decimals.reduce((a, b) =>
      a.replace(/,/g, "").length >= b.replace(/,/g, "").length ? a : b
    );
    return Number(best.replace(/,/g, ""));
  }

  // Fallback: find all integer-like tokens with length >=3 and pick the largest numeric value
  const ints = text.match(/[0-9,]{3,}/g);
  if (ints && ints.length) {
    let best = ints.reduce((a, b) =>
      Number(b.replace(/,/g, "")) > Number(a.replace(/,/g, "")) ? b : a
    );
    return Number(best.replace(/,/g, ""));
  }

  return null;
}

// --------- Parse Single Mail ---------
async function parseTransaction(mail) {
    const raw = mail.snippet || "";
    const text = raw.toLowerCase();
  
    const mailTime = new Date(Number(mail.internalDate)).toISOString();
  
    // Detect transactionType
    let transactionType = "others";
    if (text.includes("debited")) transactionType = "debit";
    else if (text.includes("credited")) transactionType = "credit";
    else if (text.includes("available balance") || text.includes("balance")) transactionType = "balance";
  
    // Only extract amount for debit / credit / balance
    let amount = null;
    if (["debit", "credit", "balance"].includes(transactionType)) {
      amount = extractAmountFromText(raw); // use robust extractor
    } else {
      amount = null; // or 0 if you prefer
    }
  
    // Extract merchant - prioritize person names over VPA identifiers
    let merchant = "others";
    
    // First try to extract person names from UPI transactions
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
      // Handle debit card transactions (format: "at MERCHANT NAME on DATE")
      const debitCardMatch = raw.match(/at\s+([A-Z][A-Z\s]+[A-Z])(?:\s+on\s+\d{2}\s+\w{3},\s+\d{4})/i);
      if (debitCardMatch) {
        merchant = debitCardMatch[1].trim();
      } else {
        // Fallback to old logic for other transactions
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
    if (transactionType === "balance") merchant = "bank";
  
    // Categorize
    let category =
      transactionType === "balance" ? "balance" : await categorizeMerchant(merchant);
  
    return {
      mailTime,
      id: mail.id,
      transactionType,
      snippet: mail.snippet,
      amount,
      merchant,
      category
    };
  }
  

// --------- Parse List of Mails (sequential) ---------
async function parseMails(mailList) {
  const results = [];
  const unknownMerchants = new Set();
  
  // First pass: parse all transactions and collect unknown merchants
  for (const mail of mailList) {
    const result = await parseTransaction(mail);
    results.push(result);
    
    // Collect merchants categorized as "others" (excluding persons)
    if (result.category === "others" && !isPersonName(result.merchant)) {
      unknownMerchants.add(result.merchant);
    }
  }
  
  // Second pass: batch process unknown merchants with LLM
  if (unknownMerchants.size > 0) {
    console.log(`\n🔍 Found ${unknownMerchants.size} unknown merchants, processing with LLM...`);
    await processUnknownMerchants(Array.from(unknownMerchants));
    
    // Third pass: re-categorize transactions with updated merchant map
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.category === "others" && !isPersonName(result.merchant)) {
        const newCategory = merchantMap[result.merchant] || "others";
        if (newCategory !== "others") {
          results[i].category = newCategory;
          console.log(`Updated ${result.merchant}: others → ${newCategory}`);
        }
      }
    }
  }
  
  return results;
}

export { parseMails };
