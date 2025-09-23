import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FilterStore {
  // Filter state
  selectedBank: string;
  selectedDuration: string;
  
  // Actions
  setSelectedBank: (bank: string) => void;
  setSelectedDuration: (duration: string) => void;
  setFilters: (bank: string, duration: string) => void;
  reset: () => void;
}

const initialState = {
  selectedBank: '',
  selectedDuration: 'current-month',
};

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSelectedBank: (bank) => set({ selectedBank: bank }),
      
      setSelectedDuration: (duration) => set({ selectedDuration: duration }),
      
      setFilters: (bank, duration) => set({ 
        selectedBank: bank, 
        selectedDuration: duration 
      }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'pisa-wise-filters',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedBank: state.selectedBank,
        selectedDuration: state.selectedDuration,
      }),
    }
  )
);