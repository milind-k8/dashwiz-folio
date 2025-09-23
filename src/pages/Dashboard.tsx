import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EnhancedMetricCard } from '@/components/EnhancedMetricCard';
import { FinanceChart } from '@/components/FinanceChart';
import { ExpenseChart } from '@/components/ExpenseChart';
import { TransactionList } from '@/components/TransactionList';
import { InlineFilters } from '@/components/InlineFilters';
import { PageContent } from '@/components/PageContent';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { useFinancialData } from '@/hooks/useFinancialData';
import { Wallet, CreditCard as CreditCardIcon, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function Dashboard() {
  const { getFilteredData, isLoading } = useFinancialData();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filter values from URL params
  const selectedBank = searchParams.get('bank') || '';
  const selectedDuration = searchParams.get('duration') || 'current-month';

  const handleFiltersChange = useCallback((bank: string, duration: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams();
      if (bank) {
        newParams.set('bank', bank);
      }
      newParams.set('duration', duration);
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Memoize the expensive data calculation
  const data = useMemo(() => {
    return getFilteredData(selectedBank ? [selectedBank] : [], selectedDuration);
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

      {/* Transaction Summary */}
      <div className="mb-8">
        <TransactionList expenseCategories={data.expenseCategoriesList} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <FinanceChart data={data.monthlyData} />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <ExpenseChart data={data.expenseCategoriesList as any} />
          </CardContent>
        </Card>
      </div>
    </PageContent>
  );
}