import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalStore } from '@/store/globalStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useGlobalData = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    banks, 
    loading, 
    initialized, 
    setBanks, 
    setLoading, 
    setInitialized,
    reset 
  } = useGlobalStore();

  const fetchBanks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_banks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching banks:', error);
        toast({
          title: "Error",
          description: "Failed to load bank data",
          variant: "destructive",
        });
        return;
      }

      setBanks(data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
      toast({
        title: "Error", 
        description: "Failed to load bank data",
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
      fetchBanks();
    } else if (!user) {
      reset();
    }
  }, [user, authLoading, initialized]);

  return {
    banks,
    loading,
    initialized,
    refetch: fetchBanks,
  };
};