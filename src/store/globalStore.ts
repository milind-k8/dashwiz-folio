import { create } from 'zustand';

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
  
  // Actions
  setBanks: (banks: Bank[]) => void;
  addBank: (bank: Bank) => void;
  removeBank: (bankId: string) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

const initialState = {
  banks: [],
  transactions: [],
  loading: false,
  initialized: false,
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
  
  reset: () => set(initialState),
}));