import { useMemo, useCallback } from 'react';
import BalanceOverviewCard from '@/components/BalanceOverviewCard';
import { TransactionChips } from '@/components/TransactionChips';
import { InlineFilters } from '@/components/InlineFilters';
import { PageContent } from '@/components/PageContent';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { CategoryGrouping } from '@/components/CategoryGrouping';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useFilterStore } from '@/store/filterStore';
import { useGlobalStore } from '@/store/globalStore';
import { Wallet, TrendingUp, Calculator } from 'lucide-react';

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
      
      <div className="pb-2">
        <BalanceOverviewCard 
          totalBalance={data.balance}
          bankBreakdown={data.bankBreakdown}
        />
      </div>

      {/* Transaction Chips */}
      <TransactionChips 
        transactions={data.transactions}
        banks={banks}
      />

       {/* Category Grouping */}
       <CategoryGrouping />

    </PageContent>
  );
}