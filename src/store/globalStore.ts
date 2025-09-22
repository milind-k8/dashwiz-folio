import { create } from 'zustand';

export interface Bank {
  id: string;
  user_id: string;
  bank_name: string;
  bank_account_no: string;
  created_at: string;
  updated_at: string;
}

interface GlobalStore {
  // Data state
  banks: Bank[];
  loading: boolean;
  initialized: boolean;
  
  // Actions
  setBanks: (banks: Bank[]) => void;
  addBank: (bank: Bank) => void;
  removeBank: (bankId: string) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

const initialState = {
  banks: [],
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
  
  setLoading: (loading) => set({ loading }),
  
  setInitialized: (initialized) => set({ initialized }),
  
  reset: () => set(initialState),
}));