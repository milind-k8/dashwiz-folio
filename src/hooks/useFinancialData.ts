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
  const processExpenseCategories = (bank_id: string | undefined, startDate: Date, endDate: Date) => {
    // Use the provided date range instead of hardcoded current month
    
    const expenseTransactions = transactions.filter(t => {
      // Only debit transactions
      if (t.transaction_type !== 'debit') return false;
      
      // Filter by selected bank
      if (bank_id !== t.bank_id) return false;
      
      // Filter by the provided date range
      const transactionDate = new Date(t.mail_time);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    // Create category map with proper aggregation
    const expenseCategoryData = expenseTransactions.reduce((acc, t) => {
      const category = t.category || 'Uncategorized';
      
      if (!acc[category]) {
        acc[category] = {
          total: 0,
          transactionCount: 0,
          transactions: [],
          merchants: new Map<string, { count: number; totalAmount: number }>()
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
      
      // Track merchant frequency and amounts - use merchant name exactly as-is
      if (t.merchant) {
        const merchantName = t.merchant.trim(); // Only trim whitespace, don't normalize
        
        if (!acc[category].merchants.has(merchantName)) {
          acc[category].merchants.set(merchantName, { 
            count: 0, 
            totalAmount: 0
          });
        }
        const merchantData = acc[category].merchants.get(merchantName)!;
        merchantData.count += 1;
        merchantData.totalAmount += t.amount;
      }
      
      return acc;
    }, {} as Record<string, { 
      total: number; 
      transactionCount: number;
      transactions: any[]; 
      merchants: Map<string, { count: number; totalAmount: number }>;
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
        
        // Generate tags from all merchant names for display purposes
        const allMerchantNames = merchants.map(([name]) => name);
        const tags = [...new Set(allMerchantNames)]; // Show all unique merchant names as tags
        
        return {
          category: toTitleCase(category),
          amount,
          percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
          color: colorPalette[idx % colorPalette.length],
          tags,
          transactions: categoryData?.transactions || [],
          transactionCount: categoryData?.transactionCount || 0,
          merchants: merchants.map(([merchant, data]) => ({
            name: merchant,
            count: data.count,
            totalAmount: data.totalAmount
          }))
        };
      });

    return { expenseCategoryTotals, expenseCategoriesList };
  };

  const getFilteredData = useCallback((selectedBankId: string, monthFilter: string) => {
    const bank_id = selectedBankId;
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
    const { expenseCategoryTotals, expenseCategoriesList } = processExpenseCategories(bank_id, startDate, endDate);

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
    return banks.map(bank => bank.id);
  }, [banks]);

  return {
    availableBanks,
    isLoading: loading,
    getFilteredData
  };
};