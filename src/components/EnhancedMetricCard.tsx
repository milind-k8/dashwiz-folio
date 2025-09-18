import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

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
  isHighlighted?: boolean;
  bankBreakdown?: BankBreakdown[];
  metricType: 'balance' | 'expenses' | 'income';
}

export function EnhancedMetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  isHighlighted = false,
  bankBreakdown = [],
  metricType
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

  const hasBreakdown = bankBreakdown.length > 0;
  const filteredBreakdown = bankBreakdown.filter(item => getMetricValue(item) > 0);

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-500 ease-out hover:shadow-xl hover:-translate-y-1 ${
        isHighlighted 
          ? 'bg-gradient-to-br from-primary via-primary to-primary/90 text-white border-0 shadow-lg' 
          : 'bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm hover:border-primary/20 hover:bg-card/80'
      }`}
    >
      {/* Subtle gradient overlay for highlighted cards */}
      {isHighlighted && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none" />
      )}
      
      <CardContent className="p-6 relative">
        {/* Header Section with Icon and Trend */}
        <div className="flex items-start justify-between mb-6">
          <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
            isHighlighted 
              ? 'bg-white/15 backdrop-blur-sm shadow-sm' 
              : 'bg-primary/8 group-hover:bg-primary/12'
          }`}>
            <Icon className={`w-5 h-5 transition-colors duration-300 ${
              isHighlighted 
                ? 'text-white drop-shadow-sm' 
                : 'text-primary group-hover:text-primary/80'
            }`} />
          </div>
          
          {trend && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
              isHighlighted 
                ? 'bg-white/15 text-white/90 backdrop-blur-sm' 
                : 'bg-success/10 text-success border border-success/20'
            }`}>
              {trend}
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className={`text-sm font-medium tracking-wide transition-colors duration-300 ${
              isHighlighted 
                ? 'text-white/75' 
                : 'text-muted-foreground group-hover:text-foreground/80'
            }`}>
              {title}
            </h3>
            <p className={`text-3xl font-bold tracking-tight transition-all duration-300 ${
              isHighlighted 
                ? 'text-white drop-shadow-sm' 
                : 'text-foreground group-hover:text-primary'
            }`}>
              {value}
            </p>
          </div>

          {/* Bank Breakdown Section */}
          {hasBreakdown && filteredBreakdown.length > 0 && (
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-xs font-semibold uppercase tracking-wider ${
                  isHighlighted 
                    ? 'text-white/60' 
                    : 'text-muted-foreground'
                }`}>
                  By Bank
                </h4>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  isHighlighted 
                    ? 'bg-white/10 text-white/80' 
                    : 'bg-muted/50 text-muted-foreground'
                }`}>
                  {filteredBreakdown.length}
                </span>
              </div>
              
              <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                {filteredBreakdown.map((bank, index) => {
                  const bankValue = getMetricValue(bank);
                  const isLargest = index === 0; // Assuming sorted by value
                  
                  return (
                    <div 
                      key={bank.bank} 
                      className={`group/item flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover:scale-[1.02] ${
                        isHighlighted 
                          ? 'bg-white/8 hover:bg-white/12 backdrop-blur-sm' 
                          : 'bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isHighlighted 
                            ? 'bg-white/60' 
                            : 'bg-primary/60'
                        } ${isLargest ? 'ring-2 ring-white/30' : ''}`} />
                        
                        <span className={`font-medium text-sm truncate transition-colors duration-300 ${
                          isHighlighted 
                            ? 'text-white/90 group-hover/item:text-white' 
                            : 'text-foreground/80 group-hover/item:text-foreground'
                        }`}>
                          {bank.bank}
                        </span>
                      </div>
                      
                      <div className={`font-bold text-sm transition-all duration-300 ${
                        isHighlighted 
                          ? 'text-white group-hover/item:scale-105' 
                          : 'text-foreground group-hover/item:text-primary group-hover/item:scale-105'
                      }`}>
                        ₹{bankValue.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}