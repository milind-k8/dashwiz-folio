import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinancialStore } from '@/store/financialStore';

export function ExpenseChart() {
  const { data } = useFinancialStore();

  return (
    <Card className="p-6 shadow-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">All Expenses</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Daily</span>
            <p className="font-semibold text-foreground">$573.12</p>
          </div>
          <div>
            <span className="text-muted-foreground">Weekly</span>
            <p className="font-semibold text-foreground">$4,791</p>
          </div>
          <div>
            <span className="text-muted-foreground">Monthly</span>
            <p className="font-semibold text-foreground">$19,112</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.expenseCategories}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
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
        
        <div className="flex-1 pl-6">
          <div className="space-y-3">
            {data.expenseCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-sm text-muted-foreground">{category.category}</span>
                </div>
                <span className="text-sm font-medium text-foreground">
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