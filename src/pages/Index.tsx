import { useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { MetricCard } from '@/components/MetricCard';
import { FinanceChart } from '@/components/FinanceChart';
import { ExpenseChart } from '@/components/ExpenseChart';
import { CreditCard } from '@/components/CreditCard';
import { TransactionList } from '@/components/TransactionList';
import { useFinancialStore } from '@/store/financialStore';
import { Wallet, TrendingUp, PiggyBank, CreditCard as CreditCardIcon } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data } = useFinancialStore();

  if (activeTab !== 'dashboard') {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1">
            <DashboardHeader />
            <div className="p-4 sm:p-6">
              <div className="text-center py-12">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className="text-muted-foreground">This section is coming soon!</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1">
          <DashboardHeader />
          
          <main className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
