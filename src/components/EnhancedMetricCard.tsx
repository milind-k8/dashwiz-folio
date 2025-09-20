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
  
  // Check if custom background colors are applied
  const hasCustomBg = className && (
    className.includes('bg-gradient-to-br') || 
    className.includes('bg-red-') || 
    className.includes('bg-blue-') || 
    className.includes('bg-green-') || 
    className.includes('bg-yellow-') || 
    className.includes('bg-purple-') || 
    className.includes('bg-pink-') || 
    className.includes('bg-orange-') || 
    className.includes('bg-indigo-') || 
    className.includes('bg-teal-') || 
    className.includes('bg-cyan-') || 
    className.includes('bg-emerald-') || 
    className.includes('bg-lime-') || 
    className.includes('bg-amber-') || 
    className.includes('bg-violet-') || 
    className.includes('bg-fuchsia-') || 
    className.includes('bg-rose-') || 
    className.includes('bg-slate-') || 
    className.includes('bg-gray-') || 
    className.includes('bg-zinc-') || 
    className.includes('bg-neutral-') || 
    className.includes('bg-stone-')
  );
  
  // Determine if we should use light or dark text based on background
  const useLightText = hasCustomBg && (
    className.includes('text-white') || 
    className.includes('from-red-500') || 
    className.includes('from-blue-500') || 
    className.includes('from-green-500') || 
    className.includes('from-purple-500') || 
    className.includes('from-pink-500') || 
    className.includes('from-indigo-500') || 
    className.includes('from-teal-500') || 
    className.includes('from-cyan-500') || 
    className.includes('from-emerald-500') || 
    className.includes('from-violet-500') || 
    className.includes('from-violet-500') || 
    className.includes('from-rose-500') || 
    className.includes('from-slate-500') || 
    className.includes('from-gray-500') || 
    className.includes('from-zinc-500') || 
    className.includes('from-neutral-500') || 
    className.includes('from-stone-500')
  );
  
  const useDarkText = hasCustomBg && !useLightText;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 ease-out",
        "hover:shadow-elevated hover:-translate-y-1 hover:scale-[1.01]",
        "active:scale-[0.98] active:transition-transform active:duration-150",
        isHighlighted
          ? "bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white border-0 shadow-card"
          : "bg-card border-border shadow-card hover:shadow-elevated",
        className
      )}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-20" />
      
      <CardContent className="relative p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className={cn(
              "text-xs font-medium tracking-wide uppercase truncate",
              isHighlighted ? "text-white/80" : useLightText ? "text-white/80" : useDarkText ? "text-gray-800" : "text-muted-foreground"
            )}>
              {title}
            </h3>
            <p className={cn(
              "text-lg sm:text-xl lg:text-2xl font-bold tracking-tight break-words",
              isHighlighted ? "text-white drop-shadow-sm" : useLightText ? "text-white drop-shadow-sm" : useDarkText ? "text-gray-900" : "text-foreground"
            )}>
              {value}
            </p>
            
            {/* Trend indicator */}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                isPositiveTrend ? "text-success" : isNegativeTrend ? "text-destructive" : useLightText ? "text-white/70" : useDarkText ? "text-gray-600" : "text-muted-foreground"
              )}>
                {isPositiveTrend ? (
                  <TrendingUp className="w-3 h-3 flex-shrink-0" />
                ) : isNegativeTrend ? (
                  <TrendingDown className="w-3 h-3 flex-shrink-0" />
                ) : null}
                <span className="truncate">{trend}</span>
              </div>
            )}
          </div>

          {/* Icon container with enhanced styling - positioned at top right */}
          <div className={cn(
            "p-2 sm:p-3 rounded-xl transition-all duration-300 flex-shrink-0 self-start",
            "group-hover:scale-110 group-hover:rotate-3",
            isHighlighted 
              ? "bg-white/20" 
              : useLightText 
                ? "bg-white/20" 
                : useDarkText 
                  ? "bg-gray-200/50" 
                  : "bg-primary/10"
          )}>
            <Icon className={cn(
              "w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300",
              isHighlighted 
                ? "text-white" 
                : useLightText 
                  ? "text-white" 
                  : useDarkText 
                    ? "text-gray-700" 
                    : "text-primary"
            )} />
          </div>
        </div>

        {/* Bank Breakdown Section */}
        {filteredBreakdown.length > 0 && (
          <div className={cn(
            "space-y-2 border-t pt-3",
            isHighlighted || useLightText ? "border-white/10" : useDarkText ? "border-gray-300/50" : "border-border"
          )}>
            <div className={cn(
              "text-xs font-medium uppercase tracking-wide",
              isHighlighted || useLightText ? "text-white/70" : useDarkText ? "text-gray-600" : "text-muted-foreground/70"
            )}>
              Breakdown
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {filteredBreakdown.slice(0, 3).map((bank, index) => {
                const bankValue = getMetricValue(bank);
                const delay = index * 50;

                return (
                  <div
                    key={bank.bank}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md transition-all duration-300",
                      "hover:bg-muted/50 hover:scale-[1.01]",
                      "animate-in slide-in-from-left-2 fade-in-0",
                      isHighlighted || useLightText ? "bg-white/10" : useDarkText ? "bg-gray-100/50" : "bg-muted/30"
                    )}
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    <span className={cn(
                      "text-xs font-medium truncate uppercase flex-1 min-w-0",
                      isHighlighted || useLightText ? "text-white/90" : useDarkText ? "text-gray-700" : "text-foreground/80"
                    )}>
                      {bank.bank}
                    </span>
                    <span className={cn(
                      "font-semibold text-xs flex-shrink-0 ml-2",
                      isHighlighted || useLightText ? "text-white" : useDarkText ? "text-gray-900" : "text-foreground"
                    )}>
                      {isExpenses ? "-" : ""}₹{bankValue.toLocaleString()}
                    </span>
                  </div>
                );
              })}
              {filteredBreakdown.length > 3 && (
                <div className={cn(
                  "text-xs text-center py-1",
                  isHighlighted || useLightText ? "text-white/60" : useDarkText ? "text-gray-500" : "text-muted-foreground/60"
                )}>
                  +{filteredBreakdown.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
      </CardContent>
    </Card>
  );
}
