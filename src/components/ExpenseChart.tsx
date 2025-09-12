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
      <div
        className="rounded-md"
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 8,
          boxShadow: 'var(--shadow-card)',
          color: 'hsl(var(--foreground))',
          padding: '8px 10px',
          maxWidth: 240,
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          lineHeight: 1.25,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 9999,
              backgroundColor: (payload[0] && payload[0].payload && (payload[0].payload as any).color) || 'hsl(var(--primary))',
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 600 }}>{p.category}</span>
          {percent && (
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{percent}</span>
          )}
        </div>
        <div style={{ fontWeight: 600, marginBottom: tags ? 4 : 0 }}>{amount}</div>
        {p.tags && p.tags.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.tags.map((t, i) => (
                <span
                  key={`${t}-${i}`}
                  style={{
                    fontSize: 11,
                    color: 'hsl(var(--foreground))',
                    backgroundColor: 'hsl(var(--muted))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 9999,
                    padding: '2px 8px',
                    lineHeight: 1.2,
                  }}
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
    <Card className="p-4 sm:p-6 shadow-card">
      <div className="mb-4 sm:mb-6 flex items-end justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">All Expenses</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">By category</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Total</span>
          <div className="text-sm sm:text-base font-semibold text-foreground">₹{totalAmount.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="w-full">
          <div className="relative h-[200px]">
            <ResponsiveContainer width="100%" height={200}>
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
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {Array.isArray(chartData) && chartData.map((category: any, index: number) => (
                <UiTooltip key={index}>
                  <UiTooltipTrigger asChild>
                    <div className="flex items-center gap-2 min-w-0 cursor-default">
                      <span 
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      ></span>
                      <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[10rem]">{category.category}</span>
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
    </Card>
  );
}