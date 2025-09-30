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

  // Material Design 3 styles with Google colors and left accent border
  const getMetricStyles = () => {
    switch (metricType) {
      case 'balance':
        return {
          cardClass: 'bg-google-blue-light border-l-4 border-l-google-blue border-y border-r border-border/50',
          iconBg: 'bg-google-blue/10',
          iconColor: 'text-google-blue',
          textColor: 'text-google-blue',
          mutedColor: 'text-google-blue/70',
          borderColor: 'border-google-blue/20',
          breakdown: 'bg-google-blue/5'
        };
      case 'expenses':
        return {
          cardClass: 'bg-google-red-light border-l-4 border-l-google-red border-y border-r border-border/50',
          iconBg: 'bg-google-red/10',
          iconColor: 'text-google-red',
          textColor: 'text-google-red',
          mutedColor: 'text-google-red/70',
          borderColor: 'border-google-red/20',
          breakdown: 'bg-google-red/5'
        };
      case 'income':
        return {
          cardClass: 'bg-google-green-light border-l-4 border-l-google-green border-y border-r border-border/50',
          iconBg: 'bg-google-green/10',
          iconColor: 'text-google-green',
          textColor: 'text-google-green',
          mutedColor: 'text-google-green/70',
          borderColor: 'border-google-green/20',
          breakdown: 'bg-google-green/5'
        };
      case 'spending':
        return {
          cardClass: 'bg-google-yellow-light border-l-4 border-l-google-yellow border-y border-r border-border/50',
          iconBg: 'bg-google-yellow/10',
          iconColor: 'text-google-yellow',
          textColor: 'text-google-yellow',
          mutedColor: 'text-google-yellow/70',
          borderColor: 'border-google-yellow/20',
          breakdown: 'bg-google-yellow/5'
        };
      default:
        return {
          cardClass: 'bg-card border border-border',
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          textColor: 'text-foreground',
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
        "group relative overflow-hidden transition-all duration-300 rounded-xl shadow-md hover:shadow-lg",
        "active:scale-[0.98] active:transition-transform active:duration-150",
        styles.cardClass,
        className
      )}
    >
      <CardContent className="relative p-4 space-y-3">
        {/* Icon and value section */}
        <div className="space-y-3">
          {/* Circular Icon Container - Material Design 3 */}
          <div className="flex justify-start">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
              "group-hover:scale-110",
              styles.iconBg
            )}>
              <Icon className={cn(
                "w-5 h-5 transition-colors duration-300",
                styles.iconColor
              )} />
            </div>
          </div>

          {/* Value and Title - Google Sans Typography */}
          <div className="space-y-1">
            <p className={cn(
              "text-2xl font-bold font-google tracking-tight leading-tight",
              styles.textColor
            )}>
              {value}
            </p>
            <h3 className={cn(
              "text-sm font-medium font-roboto",
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
