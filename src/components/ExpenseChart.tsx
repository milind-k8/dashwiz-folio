import { useMemo, useCallback } from 'react';
import { Tooltip as UiTooltip, TooltipContent as UiTooltipContent, TooltipProvider as UiTooltipProvider, TooltipTrigger as UiTooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useFinancialStore } from '@/store/financialStore';

interface ExpenseCategoryPoint {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  tags?: string[];
}

interface ExpenseChartProps {
  data?: ExpenseCategoryPoint[];
}

export function ExpenseChart({ data: series }: ExpenseChartProps) {
  const { data } = useFinancialStore();
  const chartData = useMemo(() => series ?? data.expenseCategories, [series, data.expenseCategories]);
  
  const totalAmount = useMemo(() => {
    return Array.isArray(chartData)
      ? (chartData as any[]).reduce((sum, item) => sum + Number(item.amount || 0), 0)
      : 0;
  }, [chartData]);

  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const p = payload[0] && (payload[0].payload as ExpenseCategoryPoint);
    if (!p) return null;
    const amount = `₹${Number(p.amount).toLocaleString()}`;
    const percent = typeof p.percentage === 'number' ? `${p.percentage}%` : '';
    const tags = p.tags && p.tags.length > 0 ? p.tags.join(', ') : '';
    return (
      <div className="bg-card border border-border rounded-lg p-3 animate-scale-in max-w-[240px]">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: (payload[0] && payload[0].payload && (payload[0].payload as any).color) || 'hsl(var(--primary))' }}
          />
          <span className="font-semibold text-foreground text-sm">{p.category}</span>
          {percent && (
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{percent}</span>
          )}
        </div>
        <div className="font-bold text-foreground mb-2">{amount}</div>
        {p.tags && p.tags.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {p.tags.map((t, i) => (
                <span
                  key={`${t}-${i}`}
                  className="text-xs text-foreground bg-muted/70 border border-border rounded-full px-2.5 py-1 hover:bg-muted transition-colors"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Expense Breakdown</h3>
          <p className="text-sm text-muted-foreground">Spending by category</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Total Spent</span>
          <div className="text-lg font-bold text-foreground">₹{totalAmount.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="w-full">
          <div className="relative h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData as any}
                layout="horizontal"
                margin={{
                  top: 20,
                  right: 30,
                  left: 60,  // Reduced from 80 for mobile
                  bottom: 20,
                }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category"
                  dataKey="category" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}  // Reduced from 70 to match margin
                />
                <Bar 
                  dataKey="amount" 
                  radius={[0, 4, 4, 0]}
                >
                  {Array.isArray(chartData) && chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(entry as any).color} />
                  ))}
                </Bar>
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none', zIndex: 20 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}