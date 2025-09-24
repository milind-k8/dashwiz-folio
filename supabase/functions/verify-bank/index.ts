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
    const { bankName, accountNumber } = await req.json();
    
    if (!bankName || !accountNumber) {
      throw new Error('Bank name and account number are required');
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

    // For now, we'll do basic validation
    // In a real implementation, you might want to integrate with bank APIs
    const supportedBanks = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'SBI'];
    const isValidBank = supportedBanks.some(bank => 
      bankName.toLowerCase().includes(bank.toLowerCase())
    );

    if (!isValidBank) {
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
        message: 'Bank details are valid and can be added.' 
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