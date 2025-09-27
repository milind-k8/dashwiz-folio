interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  transaction_type: 'credit' | 'debit' | 'balance';
  mail_time: string;
  category?: string;
}

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isCredit = transaction.transaction_type === 'credit';

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground truncate pr-2">
            {transaction.merchant || 'Unknown'}
          </p>
          <p className={`text-sm font-semibold ${
            isCredit ? 'text-success' : 'text-foreground'
          }`}>
            {isCredit ? '+' : '-'}₹{transaction.amount.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {transaction.category || 'Other'}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(transaction.mail_time)}
          </p>
        </div>
      </div>
    </div>
  );
};