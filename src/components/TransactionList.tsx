import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useFinancialStore } from '@/store/financialStore';

export function TransactionList() {
  const { data } = useFinancialStore();

  return (
    <Card className="p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Transactions</h3>
        <button className="text-primary text-sm font-medium hover:underline">
          Recent
        </button>
      </div>
      
      <div className="space-y-4">
        {data.transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {transaction.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground truncate">
                  {transaction.name}
                </p>
                <p className={`font-semibold ${
                  transaction.amount < 0 ? 'text-destructive' : 'text-success'
                }`}>
                  ${Math.abs(transaction.amount).toFixed(2)}
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-muted-foreground">
                  {transaction.company}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    transaction.status === 'completed'
                      ? 'bg-success/10 text-success'
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {transaction.date}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}