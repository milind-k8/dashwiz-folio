import { useState, useEffect } from 'react';
import { bankDataService } from '@/services/bankDataService';

interface Transaction {
  date: string;
  refId: string;
  amount: number;
  type: 'deposit' | 'withdrawl';
  closingBy: number;
  category: string;
  tags: string;
}

export const useBankData = () => {
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await bankDataService.loadBankData();
      setAvailableBanks(bankDataService.getAvailableBanks());
      setIsLoading(false);
    };

    loadData();
  }, []);

  const getFilteredData = (selectedBanks: string[], monthFilter: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month

    switch (monthFilter) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'previous-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'previous-3-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'previous-6-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const transactions = bankDataService.getFilteredTransactions(selectedBanks, startDate, endDate);
    
    // Calculate metrics
    const income = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'withdrawl')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = transactions.length > 0 ? transactions[0].closingBy : 0;
    const savings = income - expenses;

    // Group expenses by category
    const expenseCategories = transactions
      .filter(t => t.type === 'withdrawl')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      transactions,
      balance,
      income,
      expenses,
      savings,
      expenseCategories
    };
  };

  return {
    availableBanks,
    isLoading,
    getFilteredData
  };
};