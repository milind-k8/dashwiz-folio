import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalStore } from '@/store/globalStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useGlobalData = () => {
  const { user, session, loading: authLoading } = useAuth();
  const { 
    banks, 
    transactions,
    loading, 
    initialized, 
    autoProcessing,
    setBanks, 
    setTransactions,
    setLoading, 
    setInitialized,
    setAutoProcessing,
    reset 
  } = useGlobalStore();

  const fetchData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Call the single database function to get all data at once
      const { data, error } = await supabase
        .rpc('get_user_transactions_with_details', { 
          user_uuid: user.id, 
          months_back: 3 
        });

      if (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
        return;
      }

      // Extract unique banks from the transaction data
      const uniqueBanks = new Map();
      data?.forEach(item => {
        if (!uniqueBanks.has(item.bank_id)) {
          uniqueBanks.set(item.bank_id, {
            id: item.bank_id,
            user_id: user.id,
            bank_name: item.bank_name,
            bank_account_no: item.bank_account_no,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });

      setBanks(Array.from(uniqueBanks.values()));

      // Process transactions from the function result
      const processedTransactions = (data || []).map(item => ({
        id: item.transaction_id,
        bank_id: item.bank_id,
        amount: item.amount,
        transaction_type: item.transaction_type as 'debit' | 'credit' | 'balance',
        mail_time: item.mail_time,
        merchant: item.merchant,
        snippet: item.snippet,
        mail_id: item.mail_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category: item.category
      }));

      setTransactions(processedTransactions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error", 
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const processLatestTransactions = async () => {
    if (!user || !session?.provider_token || banks.length === 0) {
      return;
    }

    try {
      setAutoProcessing(true);
      
      // Get current month in MM/YYYY format
      const now = new Date();
      const currentMonth = `${now.getMonth() + 1}/${now.getFullYear()}`;
      
      console.log('Auto-processing transactions for current month:', currentMonth);
      
      // Process transactions for each bank
      const processingPromises = banks.map(async (bank) => {
        try {
          const { data, error } = await supabase.functions.invoke('process-transactions', {
            body: {
              bankName: bank.bank_name,
              month: currentMonth,
              googleAccessToken: session.provider_token
            }
          });
          
          if (error) {
            console.error(`Error processing transactions for ${bank.bank_name}:`, error);
          } else {
            console.log(`Started processing transactions for ${bank.bank_name}:`, data);
          }
        } catch (error) {
          console.error(`Error calling process-transactions for ${bank.bank_name}:`, error);
        }
      });
      
      // Wait for all processing calls to complete
      await Promise.allSettled(processingPromises);
      
      // Wait for background processing (15 seconds initial delay)
      console.log('Waiting for background processing to complete...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      // Retry mechanism - try up to 2 times with 10 second intervals
      for (let retry = 0; retry < 2; retry++) {
        const transactionCountBefore = transactions.length;
        
        // Refresh data to get new transactions
        await fetchData();
        
        // Check if we got new transactions
        if (useGlobalStore.getState().transactions.length > transactionCountBefore) {
          console.log('New transactions found after processing');
          toast({
            title: "Success",
            description: "Latest transactions processed successfully",
          });
          break;
        }
        
        // If no new transactions and not the last retry, wait and try again
        if (retry < 1) {
          console.log(`No new transactions found, retrying in 10 seconds... (attempt ${retry + 2})`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
      
    } catch (error) {
      console.error('Error in auto-processing:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process latest transactions",
        variant: "destructive",
      });
    } finally {
      setAutoProcessing(false);
    }
  };

  // Initialize data when user logs in
  useEffect(() => {
    if (authLoading) return;
    
    if (user && !initialized && !loading) {
      fetchData().then(() => {
        // After initial data load, auto-process latest transactions
        // Only if we have banks and Google access token
        const currentBanks = useGlobalStore.getState().banks;
        if (currentBanks.length > 0 && session?.provider_token && !autoProcessing) {
          console.log('Starting automatic transaction processing...');
          processLatestTransactions();
        }
      });
    } else if (!user) {
      reset();
    }
  }, [user, authLoading, initialized, loading]);

  return {
    banks,
    transactions,
    loading,
    initialized,
    autoProcessing,
    refetch: fetchData,
  };
};