import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface Transaction {
  amount: number;
  mail_time: string;
  transaction_type: string;
  category?: string;
}

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface AdvancedChartsProps {
  transactions: Transaction[];
  expenseCategories: ExpenseCategory[];
}

export function AdvancedCharts({ transactions, expenseCategories }: AdvancedChartsProps) {
  // Prepare daily spending trend data
  const dailyTrendData = useMemo(() => {
    const dailySpending = transactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((acc, t) => {
        const date = new Date(t.mail_time).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(dailySpending)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14) // Last 14 days
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: Math.round(amount),
      }));
  }, [transactions]);

  // Prepare monthly comparison data
  const monthlyData = useMemo(() => {
    const now = new Date();
    const currentMonth = transactions.filter(t => {
      const tDate = new Date(t.mail_time);
      return tDate.getMonth() === now.getMonth() && 
             tDate.getFullYear() === now.getFullYear();
    });

    const previousMonth = transactions.filter(t => {
      const tDate = new Date(t.mail_time);
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return tDate.getMonth() === prevMonth.getMonth() && 
             tDate.getFullYear() === prevMonth.getFullYear();
    });

    const currentIncome = currentMonth.filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    const currentExpenses = currentMonth.filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const prevIncome = previousMonth.filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    const prevExpenses = previousMonth.filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    return [
      {
        month: 'Previous',
        income: Math.round(prevIncome),
        expenses: Math.round(prevExpenses),
      },
      {
        month: 'Current',
        income: Math.round(currentIncome),
        expenses: Math.round(currentExpenses),
      },
    ];
  }, [transactions]);


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    
    return (
      <div className="bg-card border border-border rounded-lg p-3">
        <p className="font-semibold text-foreground text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: ₹{entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Daily Spending Trend */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Daily Spending Trend</CardTitle>
          <p className="text-sm text-muted-foreground">Last 14 days</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData}>
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#spendingGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}