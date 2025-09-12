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
    const toTitleCase = (value: string) => {
      if (!value) return value;
      return value
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

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

    // Group expenses by category and collect tags
    const expenseCategoryTotals = transactions
      .filter(t => t.type === 'withdrawl')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const expenseCategoryTags = transactions
      .filter(t => t.type === 'withdrawl')
      .reduce((acc, t) => {
        const list = (t.tags || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        const set = acc[t.category] || new Set<string>();
        list.forEach(tag => set.add(tag));
        acc[t.category] = set;
        return acc;
      }, {} as Record<string, Set<string>>);

    const totalExpenses = Object.values(expenseCategoryTotals).reduce((s, v) => s + v, 0);
    const colorPalette = [
      '#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#3B82F6', '#F472B6', '#FB7185'
    ];
    const expenseCategoriesList = Object.entries(expenseCategoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount], idx) => ({
        category: toTitleCase(category),
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
        color: colorPalette[idx % colorPalette.length],
        tags: Array.from(expenseCategoryTags[category] || new Set<string>()).map(toTitleCase)
      }));

    // Build monthly series for charts
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map<string, { income: number; expenses: number }>();

    // Initialize months in range to ensure continuous series
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endCursor = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    while (cursor <= endCursor) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { income: 0, expenses: 0 });
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const t of transactions) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = monthlyMap.get(key) || { income: 0, expenses: 0 };
      if (t.type === 'deposit') {
        bucket.income += t.amount;
      } else if (t.type === 'withdrawl') {
        bucket.expenses += t.amount;
      }
      monthlyMap.set(key, bucket);
    }

    const monthlyData = Array.from(monthlyMap.entries())
      .sort((a, b) => {
        const [ay, am] = a[0].split('-').map(Number);
        const [by, bm] = b[0].split('-').map(Number);
        return ay === by ? am - bm : ay - by;
      })
      .map(([key, vals]) => {
        const [, monthIndexStr] = key.split('-');
        const monthIndex = Number(monthIndexStr);
        const savingsVal = vals.income - vals.expenses;
        return {
          month: monthNames[monthIndex],
          income: vals.income,
          expenses: vals.expenses,
          savings: savingsVal,
        };
      });

    return {
      transactions,
      balance,
      income,
      expenses,
      savings,
      expenseCategories: expenseCategoryTotals,
      expenseCategoriesList,
      monthlyData,
    };
  };

  return {
    availableBanks,
    isLoading,
    getFilteredData
  };
};