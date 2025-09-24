import { useMemo, useCallback } from 'react';
import { EnhancedMetricCard } from '@/components/EnhancedMetricCard';
import { ExpenseChart } from '@/components/ExpenseChart';
import { TransactionList } from '@/components/TransactionList';
import { InlineFilters } from '@/components/InlineFilters';
import { PageContent } from '@/components/PageContent';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { DebugAuthInfo } from '@/components/DebugAuthInfo';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useFilterStore } from '@/store/filterStore';
import { Wallet, CreditCard as CreditCardIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';


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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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

      {/* Expense Chart */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <ExpenseChart data={data.expenseCategoriesList as any} />
          </CardContent>
        </Card>
      </div>

      {/* Transaction Summary */}
      <div className="mb-8">
        <TransactionList expenseCategories={data.expenseCategoriesList} />
      </div>

      {/* Debug Auth Info - Only show for development/debugging */}
      <DebugAuthInfo />

    </PageContent>
  );
}