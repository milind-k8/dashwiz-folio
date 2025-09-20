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
  metricType: 'balance' | 'expenses' | 'income';
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
  const isExpenses = metricType === 'expenses';

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 ease-out",
        "hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]",
        "border-0 shadow-lg backdrop-blur-sm",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 before:transition-opacity before:duration-300",
        "hover:before:opacity-100",
        isHighlighted
          ? "bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white before:from-primary/20 before:to-primary/10"
          : isExpenses
          ? "bg-gradient-to-br from-red-500/10 via-red-500/5 to-red-500/10 text-foreground before:from-red-500/10 before:to-red-500/5"
          : "bg-gradient-to-br from-card/80 via-card/60 to-card/40 text-foreground before:from-primary/5 before:to-primary/10",
        className
      )}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-20" />
      
      <CardContent className="relative p-4 space-y-4">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className={cn(
              "text-xs font-medium tracking-wide uppercase",
              isHighlighted ? "text-white/80" : "text-muted-foreground"
            )}>
              {title}
            </h3>
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              isHighlighted ? "text-white drop-shadow-sm" : "text-foreground"
            )}>
              {value}
            </p>
            
            {/* Trend indicator */}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                isPositiveTrend ? "text-green-500" : isNegativeTrend ? "text-red-500" : "text-muted-foreground"
              )}>
                {isPositiveTrend ? (
                  <TrendingUp className="w-3 h-3" />
                ) : isNegativeTrend ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                <span>{trend}</span>
              </div>
            )}
          </div>

          {/* Icon container with enhanced styling */}
          <div className={cn(
            "p-3 rounded-xl transition-all duration-300",
            "group-hover:scale-110 group-hover:rotate-3",
            isHighlighted
              ? "bg-white/20 backdrop-blur-sm shadow-lg"
              : isExpenses
              ? "bg-red-500/20 backdrop-blur-sm shadow-md"
              : "bg-primary/10 backdrop-blur-sm shadow-md"
          )}>
            <Icon className={cn(
              "w-5 h-5 transition-colors duration-300",
              isHighlighted ? "text-white" : isExpenses ? "text-red-500" : "text-primary"
            )} />
          </div>
        </div>

        {/* Bank Breakdown Section */}
        {filteredBreakdown.length > 0 && (
          <div className="space-y-2 border-t border-white/10 pt-3">
            <div className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide">
              Breakdown
            </div>
            <div className="space-y-1">
              {filteredBreakdown.map((bank, index) => {
                const bankValue = getMetricValue(bank);
                const delay = index * 50;

                return (
                  <div
                    key={bank.bank}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md transition-all duration-300",
                      "hover:bg-white/5 hover:scale-[1.01]",
                      "animate-in slide-in-from-left-2 fade-in-0",
                      isHighlighted ? "bg-white/5" : isExpenses ? "bg-red-500/10" : "bg-muted/30"
                    )}
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    <span className={cn(
                      "text-xs font-medium truncate uppercase",
                      isHighlighted ? "text-white/90" : "text-foreground/80"
                    )}>
                      {bank.bank}
                    </span>
                    <span className={cn(
                      "font-semibold text-xs",
                      isHighlighted ? "text-white" : isExpenses ? "text-red-600" : "text-foreground"
                    )}>
                      {isExpenses ? "-" : ""}₹{bankValue.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
      </CardContent>
    </Card>
  );
}
