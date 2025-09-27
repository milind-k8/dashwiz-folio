import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useGlobalStore } from '@/store/globalStore';

interface BankDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  totalValue: number;
  selectedBanks: string[];
  selectedDuration: string;
  metricType: 'balance' | 'income' | 'expenses' | 'savings';
}

export function BankDataModal({
  isOpen,
  onClose,
  title,
  totalValue,
  selectedBanks,
  selectedDuration,
  metricType
}: BankDataModalProps) {
  const { banks, transactions } = useGlobalStore();

  const getBankLabel = (bankName: string) => {
    return bankName.toUpperCase();
  };

  const getBankWiseData = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    switch (selectedDuration) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'previous-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'previous-3-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'previous-6-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Filter transactions by selected banks and date range
    let filteredTransactions = transactions.filter(t => {
      // Exclude balance transactions for calculations
      if (t.transaction_type === 'balance') return false;
      
      // Filter by banks
      if (selectedBanks.length > 0 && !selectedBanks.includes(t.bank_id)) {
        return false;
      }
      
      // Filter by date
      const transactionDate = new Date(t.mail_time);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Group by bank and calculate metrics
    const bankGroups = banks.reduce((acc, bank) => {
      const bankTransactions = filteredTransactions.filter(t => t.bank_id === bank.id);
      
      if (bankTransactions.length === 0) return acc;
      
      const income = bankTransactions
        .filter(t => t.transaction_type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = bankTransactions
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Get latest balance for this bank
      const balanceTransactions = transactions
        .filter(t => t.bank_id === bank.id && t.transaction_type === 'balance')
        .sort((a, b) => new Date(b.mail_time).getTime() - new Date(a.mail_time).getTime());
      
      const balance = balanceTransactions[0]?.amount || 0;
      const savings = income - expenses;

      let value = 0;
      switch (metricType) {
        case 'balance':
          value = balance;
          break;
        case 'income':
          value = income;
          break;
        case 'expenses':
          value = expenses;
          break;
        case 'savings':
          value = savings;
          break;
      }

      if (value > 0) {
        acc.push({
          bank: bank.bank_name,
          label: getBankLabel(bank.bank_name),
          value,
          percentage: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0
        });
      }

      return acc;
    }, [] as Array<{ bank: string; label: string; value: number; percentage: number }>);

    return bankGroups.sort((a, b) => b.value - a.value);
  };

  const bankData = getBankWiseData();

  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString()}`;
  };

  const getValueColor = (value: number) => {
    if (metricType === 'expenses') {
      return 'text-destructive';
    }
    return value >= 0 ? 'text-success' : 'text-destructive';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold pr-8">
            {title} Breakdown by Bank
          </DialogTitle>
        </DialogHeader>

        {/* Total Section */}
        <Card className="p-4 sm:p-6 bg-gradient-card text-white border border-primary">
          <div className="text-center">
            <p className="text-white/80 text-xs sm:text-sm font-medium mb-2">Total {title}</p>
            <p className="text-2xl sm:text-3xl font-bold">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </Card>

        <Separator />

        {/* Bank-wise Breakdown */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Bank-wise Breakdown</h3>
          
          {bankData.length === 0 ? (
            <Card className="p-4 sm:p-6 text-center">
              <p className="text-muted-foreground text-sm">No data available for the selected period</p>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {bankData.map((item) => (
                <Card key={item.bank} className="p-3 sm:p-4 hover:shadow-elevated transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {item.label.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.percentage}% of total
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`text-sm sm:text-lg font-semibold ${getValueColor(item.value)}`}>
                        {formatCurrency(item.value)}
                      </p>
                      <Badge variant={item.percentage > 50 ? 'default' : 'secondary'} className="text-xs">
                        {item.percentage}%
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-2 sm:mt-3">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-primary rounded-full h-1.5 transition-all duration-300" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}