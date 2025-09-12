import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinancialStore } from '@/store/financialStore';
import { IndianRupee } from 'lucide-react';

export function ExpenseChart() {
  const { data } = useFinancialStore();

  return (
    <Card className="p-4 sm:p-6 shadow-card">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">All Expenses</h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div>
            <span className="text-muted-foreground text-xs sm:text-sm">Daily</span>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4" />
              <p className="font-semibold text-foreground text-sm sm:text-base">573.12</p>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs sm:text-sm">Weekly</span>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4" />
              <p className="font-semibold text-foreground text-sm sm:text-base">4,791</p>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs sm:text-sm">Monthly</span>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4" />
              <p className="font-semibold text-foreground text-sm sm:text-base">19,112</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data.expenseCategories}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="amount"
                startAngle={90}
                endAngle={-270}
              >
                {data.expenseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-card)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex-1 w-full lg:pl-4">
          <div className="space-y-2 sm:space-y-3">
            {data.expenseCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-xs sm:text-sm text-muted-foreground truncate">{category.category}</span>
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  {category.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}