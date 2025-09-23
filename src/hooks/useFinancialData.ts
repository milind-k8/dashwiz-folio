import { useMemo, useCallback } from 'react';
import { useGlobalStore } from '@/store/globalStore';

export const useFinancialData = () => {
  const { banks, transactions, loading } = useGlobalStore();

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
      case 'month-before-previous':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Filter transactions by selected banks and date range
    let filteredTransactions = transactions.filter(t => {
      // Exclude balance transactions for calculations
      if (t.transaction_type === 'balance') return false;
      
      // Filter by banks
      if (selectedBanks.length > 0 && !selectedBanks.includes(t.bank_id)) {
        return false;
      }
      
      // Filter by date
      const transactionDate = new Date(t.mail_time);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    // Calculate metrics by bank
    const bankMetrics = new Map<string, { balance: number; income: number; expenses: number }>();
    
    // Get latest balance for each bank
    banks.forEach(bank => {
      const balanceTransactions = transactions
        .filter(t => t.bank_id === bank.id && t.transaction_type === 'balance')
        .sort((a, b) => new Date(b.mail_time).getTime() - new Date(a.mail_time).getTime());
      
      const latestBalance = balanceTransactions[0]?.amount || 0;
      
      if (!bankMetrics.has(bank.bank_name)) {
        bankMetrics.set(bank.bank_name, { balance: latestBalance, income: 0, expenses: 0 });
      }
    });
    
    // Calculate income and expenses for each bank
    filteredTransactions.forEach(t => {
      const bank = banks.find(b => b.id === t.bank_id);
      if (!bank) return;
      
      const bankName = toTitleCase(bank.bank_name);
      if (!bankMetrics.has(bankName)) {
        bankMetrics.set(bankName, { balance: 0, income: 0, expenses: 0 });
      }
      const metrics = bankMetrics.get(bankName)!;
      
      if (t.transaction_type === 'credit') {
        metrics.income += t.amount;
      } else if (t.transaction_type === 'debit') {
        metrics.expenses += t.amount;
      }
    });

    // Calculate totals
    const income = filteredTransactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.transaction_type === 'debit')
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

    // Group expenses by category and collect tags
    const expenseTransactions = filteredTransactions.filter(t => t.transaction_type === 'debit');
    
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
      acc[category].transactions.push({
        merchant: t.merchant,
        amount: t.amount,
        date: t.mail_time,
        bank: banks.find(b => b.id === t.bank_id)?.bank_name || 'Unknown',
        snippet: t.snippet
      });
      
      // Collect tags from merchant names (simple tag extraction)
      if (t.merchant) {
        const merchantWords = t.merchant.toLowerCase().split(/\s+/).filter(word => word.length > 3);
        merchantWords.forEach(word => acc[category].tags.add(toTitleCase(word)));
      }
      
      return acc;
    }, {} as Record<string, { total: number; transactions: any[]; tags: Set<string> }>);

    // Extract totals and tags for backward compatibility
    const expenseCategoryTotals = Object.fromEntries(
      Object.entries(expenseCategoryData).map(([category, data]) => [category, data.total])
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
        tags: Array.from(expenseCategoryData[category]?.tags || new Set<string>()),
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

    for (const t of filteredTransactions) {
      const d = new Date(t.mail_time);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = monthlyMap.get(key) || { income: 0, expenses: 0 };
      if (t.transaction_type === 'credit') {
        bucket.income += t.amount;
      } else if (t.transaction_type === 'debit') {
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
      transactions: filteredTransactions,
      balance: totalBalance,
      income,
      expenses,
      savings,
      expenseCategories: expenseCategoryTotals,
      expenseCategoriesList,
      monthlyData,
      bankBreakdown,
    };
  }, [banks, transactions]);

  const availableBanks = useMemo(() => {
    return banks.map(bank => bank.bank_name);
  }, [banks]);

  return {
    availableBanks,
    isLoading: loading,
    getFilteredData
  };
};