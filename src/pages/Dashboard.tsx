import { useState } from 'react';
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
  const [selectedBanks, setSelectedBanks] = useState<string[]>(['all-banks']);
  const [selectedDuration, setSelectedDuration] = useState('current-month');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    value: number;
    type: 'balance' | 'income' | 'expenses' | 'savings';
  } | null>(null);

  const handleFiltersChange = (banks: string[], duration: string) => {
    setSelectedBanks(banks);
    setSelectedDuration(duration);
  };

  const handleMetricClick = (title: string, value: number, type: 'balance' | 'income' | 'expenses' | 'savings') => {
    setModalData({ title, value, type });
    setModalOpen(true);
  };

  const data = getFilteredData(selectedBanks, selectedDuration);

  return (
    <PageContent>
      {/* Filters */}
      <div className="flex justify-end overflow-x-auto">
        <InlineFilters onFiltersChange={handleFiltersChange} />
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
          trend="+8.2%"
          onClick={() => handleMetricClick('Income', data.income, 'income')}
        />
        <MetricCard
          title="Savings"
          value={`₹${data.savings.toLocaleString()}`}
          icon={PiggyBank}
          trend="+5.8%"
          onClick={() => handleMetricClick('Savings', data.savings, 'savings')}
        />
        <MetricCard
          title="Expenses"
          value={`₹${data.expenses.toLocaleString()}`}
          icon={CreditCardIcon}
          trend="-2.1%"
          onClick={() => handleMetricClick('Expenses', data.expenses, 'expenses')}
        />
      </div>

      {/* Charts and Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
          <FinanceChart data={data.monthlyData} />
          <TransactionList expenseCategories={data.expenseCategoriesList} />
        </div>
        
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <ExpenseChart data={data.expenseCategoriesList as any} />
        </div>
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