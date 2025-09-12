import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  isHighlighted?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  isHighlighted = false 
}: MetricCardProps) {
  return (
    <Card 
      className={`p-4 sm:p-6 transition-all duration-300 hover:shadow-elevated ${
        isHighlighted 
          ? 'bg-gradient-card text-white border-0 shadow-card' 
          : 'bg-card border-border shadow-card hover:shadow-elevated'
      }`}
    >
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
      
      <div>
        <p className={`text-sm font-medium mb-1 sm:mb-2 ${
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
    </Card>
  );
}