import { useMemo, useCallback } from 'react';
import { useGlobalStore } from '@/store/globalStore';

export const useFinancialData = () => {
  const { banks, transactions, loading } = useGlobalStore();

  // Helper function to convert string to title case
  const toTitleCase = (value: string) => {
    if (!value) return value;
    return value
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Extract date filtering logic
  const getDateRange = (monthFilter: string) => {
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

    return { startDate, endDate };
  };

  // Extract transaction filtering logic
  const filterTransactions = (bank_id: string | undefined, startDate: Date, endDate: Date) => {
    return transactions.filter(t => {
      // Exclude balance transactions for calculations
      if (t.transaction_type === 'balance') return false;
      
      // Filter by banks
      if (bank_id !== t.bank_id) {
        return false;
      }
      
      // Filter by date
      const transactionDate = new Date(t.mail_time);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  // Extract bank metrics calculation logic
  const calculateBankMetrics = (filteredTransactions: any[], startDate: Date, endDate: Date) => {
    const bankMetrics = new Map<string, { balance: number; income: number; expenses: number }>();
    
    // Get latest balance for each bank using improved calculation
    banks.forEach(bank => {
      // Get all transactions for this bank within the date range, sorted by mail date (newest first)
      const bankTransactions = transactions
        .filter(t => {
          if (t.bank_id !== bank.id) return false;
          const transactionDate = new Date(t.mail_time);
          return transactionDate >= startDate && transactionDate <= endDate;
        })
        .sort((a, b) => new Date(b.mail_time).getTime() - new Date(a.mail_time).getTime());
      
      let latestBalance = 0;
      let runningBalance = 0;
      
      // Process transactions from newest to oldest, stop at first balance entry
      for (const transaction of bankTransactions) {
        if (transaction.transaction_type === 'balance') {
          // Found the latest balance entry - this is our reference point
          latestBalance = transaction.amount;
          // Subtract any accumulated running balance to get actual balance
          latestBalance -= runningBalance;
          break;
        } else if (transaction.transaction_type === 'debit') {
          // Debit reduces balance
          runningBalance += transaction.amount;
        } else if (transaction.transaction_type === 'credit') {
          // Credit increases balance
          runningBalance -= transaction.amount;
        }
      }
      
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

    return bankMetrics;
  };

  // Extract expense categories processing logic
  const processExpenseCategories = (bank_id: string | undefined) => {
    // Filter debit transactions for the current month only
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const expenseTransactions = transactions.filter(t => {
      // Only debit transactions
      if (t.transaction_type !== 'debit') return false;
      
      // Filter by selected bank
      if (bank_id !== t.bank_id) return false;
      
      // Filter by current month
      const transactionDate = new Date(t.mail_time);
      return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
    });
    
    // Create category map with proper aggregation
    const expenseCategoryData = expenseTransactions.reduce((acc, t) => {
      const category = t.category || 'Uncategorized';
      
      if (!acc[category]) {
        acc[category] = {
          total: 0,
          transactionCount: 0,
          transactions: [],
          tags: new Set<string>(),
          merchants: new Map<string, { count: number; totalAmount: number; originalNames: Set<string> }>()
        };
      }
      
      // Add to total amount
      acc[category].total += t.amount;
      acc[category].transactionCount += 1;
      
      // Store transaction for detailed breakdown
      acc[category].transactions.push({
        merchant: t.merchant,
        amount: t.amount,
        date: t.mail_time,
        bank: banks.find(b => b.id === t.bank_id)?.bank_name || 'Unknown',
        snippet: t.snippet
      });
      
      // Track merchant frequency and amounts
      if (t.merchant) {
        const normalizedMerchant = t.merchant;
        
        if (!acc[category].merchants.has(normalizedMerchant)) {
          acc[category].merchants.set(normalizedMerchant, { 
            count: 0, 
            totalAmount: 0,
            originalNames: new Set<string>()
          });
        }
        const merchantData = acc[category].merchants.get(normalizedMerchant)!;
        merchantData.count += 1;
        merchantData.totalAmount += t.amount;
        merchantData.originalNames.add(normalizedMerchant);
        
        // Collect tags from normalized merchant names
        const merchantWords = normalizedMerchant.split(/\s+/).filter(word => word.length > 2);
        merchantWords.forEach(word => acc[category].tags.add(toTitleCase(word)));
      }
      
      return acc;
    }, {} as Record<string, { 
      total: number; 
      transactionCount: number;
      transactions: any[]; 
      tags: Set<string>;
      merchants: Map<string, { count: number; totalAmount: number; originalNames: Set<string> }>;
    }>);

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
      .map(([category, amount], idx) => {
        const categoryData = expenseCategoryData[category];
        const merchants = categoryData?.merchants ? Array.from(categoryData.merchants.entries()) : [];
        
        return {
          category: toTitleCase(category),
          amount,
          percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
          color: colorPalette[idx % colorPalette.length],
          tags: Array.from(categoryData?.tags || new Set<string>()),
          transactions: categoryData?.transactions || [],
          transactionCount: categoryData?.transactionCount || 0,
          merchants: merchants.map(([merchant, data]) => ({
            name: merchant,
            count: data.count,
            totalAmount: data.totalAmount,
            originalNames: Array.from(data.originalNames)
          }))
        };
      });

    return { expenseCategoryTotals, expenseCategoriesList };
  };

  const getFilteredData = useCallback((selectedBank: string, monthFilter: string) => {
    const bank_id = banks.find(b => b.bank_name === selectedBank)?.id;
    const { startDate, endDate } = getDateRange(monthFilter);

    // Filter transactions by selected banks and date range
    const filteredTransactions = filterTransactions(bank_id, startDate, endDate);
    
    // Calculate metrics by bank
    const bankMetrics = calculateBankMetrics(filteredTransactions, startDate, endDate);

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

    // Process expense categories
    const { expenseCategoryTotals, expenseCategoriesList } = processExpenseCategories(bank_id);

    return {
      transactions: filteredTransactions,
      balance: totalBalance,
      income,
      expenses,
      savings,
      expenseCategories: expenseCategoryTotals,
      expenseCategoriesList,
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