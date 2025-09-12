import { create } from 'zustand';

export interface Transaction {
  id: string;
  name: string;
  company: string;
  amount: number;
  date: string;
  time: string;
  status: 'completed' | 'pending';
  type: 'income' | 'expense';
}

export interface FinancialData {
  balance: number;
  income: number;
  savings: number;
  expenses: number;
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
    savings: number;
  }>;
  expenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  transactions: Transaction[];
}

interface FinancialStore {
  data: FinancialData;
  updateBalance: (amount: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    name: 'Cameron Williamson',
    company: 'Figma',
    amount: -79.12,
    date: '10/03/22',
    time: '10:37:49 AM',
    status: 'pending',
    type: 'expense'
  },
  {
    id: '2',
    name: 'Courtney Henry',
    company: 'Netflix',
    amount: -50.21,
    date: '11/02/22',
    time: '12:22:31 AM',
    status: 'completed',
    type: 'expense'
  },
  {
    id: '3',
    name: 'Eleanor Pena',
    company: 'Spotify',
    amount: -32.18,
    date: '16/03/22',
    time: '04:18:56 AM',
    status: 'completed',
    type: 'expense'
  }
];

const mockMonthlyData = [
  { month: 'Jan', income: 2800, expenses: 1800, savings: 1000 },
  { month: 'Feb', income: 3200, expenses: 2100, savings: 1100 },
  { month: 'Mar', income: 2900, expenses: 1900, savings: 1000 },
  { month: 'Apr', income: 3400, expenses: 2200, savings: 1200 },
  { month: 'May', income: 3100, expenses: 2000, savings: 1100 },
  { month: 'Jun', income: 3300, expenses: 2100, savings: 1200 },
];

const mockExpenseCategories = [
  { category: 'Shopping', amount: 890, percentage: 35, color: '#4F46E5' },
  { category: 'Transportation', amount: 650, percentage: 25, color: '#06B6D4' },
  { category: 'Food', amount: 520, percentage: 20, color: '#10B981' },
  { category: 'Entertainment', amount: 380, percentage: 15, color: '#F59E0B' },
  { category: 'Other', amount: 130, percentage: 5, color: '#EF4444' },
];

export const useFinancialStore = create<FinancialStore>((set) => ({
  data: {
    balance: 2190.19,
    income: 3100.00,
    savings: 1875.10,
    expenses: 1224.90,
    monthlyData: mockMonthlyData,
    expenseCategories: mockExpenseCategories,
    transactions: mockTransactions,
  },
  updateBalance: (amount) =>
    set((state) => ({
      data: {
        ...state.data,
        balance: state.data.balance + amount,
      },
    })),
  addTransaction: (transaction) =>
    set((state) => ({
      data: {
        ...state.data,
        transactions: [
          {
            ...transaction,
            id: Date.now().toString(),
          },
          ...state.data.transactions,
        ],
      },
    })),
}));