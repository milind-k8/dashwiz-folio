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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Financial Trends</h3>
          <p className="text-sm text-muted-foreground">Monthly income, expenses & savings</p>
        </div>
      </div>
      
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
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
      </div>
    </div>
  );
}