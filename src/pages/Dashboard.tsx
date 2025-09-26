import { useMemo, useCallback } from 'react';
import { EnhancedMetricCard } from '@/components/EnhancedMetricCard';
import { TransactionList } from '@/components/TransactionList';
import { SpendingInsights } from '@/components/SpendingInsights';
import { AdvancedCharts } from '@/components/AdvancedCharts';
import { InlineFilters } from '@/components/InlineFilters';
import { PageContent } from '@/components/PageContent';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useFilterStore } from '@/store/filterStore';
import { Wallet, CreditCard as CreditCardIcon } from 'lucide-react';

export function Dashboard() {
  const { getFilteredData, isLoading } = useFinancialData();
  const { selectedBank, selectedDuration, setFilters } = useFilterStore();

  const handleFiltersChange = useCallback((bank: string, duration: string) => {
    setFilters(bank, duration);
  }, [setFilters]);

  // Memoize the expensive data calculation
  const data = useMemo(() => {
    return getFilteredData(selectedBank, selectedDuration);
  }, [getFilteredData, selectedBank, selectedDuration]);

  // Get previous month data for insights comparison
  const previousMonthData = useMemo(() => {
    const prevDuration = selectedDuration === 'current-month' ? 'previous-month' : 'month-before-previous';
    return getFilteredData(selectedBank, prevDuration);
  }, [getFilteredData, selectedBank, selectedDuration]);

  if (isLoading) {
    return (
      <PageContent>
        <DashboardSkeleton />
      </PageContent>
    );
  }

  return (
    <PageContent>
      {/* Minimal Header */}
      <div className="mb-6">
        <div className="flex justify-end">
          <InlineFilters onFiltersChange={handleFiltersChange} />
        </div>
      </div>
      
      {/* Essential Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <EnhancedMetricCard
          title="Total Balance"
          value={`₹${data.balance.toLocaleString()}`}
          icon={Wallet}
          metricType="balance"
        />
        <EnhancedMetricCard
          title="Monthly Expenses"
          value={`₹${data.expenses.toLocaleString()}`}
          icon={CreditCardIcon}
          metricType="expenses"
        />
      </div>

      {/* Spending Insights */}
      <div className="mb-8">
        <SpendingInsights 
          transactions={data.transactions}
          currentExpenses={data.expenses}
          previousExpenses={previousMonthData.expenses}
        />
      </div>

      {/* Advanced Charts */}
      <div className="mb-8">
        <AdvancedCharts 
          transactions={data.transactions}
          expenseCategories={data.expenseCategoriesList}
        />
      </div>

      {/* Transaction Summary */}
      <div className="mb-8">
        <TransactionList expenseCategories={data.expenseCategoriesList} />
      </div>

    </PageContent>
  );
}