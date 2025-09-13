import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'success' | 'warning' | 'neutral';
  className?: string;
}

export function QuickActionButton({ 
  icon, 
  label, 
  onClick, 
  variant = 'primary',
  className = ""
}: QuickActionButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-gradient-income hover:shadow-success text-white';
      case 'warning':
        return 'bg-gradient-expense hover:shadow-warning text-white';
      case 'neutral':
        return 'bg-muted hover:bg-muted/80 text-muted-foreground';
      default:
        return 'bg-gradient-primary hover:shadow-primary text-white';
    }
  };

  return (
    <Button
      onClick={onClick}
      className={`h-14 w-full flex flex-col gap-1 ${getVariantStyles()} ${className}`}
      variant="ghost"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}

interface FloatingActionButtonProps {
  onAddTransaction: () => void;
  onQuickDeposit: () => void;
  onQuickWithdraw: () => void;
}

export function FloatingActionButton({ 
  onAddTransaction, 
  onQuickDeposit, 
  onQuickWithdraw 
}: FloatingActionButtonProps) {
  return (
    <div className="fixed bottom-20 right-4 flex flex-col gap-2 md:bottom-6">
      {/* Quick Actions */}
      <div className="flex flex-col gap-2 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
        <Button
          onClick={onQuickDeposit}
          size="sm"
          className="w-12 h-12 rounded-full bg-gradient-income hover:shadow-floating text-white"
        >
          <ArrowUpRight className="w-5 h-5" />
        </Button>
        <Button
          onClick={onQuickWithdraw}
          size="sm"
          className="w-12 h-12 rounded-full bg-gradient-expense hover:shadow-floating text-white"
        >
          <ArrowDownRight className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Main FAB */}
      <Button
        onClick={onAddTransaction}
        className="group w-14 h-14 rounded-full bg-gradient-primary hover:shadow-floating text-white relative"
      >
        <Plus className="w-6 h-6 transition-transform group-hover:rotate-45" />
      </Button>
    </div>
  );
}

interface QuickActionsGridProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onViewReports: () => void;
  onExportData: () => void;
}

export function QuickActionsGrid({ 
  onAddIncome, 
  onAddExpense, 
  onViewReports, 
  onExportData 
}: QuickActionsGridProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 text-foreground">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <QuickActionButton
          icon={<ArrowUpRight className="w-5 h-5" />}
          label="Add Income"
          onClick={onAddIncome}
          variant="success"
        />
        <QuickActionButton
          icon={<ArrowDownRight className="w-5 h-5" />}
          label="Add Expense"
          onClick={onAddExpense}
          variant="warning"
        />
        <QuickActionButton
          icon={<TrendingUp className="w-5 h-5" />}
          label="View Reports"
          onClick={onViewReports}
          variant="primary"
        />
        <QuickActionButton
          icon={<TrendingDown className="w-5 h-5" />}
          label="Export Data"
          onClick={onExportData}
          variant="neutral"
        />
      </div>
    </Card>
  );
}