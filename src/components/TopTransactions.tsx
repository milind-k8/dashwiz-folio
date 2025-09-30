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
  isDrawerContent?: boolean;
}

export function TopTransactions({ transactions, banks, className, isDrawerContent = false }: TopTransactionsProps) {
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
    if (isDrawerContent) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground font-roboto">No expenses found</p>
        </div>
      );
    }
    
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2 font-google text-foreground">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            Top Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-roboto">No expenses found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <>
      <div className="space-y-1">
        {displayedTransactions.map((transaction, index) => (
          <div 
            key={transaction.id}
            className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/30 rounded-lg transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-muted/40 text-muted-foreground font-google">
                  #{index + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate font-roboto">
                  {transaction.merchant || 'Unknown Merchant'}
                </p>
                <p className="text-xs text-muted-foreground font-roboto mt-0.5">
                  {format(new Date(transaction.mail_time), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex-shrink-0 text-right">
              <p className="font-medium text-sm text-destructive font-roboto">
                -₹{transaction.amount.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Show More/Less Button */}
      {hasMoreTransactions && (
        <div className="mt-3 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMore(!showMore)}
            className="text-sm px-4 py-2 text-primary hover:text-primary/80 hover:bg-primary/10 font-google font-medium"
          >
            {showMore ? (
              <>
                Show Less
                <ChevronUp className="ml-1.5 h-4 w-4" />
              </>
            ) : (
              <>
                Show More ({topExpenses.length - 5} more)
                <ChevronDown className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );

  if (isDrawerContent) {
    return <div className="py-4">{content}</div>;
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2 font-google text-foreground">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
          Top Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className='pb-3'>
        {content}
      </CardContent>
    </Card>
  );
}