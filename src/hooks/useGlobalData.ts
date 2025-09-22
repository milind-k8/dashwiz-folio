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
      
      // Fetch banks
      const { data: banksData, error: banksError } = await supabase
        .from('user_banks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (banksError) {
        console.error('Error fetching banks:', banksError);
        toast({
          title: "Error",
          description: "Failed to load bank data",
          variant: "destructive",
        });
        return;
      }

      setBanks(banksData || []);

      // Fetch transactions for last 3 months with merchant category
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          bank_id,
          amount,
          transaction_type,
          mail_time,
          merchant,
          snippet,
          mail_id,
          created_at,
          updated_at
        `)
        .in('bank_id', (banksData || []).map(bank => bank.id))
        .gte('mail_time', threeMonthsAgo.toISOString())
        .order('mail_time', { ascending: false });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        toast({
          title: "Error",
          description: "Failed to load transaction data",
          variant: "destructive",
        });
        return;
      }

      // Fetch merchant categories separately
      const merchantNames = [...new Set(transactionsData?.map(t => t.merchant).filter(Boolean))];
      const { data: merchantsData } = await supabase
        .from('merchants')
        .select('merchant_name, category')
        .in('merchant_name', merchantNames);

      // Create merchant category lookup
      const merchantCategories = merchantsData?.reduce((acc, merchant) => {
        acc[merchant.merchant_name] = merchant.category;
        return acc;
      }, {} as Record<string, string>) || {};

      // Process transactions to include category
      const processedTransactions = (transactionsData || []).map(transaction => ({
        ...transaction,
        category: transaction.merchant ? (merchantCategories[transaction.merchant] || 'Other') : 'Other'
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