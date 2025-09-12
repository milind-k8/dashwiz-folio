import { MetricCard } from '@/components/MetricCard';
import { FinanceChart } from '@/components/FinanceChart';
import { ExpenseChart } from '@/components/ExpenseChart';
import { CreditCard } from '@/components/CreditCard';
import { TransactionList } from '@/components/TransactionList';
import { InlineFilters } from '@/components/InlineFilters';
import { PageContent } from '@/components/PageContent';
import { useFinancialStore } from '@/store/financialStore';
import { Wallet, TrendingUp, PiggyBank, CreditCard as CreditCardIcon } from 'lucide-react';

export function Dashboard() {
  const { data } = useFinancialStore();

  return (
    <PageContent>
      {/* Filters */}
      <div className="flex justify-end">
        <InlineFilters />
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Balance"
          value={`$${data.balance.toLocaleString()}`}
          icon={Wallet}
          isHighlighted={true}
        />
        <MetricCard
          title="Income"
          value={`$${data.income.toLocaleString()}`}
          icon={TrendingUp}
          trend="+8.2%"
        />
        <MetricCard
          title="Savings"
          value={`$${data.savings.toLocaleString()}`}
          icon={PiggyBank}
          trend="+5.8%"
        />
        <MetricCard
          title="Expenses"
          value={`$${data.expenses.toLocaleString()}`}
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