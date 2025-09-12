import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinancialStore } from '@/store/financialStore';

interface MonthlyPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface FinanceChartProps {
  data?: MonthlyPoint[];
}

export function FinanceChart({ data: series }: FinanceChartProps) {
  const { data } = useFinancialStore();
  const chartData = series ?? data.monthlyData;

  return (
    <Card className="p-4 sm:p-6 shadow-card">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Finances</h3>
        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary"></div>
            <span className="text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-destructive"></div>
            <span className="text-muted-foreground">Expenses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-success"></div>
            <span className="text-muted-foreground">Savings</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              return (
                <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 animate-fade-in">
                  <p className="text-sm font-medium text-foreground mb-2">{label}</p>
                  <div className="space-y-1.5">
                    {payload.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-xs text-muted-foreground capitalize">
                            {entry.dataKey}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          ₹{Number(entry.value).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="hsl(var(--destructive))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="savings" 
            stroke="hsl(var(--success))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}