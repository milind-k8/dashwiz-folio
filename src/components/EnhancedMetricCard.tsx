import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BankBreakdown {
  bank: string;
  balance?: number;
  income?: number;
  expenses?: number;
}

interface EnhancedMetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendValue?: number;
  isHighlighted?: boolean;
  bankBreakdown?: BankBreakdown[];
  metricType: 'balance' | 'expenses' | 'income' | 'spending';
  className?: string;
}

export function EnhancedMetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  isHighlighted = false,
  bankBreakdown = [],
  metricType,
  className
}: EnhancedMetricCardProps) {

  const getMetricValue = (breakdown: BankBreakdown) => {
    switch (metricType) {
      case 'balance':
        return breakdown.balance || 0;
      case 'expenses':
      case 'spending':
        return breakdown.expenses || 0;
      case 'income':
        return breakdown.income || 0;
      default:
        return 0;
    }
  };

  const filteredBreakdown = bankBreakdown.filter(item => getMetricValue(item) > 0);
  const isPositiveTrend = trendValue && trendValue > 0;
  const isNegativeTrend = trendValue && trendValue < 0;

  // Define metric-specific styles based on design system - colorful card backgrounds
  const getMetricStyles = () => {
    switch (metricType) {
      case 'balance':
        return {
          cardClass: 'bg-card-balance text-card-balance-foreground border border-card-balance-foreground/30',
          iconBg: 'bg-card-balance-foreground/10',
          iconColor: 'text-card-balance-foreground',
          textColor: 'text-card-balance-foreground',
          mutedColor: 'text-card-balance-foreground/70',
          borderColor: 'border-card-balance-foreground/20',
          breakdown: 'bg-card-balance-foreground/5'
        };
      case 'expenses':
        return {
          cardClass: 'bg-card-expenses text-card-expenses-foreground border border-card-expenses-foreground/30',
          iconBg: 'bg-card-expenses-foreground/10',
          iconColor: 'text-card-expenses-foreground',
          textColor: 'text-card-expenses-foreground',
          mutedColor: 'text-card-expenses-foreground/70',
          borderColor: 'border-card-expenses-foreground/20',
          breakdown: 'bg-card-expenses-foreground/5'
        };
      case 'income':
        return {
          cardClass: 'bg-card-income text-card-income-foreground border border-card-income-foreground/30',
          iconBg: 'bg-card-income-foreground/10',
          iconColor: 'text-card-income-foreground',
          textColor: 'text-card-income-foreground',
          mutedColor: 'text-card-income-foreground/70',
          borderColor: 'border-card-income-foreground/20',
          breakdown: 'bg-card-income-foreground/5'
        };
      case 'spending':
        return {
          cardClass: 'bg-card-spending text-card-spending-foreground border border-card-spending-foreground/30',
          iconBg: 'bg-card-spending-foreground/10',
          iconColor: 'text-card-spending-foreground',
          textColor: 'text-card-spending-foreground',
          mutedColor: 'text-card-spending-foreground/70',
          borderColor: 'border-card-spending-foreground/20',
          breakdown: 'bg-card-spending-foreground/5'
        };
      default:
        return {
          cardClass: 'bg-card text-card-foreground border border-border',
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          textColor: 'text-card-foreground',
          mutedColor: 'text-muted-foreground',
          borderColor: 'border-border',
          breakdown: 'bg-muted/30'
        };
    }
  };

  const styles = getMetricStyles();

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 rounded-2xl",
        "active:scale-[0.98] active:transition-transform active:duration-150",
        styles.cardClass,
        className
      )}
    >
      <CardContent className="relative p-5 space-y-4">
        {/* Icon and value section */}
        <div className="space-y-3">
          {/* Icon */}
          <div className="flex justify-start">
            <div className={cn(
              "p-2.5 rounded-lg transition-all duration-300",
              "group-hover:scale-110",
              styles.iconBg
            )}>
              <Icon className={cn(
                "w-5 h-5 transition-colors duration-300",
                styles.iconColor
              )} />
            </div>
          </div>

          {/* Value */}
          <div className="space-y-1">
            <p className={cn(
              "text-xl font-bold tracking-tight",
              styles.textColor
            )}>
              {value}
            </p>
            <h3 className={cn(
              "text-sm font-medium",
              styles.mutedColor
            )}>
              {title}
            </h3>
          </div>
        </div>
        
        {/* Trend indicator */}
        {trend && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            isPositiveTrend ? "text-success" : isNegativeTrend ? "text-destructive" : styles.mutedColor
          )}>
            {isPositiveTrend ? (
              <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
            ) : isNegativeTrend ? (
              <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
            ) : null}
            <span className="truncate">{trend}</span>
          </div>
        )}

        {/* Bank Breakdown Section */}
        {filteredBreakdown.length > 0 && (
          <div className={cn(
            "space-y-2 border-t pt-3",
            styles.borderColor
          )}>
            <div className={cn(
              "text-xs font-medium uppercase tracking-wide",
              styles.mutedColor
            )}>
              Breakdown
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {filteredBreakdown.slice(0, 3).map((bank, index) => {
                const bankValue = getMetricValue(bank);

                return (
                  <div
                    key={bank.bank}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md transition-all duration-300",
                      "hover:scale-[1.01]",
                      styles.breakdown
                    )}
                  >
                    <span className={cn(
                      "text-xs font-medium truncate uppercase flex-1 min-w-0",
                      styles.textColor
                    )}>
                      {bank.bank}
                    </span>
                    <span className={cn(
                      "font-semibold text-xs flex-shrink-0 ml-2",
                      styles.textColor
                    )}>
                      {(metricType === 'expenses' || metricType === 'spending') ? "-" : ""}₹{bankValue.toLocaleString()}
                    </span>
                  </div>
                );
              })}
              {filteredBreakdown.length > 3 && (
                <div className={cn(
                  "text-xs text-center py-1",
                  styles.mutedColor
                )}>
                  +{filteredBreakdown.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
