import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Bank {
  id: string;
  user_id: string;
  bank_name: string;
  bank_account_no: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  bank_id: string;
  amount: number;
  transaction_type: 'debit' | 'credit' | 'balance';
  mail_time: string;
  merchant: string | null;
  snippet: string | null;
  mail_id: string;
  created_at: string;
  updated_at: string;
  category?: string | null;
}

interface GlobalStore {
  // Data state
  banks: Bank[];
  transactions: Transaction[];
  loading: boolean;
  initialized: boolean;
  refreshing: boolean;
  autoProcessing: boolean;
  
  // Actions
  setBanks: (banks: Bank[]) => void;
  addBank: (bank: Bank) => void;
  removeBank: (bankId: string) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setAutoProcessing: (autoProcessing: boolean) => void;
  refreshData: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  banks: [],
  transactions: [],
  loading: false,
  initialized: false,
  refreshing: false,
  autoProcessing: false,
};

export const useGlobalStore = create<GlobalStore>((set, get) => ({
  ...initialState,
  
  setBanks: (banks) => set({ banks }),
  
  addBank: (bank) => set((state) => ({ 
    banks: [...state.banks, bank] 
  })),
  
  removeBank: (bankId) => set((state) => ({ 
    banks: state.banks.filter(bank => bank.id !== bankId) 
  })),
  
  setTransactions: (transactions) => set({ transactions }),
  
  addTransaction: (transaction) => set((state) => ({ 
    transactions: [...state.transactions, transaction] 
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setInitialized: (initialized) => set({ initialized }),
  
  setRefreshing: (refreshing) => set({ refreshing }),
  
  setAutoProcessing: (autoProcessing) => set({ autoProcessing }),
  
  refreshData: async () => {
    const state = get();
    if (state.refreshing) return; // Prevent multiple simultaneous refreshes
    
    try {
      set({ refreshing: true });
      
      // Get current user from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Call the database function to get all data at once
      const { data, error } = await supabase
        .rpc('get_user_transactions_with_details', { 
          user_uuid: user.id, 
          months_back: 3 
        });

      if (error) {
        console.error('Error refreshing data:', error);
        toast({
          title: "Error",
          description: "Failed to refresh data",
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

      const banks = Array.from(uniqueBanks.values());

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

      set({ 
        banks,
        transactions: processedTransactions,
        initialized: true 
      });
      
      toast({
        title: "Success",
        description: "Data refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error", 
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      set({ refreshing: false });
    }
  },
  
  reset: () => set(initialState),
}));