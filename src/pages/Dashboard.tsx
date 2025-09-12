import { useState } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { FinanceChart } from '@/components/FinanceChart';
import { ExpenseChart } from '@/components/ExpenseChart';
import { CreditCard } from '@/components/CreditCard';
import { TransactionList } from '@/components/TransactionList';
import { InlineFilters } from '@/components/InlineFilters';
import { PageContent } from '@/components/PageContent';
import { useBankData } from '@/hooks/useBankData';
import { Wallet, TrendingUp, PiggyBank, CreditCard as CreditCardIcon, IndianRupee } from 'lucide-react';

export function Dashboard() {
  const { getFilteredData } = useBankData();
  const [selectedBanks, setSelectedBanks] = useState<string[]>(['all-banks']);
  const [selectedDuration, setSelectedDuration] = useState('current-month');

  const handleFiltersChange = (banks: string[], duration: string) => {
    setSelectedBanks(banks);
    setSelectedDuration(duration);
  };

  const data = getFilteredData(selectedBanks, selectedDuration);

  return (
    <PageContent>
      {/* Filters */}
      <div className="flex justify-end">
        <InlineFilters onFiltersChange={handleFiltersChange} />
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Balance"
          value={
            <div className="flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />
              {data.balance.toLocaleString()}
            </div>
          }
          icon={Wallet}
          isHighlighted={true}
        />
        <MetricCard
          title="Income"
          value={
            <div className="flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />
              {data.income.toLocaleString()}
            </div>
          }
          icon={TrendingUp}
          trend="+8.2%"
        />
        <MetricCard
          title="Savings"
          value={
            <div className="flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />
              {data.savings.toLocaleString()}
            </div>
          }
          icon={PiggyBank}
          trend="+5.8%"
        />
        <MetricCard
          title="Expenses"
          value={
            <div className="flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />
              {data.expenses.toLocaleString()}
            </div>
          }
          icon={CreditCardIcon}
          trend="-2.1%"
        />
      </div>

      {/* Charts and Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          <FinanceChart />
          <TransactionList />
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <CreditCard />
          <ExpenseChart />
        </div>
      </div>
    </PageContent>
  );
}