import { useMemo, useCallback } from 'react';
import { Tooltip as UiTooltip, TooltipContent as UiTooltipContent, TooltipProvider as UiTooltipProvider, TooltipTrigger as UiTooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 animate-scale-in max-w-[240px]">
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
          <div className="relative h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData as any}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  dataKey="amount"
                  startAngle={90}
                  endAngle={-270}
                >
                  {Array.isArray(chartData) && chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(entry as any).color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none', zIndex: 20 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-sm font-semibold text-foreground">₹{totalAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full pt-2">
          <UiTooltipProvider delayDuration={0}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {Array.isArray(chartData) && chartData.slice(0, 8).map((category: any, index: number) => (
                <UiTooltip key={index}>
                  <UiTooltipTrigger asChild>
                    <div className="flex items-center gap-2 min-w-0 cursor-default p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <span 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      ></span>
                      <span className="text-xs text-muted-foreground truncate">{category.category}</span>
                    </div>
                  </UiTooltipTrigger>
                  <UiTooltipContent sideOffset={6} className="max-w-[240px] leading-5 break-words">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }}></span>
                      <span className="font-medium text-foreground text-sm break-words">{category.category}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      ₹{Number(category.amount).toLocaleString()} {typeof category.percentage === 'number' ? `(${category.percentage}%)` : ''}
                    </div>
                    {Array.isArray(category.tags) && category.tags.length > 0 && (
                      <div className="mt-2">
                        <div className="text-[11px] text-muted-foreground mb-1">Tags</div>
                        <div className="flex flex-wrap gap-1.5">
                          {category.tags.map((t: string, i: number) => (
                            <span
                              key={`${t}-${i}`}
                              className="text-[11px] text-foreground bg-muted border border-border rounded-full px-2 py-0.5"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </UiTooltipContent>
                </UiTooltip>
              ))}
            </div>
          </UiTooltipProvider>
        </div>
      </div>
    </div>
  );
}