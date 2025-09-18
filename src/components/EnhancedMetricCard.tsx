import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      className={`transition-all duration-300 ${
        isHighlighted 
          ? 'bg-gradient-card text-white border-0 shadow-card' 
          : 'bg-card border-border shadow-card hover:shadow-elevated'
      }`}
    >
      <CardContent className="p-3 sm:p-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className={`p-2 rounded-lg ${
            isHighlighted 
              ? 'bg-white/20' 
              : 'bg-primary/10'
          }`}>
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${
              isHighlighted 
                ? 'text-white' 
                : 'text-primary'
            }`} />
          </div>
          {trend && (
            <span className={`text-xs sm:text-sm font-medium ${
              isHighlighted 
                ? 'text-white/80' 
                : 'text-success'
            }`}>
              {trend}
            </span>
          )}
        </div>
        
        {/* Main Metric */}
        <div className="space-y-2">
          <p className={`text-sm font-medium ${
            isHighlighted 
              ? 'text-white/80' 
              : 'text-muted-foreground'
          }`}>
            {title}
          </p>
          <p className={`text-xl sm:text-2xl font-bold ${
            isHighlighted 
              ? 'text-white' 
              : 'text-foreground'
          }`}>
            {value}
          </p>
        </div>

        {/* Bank Breakdown */}
        {hasBreakdown && filteredBreakdown.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className={`text-xs font-medium ${
              isHighlighted 
                ? 'text-white/70' 
                : 'text-muted-foreground'
            }`}>
              By Bank ({filteredBreakdown.length})
            </p>
            
            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
              {filteredBreakdown.map((bank, index) => {
                const bankValue = getMetricValue(bank);
                return (
                  <div 
                    key={bank.bank} 
                    className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs ${
                      isHighlighted 
                        ? 'bg-white/10' 
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0.5 ${
                          isHighlighted 
                            ? 'border-white/30 text-white/90' 
                            : 'border-primary/30 text-primary'
                        }`}
                      >
                        {bank.bank}
                      </Badge>
                    </div>
                    <span className={`font-semibold text-sm ${
                      isHighlighted 
                        ? 'text-white' 
                        : 'text-foreground'
                    }`}>
                      ₹{bankValue.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}