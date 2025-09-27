import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  amount: number;
  mail_time: string;
  transaction_type: string;
  category?: string;
}

interface SpendingInsightsProps {
  transactions: Transaction[];
  currentExpenses: number;
  previousExpenses?: number;
}

export function SpendingInsights({ transactions, currentExpenses, previousExpenses = 0 }: SpendingInsightsProps) {
  const insights = useMemo(() => {
    // Calculate spending change
    const spendingChange = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;
    
    // Calculate average daily spending
    const debitTransactions = transactions.filter(t => t.transaction_type === 'debit');
    const avgDailySpending = debitTransactions.length > 0 ? currentExpenses / 30 : 0;
    
    // Find highest spending category
    const categoryTotals = debitTransactions.reduce((acc, t) => {
      const category = t.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0];
    
    // Calculate transaction frequency
    const transactionCount = debitTransactions.length;
    const avgTransactionSize = transactionCount > 0 ? currentExpenses / transactionCount : 0;
    
    return {
      spendingChange,
      avgDailySpending,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
      transactionCount,
      avgTransactionSize,
    };
  }, [transactions, currentExpenses, previousExpenses]);

  const insightCards = [
    {
      title: "Spending Trend",
      value: insights.spendingChange > 0 ? `+${Math.abs(insights.spendingChange).toFixed(1)}%` : `-${Math.abs(insights.spendingChange).toFixed(1)}%`,
      icon: insights.spendingChange > 0 ? TrendingUp : TrendingDown,
      color: insights.spendingChange > 0 ? "text-destructive" : "text-success",
      bgColor: insights.spendingChange > 0 ? "bg-destructive/10" : "bg-success/10",
      description: insights.spendingChange > 0 ? "vs last month" : "vs last month",
    },
    {
      title: "Daily Average",
      value: `₹${Math.round(insights.avgDailySpending).toLocaleString()}`,
      icon: Calendar,
      color: "text-success",
      bgColor: "bg-success/10",
      description: "per day spending",
    },
    {
      title: "Top Category",
      value: insights.topCategory ? insights.topCategory.name : "None",
      icon: Target,
      color: "text-accent",
      bgColor: "bg-accent/10",
      description: insights.topCategory ? `₹${Math.round(insights.topCategory.amount).toLocaleString()}` : "No expenses",
    },
    {
      title: "Avg Transaction",
      value: `₹${Math.round(insights.avgTransactionSize).toLocaleString()}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: `${insights.transactionCount} transactions`,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="px-1">
        <h3 className="text-lg font-semibold text-foreground mb-1 sm:mb-2">Spending Insights</h3>
        <p className="text-sm text-muted-foreground">Key metrics about your spending patterns</p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {insightCards.map((insight, index) => (
          <Card key={index} className="group hover:border-primary/50 transition-all duration-300 border border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  insight.bgColor
                )}>
                  <insight.icon className={cn("w-4 h-4", insight.color)} />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {insight.title}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {insight.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {insight.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}