import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useFinancialStore } from '@/store/financialStore';

export function TransactionList() {
  const { data } = useFinancialStore();

  return (
    <Card className="p-4 sm:p-6 shadow-card">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Transactions</h3>
        <button className="text-primary text-sm font-medium hover:underline">
          Recent
        </button>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        {data.transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs sm:text-sm">
                {transaction.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate text-sm sm:text-base">
                    {transaction.name}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {transaction.company}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                   <p className={`font-semibold text-sm sm:text-base ${
                     transaction.amount < 0 ? 'text-destructive' : 'text-success'
                   }`}>
                     ₹{Math.abs(transaction.amount).toFixed(2)}
                   </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block mt-1 ${
                    transaction.status === 'completed'
                      ? 'bg-success/10 text-success'
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{transaction.date}</span>
                <span className="hidden sm:inline">{transaction.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}