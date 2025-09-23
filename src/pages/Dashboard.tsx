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

  // Calculate trends by comparing current period with previous period
  const trendsData = useMemo(() => {
    const currentData = getFilteredData(selectedBank ? [selectedBank] : [], selectedDuration);
    
    // Get previous period data for comparison
    let previousDuration = '';
    switch (selectedDuration) {
      case 'current-month':
        previousDuration = 'previous-month';
        break;
      case 'previous-month':
        previousDuration = 'month-before-previous';
        break;
      case 'month-before-previous':
        // For the oldest month, compare with current month to show overall trend
        previousDuration = 'current-month';
        break;
      default:
        previousDuration = 'previous-month';
    }
    
    const previousData = getFilteredData(selectedBank ? [selectedBank] : [], previousDuration);
    
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
      {/* Concise Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="hidden sm:block">
            <h1 className="text-base sm:text-lg font-medium text-foreground">
              Financial Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track your financial health
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex justify-end">
            <InlineFilters onFiltersChange={handleFiltersChange} />
          </div>
        </div>
      </div>
      
      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-8">
        <EnhancedMetricCard
          title="Total Balance"
          value={`₹${data.balance.toLocaleString()}`}
          icon={Wallet}
          isHighlighted={true}
          bankBreakdown={data.bankBreakdown}
          metricType="balance"
        />
        <EnhancedMetricCard
          title="Monthly Expenses"
          value={`₹${data.expenses.toLocaleString()}`}
          icon={CreditCardIcon}
          bankBreakdown={data.bankBreakdown}
          metricType="expenses"
          className="bg-gradient-to-br from-red-200 via-red-300 to-red-400 text-red-900 border-0 shadow-card"
        />
      </div>

      {/* Transaction Summary */}
      <div className="mb-8">
        <TransactionList expenseCategories={data.expenseCategoriesList} />
      </div>

      {/* Enhanced Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <FinanceChart data={data.monthlyData} />
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <ExpenseChart data={data.expenseCategoriesList as any} />
          </CardContent>
        </Card>
      </div>
    </PageContent>
  );
}