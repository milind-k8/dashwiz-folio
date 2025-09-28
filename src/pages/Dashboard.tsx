import { useMemo, useCallback } from 'react';
import { EnhancedMetricCard } from '@/components/EnhancedMetricCard';
import { TopTransactions } from '@/components/TopTransactions';
import { InlineFilters } from '@/components/InlineFilters';
import { PageContent } from '@/components/PageContent';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { CategoryGrouping } from '@/components/CategoryGrouping';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useFilterStore } from '@/store/filterStore';
import { useGlobalStore } from '@/store/globalStore';
import { Wallet, CreditCard as CreditCardIcon, TrendingUp, Calculator } from 'lucide-react';

export function Dashboard() {
  const { getFilteredData, isLoading } = useFinancialData();
  const { selectedBank, selectedDuration, setFilters } = useFilterStore();
  const { banks } = useGlobalStore();

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

  // Calculate average daily spending
  const averageSpending = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    
    // Use current day for current month, full month for others
    const relevantDays = selectedDuration === 'current-month' ? currentDay : daysInMonth;
    return relevantDays > 0 ? Math.round(data.expenses / relevantDays) : 0;
  }, [data.expenses, selectedDuration]);

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
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-end">
          <InlineFilters onFiltersChange={handleFiltersChange} />
        </div>
      </div>
      
      {/* Essential Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-2">
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
        <EnhancedMetricCard
          title="Total Income"
          value={`₹${data.income.toLocaleString()}`}
          icon={TrendingUp}
          metricType="income"
        />
        <EnhancedMetricCard
          title="Avg Daily Spending"
          value={`₹${averageSpending.toLocaleString()}`}
          icon={Calculator}
          metricType="spending"
        />
      </div>

      {/* Top Transactions */}
      <TopTransactions 
        transactions={data.transactions}
        banks={banks}
      />

      {/* Category Grouping */}
      <CategoryGrouping />

    </PageContent>
  );
}