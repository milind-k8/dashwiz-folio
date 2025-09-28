import { useEffect } from 'react';
import { useGlobalStore } from '@/store/globalStore';
import { toast } from '@/hooks/use-toast';

export const useGlobalData = () => {
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
    reset,
    refreshData
  } = useGlobalStore();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Use the refreshData function from the store which loads demo data
      await refreshData();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error", 
        description: "Failed to load demo data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  // Initialize demo data on component mount
  useEffect(() => {
    if (!initialized && !loading) {
      fetchData();
    }
  }, [initialized, loading]);

  return {
    banks,
    transactions,
    loading,
    initialized,
    refetch: fetchData,
  };
};