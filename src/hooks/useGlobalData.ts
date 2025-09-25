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
      
      // Fetch all user banks first
      const { data: userBanks, error: banksError } = await supabase
        .from('user_banks')
        .select('*')
        .eq('user_id', user.id);

      if (banksError) {
        console.error('Error fetching banks:', banksError);
        toast({
          title: "Error",
          description: "Failed to load banks",
          variant: "destructive",
        });
        return;
      }

      setBanks(userBanks || []);
      
      // Call the database function to get transaction data
      const { data, error } = await supabase
        .rpc('get_user_transactions_with_details', { 
          user_uuid: user.id, 
          months_back: 3 
        });

      if (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: "Error",
          description: "Failed to load transaction data",
          variant: "destructive",
        });
        return;
      }

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
    
    if (user && !initialized && !loading) {
      fetchData();
    } else if (!user) {
      reset();
    }
  }, [user, authLoading, initialized, loading]);

  return {
    banks,
    transactions,
    loading,
    initialized,
    refetch: fetchData,
  };
};