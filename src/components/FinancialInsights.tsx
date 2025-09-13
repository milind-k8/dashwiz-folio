import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Wallet, CreditCard } from 'lucide-react';

interface FinancialInsight {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  description: string;
}

interface SpendingGoal {
  category: string;
  spent: number;
  budget: number;
  progress: number;
}

interface FinancialInsightsProps {
  insights: FinancialInsight[];
  spendingGoals: SpendingGoal[];
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export function FinancialInsights({ 
  insights, 
  spendingGoals, 
  totalBalance, 
  monthlyIncome, 
  monthlyExpenses 
}: FinancialInsightsProps) {
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  
  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Financial Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <div key={index} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm text-foreground">{insight.title}</h4>
                <div className={`p-1 rounded-full ${
                  insight.trend === 'up' ? 'bg-income/10 text-income' :
                  insight.trend === 'down' ? 'bg-expense/10 text-expense' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {insight.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                   insight.trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
                   <Target className="w-3 h-3" />}
                </div>
              </div>
              <p className="text-lg font-bold text-foreground mb-1">{insight.value}</p>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
              {insight.change !== 0 && (
                <Badge 
                  variant={insight.trend === 'up' ? 'default' : 'secondary'}
                  className={`mt-2 text-xs ${
                    insight.trend === 'up' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'
                  }`}
                >
                  {insight.change > 0 ? '+' : ''}{insight.change}%
                </Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Spending Goals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Spending Goals
        </h3>
        
        <div className="space-y-4">
          {spendingGoals.map((goal, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{goal.category}</span>
                <span className="text-sm text-muted-foreground">
                  ₹{goal.spent.toLocaleString()} / ₹{goal.budget.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={goal.progress} 
                className={`h-2 ${
                  goal.progress > 90 ? '[&>[data-progress]]:bg-expense' : 
                  goal.progress > 70 ? '[&>[data-progress]]:bg-warning' : 
                  '[&>[data-progress]]:bg-income'
                }`}
              />
              <div className="flex justify-between text-xs">
                <span className={`${
                  goal.progress > 90 ? 'text-expense' : 
                  goal.progress > 70 ? 'text-warning' : 
                  'text-income'
                }`}>
                  {goal.progress.toFixed(1)}% used
                </span>
                <span className="text-muted-foreground">
                  ₹{(goal.budget - goal.spent).toLocaleString()} remaining
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Financial Health Score */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Financial Health Score
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Savings Rate</span>
              <span className="font-bold">{savingsRate.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(savingsRate, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground">
              Recommended: 20% or higher
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-income/10 rounded-full">
                <TrendingUp className="w-6 h-6 text-income" />
              </div>
              <p className="text-sm font-medium">Monthly Income</p>
              <p className="text-lg font-bold text-income">₹{monthlyIncome.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-expense/10 rounded-full">
                <CreditCard className="w-6 h-6 text-expense" />
              </div>
              <p className="text-sm font-medium">Monthly Expenses</p>
              <p className="text-lg font-bold text-expense">₹{monthlyExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}