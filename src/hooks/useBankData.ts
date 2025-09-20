import { useState, useEffect, useMemo, useCallback } from 'react';
import { bankDataService } from '@/services/bankDataService';
import { getTransactionsForBanksSync, isDbReady } from '@/lib/lokiDb';

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

    const handleChange = () => {
      setAvailableBanks(bankDataService.getAvailableBanks());
    };
    bankDataService.onChange(handleChange);
    return () => bankDataService.offChange(handleChange);
  }, []);

  const getFilteredData = useCallback((selectedBanks: string[], monthFilter: string) => {
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

    // Handle "All Banks" selection - when no banks are selected, get data for all banks
    const banksToQuery = selectedBanks.length === 0 ? ['all-banks'] : selectedBanks;
    let transactions = getTransactionsForBanksSync(banksToQuery);
    if (!isDbReady()) {
      transactions = [];
    }
    if (startDate && endDate) {
      transactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
    
    // Calculate metrics by bank
    const bankMetrics = new Map<string, { balance: number; income: number; expenses: number }>();
    
    transactions.forEach(t => {
      const bankName = toTitleCase(t.bank);
      if (!bankMetrics.has(bankName)) {
        bankMetrics.set(bankName, { balance: 0, income: 0, expenses: 0 });
      }
      const metrics = bankMetrics.get(bankName)!;
      
      if (t.type === 'deposit') {
        metrics.income += t.amount;
      } else if (t.type === 'withdrawl') {
        metrics.expenses += t.amount;
      }
      
      // Use latest closing balance for each bank
      metrics.balance = t.closingBy;
    });

    // Calculate totals
    const income = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'withdrawl')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalBalance = Array.from(bankMetrics.values()).reduce((sum, metrics) => sum + metrics.balance, 0);
    const savings = income - expenses;

    // Convert bank metrics to array format
    const bankBreakdown = Array.from(bankMetrics.entries()).map(([bankName, metrics]) => ({
      bank: bankName,
      balance: metrics.balance,
      income: metrics.income,
      expenses: metrics.expenses
    })).sort((a, b) => b.balance - a.balance);

    // Group expenses by category and collect tags with improved logic
    const expenseTransactions = transactions.filter(t => t.type === 'withdrawl');
    
    const expenseCategoryData = expenseTransactions.reduce((acc, t) => {
      const category = t.category || 'Uncategorized';
      
      if (!acc[category]) {
        acc[category] = {
          total: 0,
          transactions: [],
          tags: new Set<string>()
        };
      }
      
      // Add to total amount
      acc[category].total += t.amount;
      
      // Store transaction for detailed breakdown
      acc[category].transactions.push(t);
      
      // Collect tags
      if (t.tags) {
        const tagList = t.tags.split(',').map(s => s.trim()).filter(Boolean);
        tagList.forEach(tag => acc[category].tags.add(tag));
      }
      
      return acc;
    }, {} as Record<string, { total: number; transactions: any[]; tags: Set<string> }>);

    // Extract totals and tags for backward compatibility
    const expenseCategoryTotals = Object.fromEntries(
      Object.entries(expenseCategoryData).map(([category, data]) => [category, data.total])
    );
    
    const expenseCategoryTags = Object.fromEntries(
      Object.entries(expenseCategoryData).map(([category, data]) => [category, data.tags])
    );

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
        tags: Array.from(expenseCategoryTags[category] || new Set<string>()).map(toTitleCase),
        transactions: expenseCategoryData[category]?.transactions || []
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
      balance: totalBalance,
      income,
      expenses,
      savings,
      expenseCategories: expenseCategoryTotals,
      expenseCategoriesList,
      monthlyData,
      bankBreakdown,
    };
  }, []);

  return {
    availableBanks,
    isLoading,
    getFilteredData
  };
};