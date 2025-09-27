import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  mail_time: string;
  merchant?: string;
  bank_id: string;
  snippet?: string;
}

interface Bank {
  id: string;
  bank_name: string;
}

interface TopTransactionsProps {
  transactions: Transaction[];
  banks: Bank[];
  className?: string;
}

export function TopTransactions({ transactions, banks, className }: TopTransactionsProps) {
  const topTransactions = useMemo(() => {
    // Filter out balance transactions and sort by amount descending
    const filteredTransactions = transactions
      .filter(t => t.transaction_type !== 'balance')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return filteredTransactions.map(transaction => {
      const bank = banks.find(b => b.id === transaction.bank_id);
      return {
        ...transaction,
        bankName: bank?.bank_name || 'Unknown Bank'
      };
    });
  }, [transactions, banks]);

  if (topTransactions.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Top 5 Highest Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No transactions found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          Top 5 Highest Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0 divide-y divide-border">
          {topTransactions.map((transaction, index) => (
            <div 
              key={transaction.id}
              className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className=
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-muted/50 text-muted-foreground">
                    #{index + 1}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {transaction.merchant || 'Unknown Merchant'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(new Date(transaction.mail_time), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0 text-right">
                <p className={cn(
                  "font-bold text-sm",
                  transaction.transaction_type === 'debit' 
                    ? "text-destructive" 
                    : "text-success"
                )}>
                  {transaction.transaction_type === 'debit' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}