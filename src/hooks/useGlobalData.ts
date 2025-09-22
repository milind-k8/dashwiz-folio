import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalStore } from '@/store/globalStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useGlobalData = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    banks, 
    transactions,
    loading, 
    initialized, 
    setBanks, 
    setTransactions,
    setLoading, 
    setInitialized,
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

  // Initialize data when user logs in
  useEffect(() => {
    if (authLoading) return;
    
    if (user && !initialized) {
      fetchData();
    } else if (!user) {
      reset();
    }
  }, [user, authLoading, initialized]);

  return {
    banks,
    transactions,
    loading,
    initialized,
    refetch: fetchData,
  };
};