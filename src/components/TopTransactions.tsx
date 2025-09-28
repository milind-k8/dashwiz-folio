import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showMore, setShowMore] = useState(false);
  
  const topExpenses = useMemo(() => {
    // Filter to only debit transactions and sort by amount descending
    const expenseTransactions = transactions
      .filter(t => t.transaction_type === 'debit')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Get top 10 instead of 5

    return expenseTransactions.map(transaction => {
      const bank = banks.find(b => b.id === transaction.bank_id);
      return {
        ...transaction,
        bankName: bank?.bank_name || 'Unknown Bank'
      };
    });
  }, [transactions, banks]);

  
  // Determine which transactions to display
  const displayedTransactions = showMore ? topExpenses : topExpenses.slice(0, 5);
  const hasMoreTransactions = topExpenses.length > 5;

  if (topExpenses.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Top Transactions this Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No expenses found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          Top Transactions this Month
        </CardTitle>
      </CardHeader>
      <CardContent className='pb-2'>
        <div className="space-y-0 divide-y divide-border">
          {displayedTransactions.map((transaction, index) => (
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
                <p className="font-bold text-sm text-red-600">
                  -₹{transaction.amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Show More/Less Button */}
        {hasMoreTransactions && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMore(!showMore)}
              className="text-sm p-0 text-muted-foreground hover:text-foreground hover:bg-transparent focus:bg-transparent active:bg-transparent border-0 hover:border-0 focus:border-0 active:border-0 shadow-none hover:shadow-none focus:shadow-none active:shadow-none"
            >
              {showMore ? (
                <>
                  Show Less
                  <ChevronUp className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  Show More ({topExpenses.length - 5} more)
                  <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}