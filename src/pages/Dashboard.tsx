import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EnhancedMetricCard } from '@/components/EnhancedMetricCard';
import { FinanceChart } from '@/components/FinanceChart';
import { ExpenseChart } from '@/components/ExpenseChart';
import { TransactionList } from '@/components/TransactionList';
import { InlineFilters } from '@/components/InlineFilters';
import { PageContent } from '@/components/PageContent';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { useBankData } from '@/hooks/useBankData';
import { Wallet, CreditCard as CreditCardIcon, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function Dashboard() {
  const { getFilteredData, isLoading } = useBankData();
  const [searchParams, setSearchParams] = useSearchParams();

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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Financial Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Track your financial health
              </p>
            </div>
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
          isHighlighted={false}
          bankBreakdown={data.bankBreakdown}
          metricType="balance"
          className="border-primary/20 bg-gradient-to-br from-primary/5 via-card/60 to-primary/5"
        />
        <EnhancedMetricCard
          title="Monthly Expenses"
          value={`₹${data.expenses.toLocaleString()}`}
          icon={CreditCardIcon}
          trend={trendsData.expenses}
          bankBreakdown={data.bankBreakdown}
          metricType="expenses"
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