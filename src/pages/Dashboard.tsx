import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MetricCard } from '@/components/MetricCard';
import { FinanceChart } from '@/components/FinanceChart';
import { ExpenseChart } from '@/components/ExpenseChart';
import { TransactionList } from '@/components/TransactionList';
import { InlineFilters } from '@/components/InlineFilters';
import { PageContent } from '@/components/PageContent';
import { BankDataModal } from '@/components/BankDataModal';
import { useBankData } from '@/hooks/useBankData';
import { Wallet, TrendingUp, PiggyBank, CreditCard as CreditCardIcon } from 'lucide-react';

export function Dashboard() {
  const { getFilteredData } = useBankData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    value: number;
    type: 'balance' | 'income' | 'expenses' | 'savings';
  } | null>(null);

  // Get filter values from URL params
  const selectedBanks = searchParams.get('banks')?.split(',').filter(Boolean) || [];
  const selectedDuration = searchParams.get('duration') || 'current-month';

  const handleFiltersChange = useCallback((banks: string[], duration: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams();
      if (banks.length > 0) {
        newParams.set('banks', banks.join(','));
      }
      newParams.set('duration', duration);
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const handleMetricClick = useCallback((title: string, value: number, type: 'balance' | 'income' | 'expenses' | 'savings') => {
    setModalData({ title, value, type });
    setModalOpen(true);
  }, []);

  // Memoize the expensive data calculation
  const data = useMemo(() => {
    return getFilteredData(selectedBanks, selectedDuration);
  }, [getFilteredData, selectedBanks, selectedDuration]);

  // Calculate trends by comparing current period with previous period
  const trendsData = useMemo(() => {
    const currentData = getFilteredData(selectedBanks, selectedDuration);
    
    // Get previous period data for comparison
    let previousDuration = '';
    switch (selectedDuration) {
      case 'current-month':
        previousDuration = 'previous-month';
        break;
      case 'previous-month':
        previousDuration = 'previous-3-months';
        break;
      case 'previous-3-months':
        previousDuration = 'previous-6-months';
        break;
      case 'previous-6-months':
        // For 6 months, compare with current month to show overall trend
        previousDuration = 'current-month';
        break;
      default:
        previousDuration = 'previous-month';
    }
    
    const previousData = getFilteredData(selectedBanks, previousDuration);
    
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return null;
      const change = ((current - previous) / previous) * 100;
      return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
    };

    return {
      income: calculateTrend(currentData.income, previousData.income),
      expenses: calculateTrend(currentData.expenses, previousData.expenses),
      savings: calculateTrend(currentData.savings, previousData.savings),
    };
  }, [getFilteredData, selectedBanks, selectedDuration]);

  return (
    <PageContent>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Financial Overview
          </h1>
          <div className="w-12 h-1 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
        </div>
        
        {/* Filters */}
        <div className="flex justify-end overflow-x-auto">
          <InlineFilters onFiltersChange={handleFiltersChange} />
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-8">
        <MetricCard
          title="Balance"
          value={`₹${data.balance.toLocaleString()}`}
          icon={Wallet}
          isHighlighted={true}
          onClick={() => handleMetricClick('Balance', data.balance, 'balance')}
        />
        <MetricCard
          title="Income"
          value={`₹${data.income.toLocaleString()}`}
          icon={TrendingUp}
          trend={trendsData.income}
          onClick={() => handleMetricClick('Income', data.income, 'income')}
        />
        <MetricCard
          title="Savings"
          value={`₹${data.savings.toLocaleString()}`}
          icon={PiggyBank}
          trend={trendsData.savings}
          onClick={() => handleMetricClick('Savings', data.savings, 'savings')}
        />
        <MetricCard
          title="Expenses"
          value={`₹${data.expenses.toLocaleString()}`}
          icon={CreditCardIcon}
          trend={trendsData.expenses}
          onClick={() => handleMetricClick('Expenses', data.expenses, 'expenses')}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <FinanceChart data={data.monthlyData} />
        <ExpenseChart data={data.expenseCategoriesList as any} />
      </div>

      {/* Category Spending - Full Width */}
      <div className="mt-3 sm:mt-4 md:mt-6">
        <TransactionList expenseCategories={data.expenseCategoriesList} />
      </div>

      {/* Bank Data Modal */}
      {modalData && (
        <BankDataModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalData.title}
          totalValue={modalData.value}
          selectedBanks={selectedBanks}
          selectedDuration={selectedDuration}
          metricType={modalData.type}
        />
      )}
    </PageContent>
  );
}