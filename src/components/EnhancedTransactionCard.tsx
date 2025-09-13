import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';

interface EnhancedTransactionCardProps {
  transaction: {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    bank: string;
    refId: string;
    tags?: string[];
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showSensitiveData?: boolean;
}

export function EnhancedTransactionCard({ 
  transaction, 
  onEdit, 
  onDelete,
  showSensitiveData = true 
}: EnhancedTransactionCardProps) {
  const [isDataVisible, setIsDataVisible] = useState(showSensitiveData);
  
  const formatAmount = (amount: number) => {
    if (!isDataVisible) return '****';
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatRefId = (refId: string) => {
    if (!isDataVisible) return '****';
    return refId.length > 12 ? `${refId.slice(0, 12)}...` : refId;
  };

  return (
    <Card className="p-4 hover-scale hover:shadow-elevated transition-all duration-300 border-l-4"
          style={{ 
            borderLeftColor: transaction.type === 'income' ? 'hsl(var(--income))' : 'hsl(var(--expense))' 
          }}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          {/* Transaction Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${
                transaction.type === 'income' 
                  ? 'bg-income/10 text-income' 
                  : 'bg-expense/10 text-expense'
              }`}>
                {transaction.type === 'income' ? 
                  <ArrowUpRight className="w-4 h-4" /> : 
                  <ArrowDownRight className="w-4 h-4" />
                }
              </div>
              <div>
                <p className="font-medium text-foreground">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className={`font-bold text-lg ${
                transaction.type === 'income' ? 'text-income' : 'text-expense'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
              </p>
              <Badge variant="outline" className="text-xs">
                {transaction.category}
              </Badge>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Bank: <span className="font-medium text-foreground">{transaction.bank.toUpperCase()}</span>
              </span>
              <span className="text-muted-foreground">
                Ref: <span className="font-mono text-xs">{formatRefId(transaction.refId)}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDataVisible(!isDataVisible)}
                className="h-6 w-6 p-0"
              >
                {isDataVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Tags */}
          {transaction.tags && transaction.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {transaction.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
              {transaction.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  +{transaction.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}