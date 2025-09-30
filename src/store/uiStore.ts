import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isBalanceMasked: boolean;
  toggleBalanceMasked: () => void;
  setBalanceMasked: (value: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isBalanceMasked: false,
      toggleBalanceMasked: () => set({ isBalanceMasked: !get().isBalanceMasked }),
      setBalanceMasked: (value: boolean) => set({ isBalanceMasked: value }),
    }),
    {
      name: 'ui:preferences',
      partialize: (state) => ({ isBalanceMasked: state.isBalanceMasked }),
      version: 1,
    }
  )
);


