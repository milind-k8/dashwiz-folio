import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  isHighlighted?: boolean;
  onClick?: () => void;
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  isHighlighted = false,
  onClick
}: MetricCardProps) {
  return (
    <Card 
      className={cn(
        "p-4 transition-all duration-300 border",
        isHighlighted 
          ? 'bg-gradient-primary text-primary-foreground border-primary' 
          : 'bg-card border-border',
        onClick && 'cursor-pointer hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-2 rounded-lg",
          isHighlighted 
            ? 'bg-white/20' 
            : 'bg-primary/10'
        )}>
          <Icon className={cn(
            "w-5 h-5",
            isHighlighted 
              ? 'text-white' 
              : 'text-primary'
          )} />
        </div>
        {trend && (
          <span className={cn(
            "text-sm font-medium",
            isHighlighted 
              ? 'text-white/80' 
              : 'text-success'
          )}>
            {trend}
          </span>
        )}
      </div>
      
      <div>
        <p className={cn(
          "text-sm font-medium mb-1.5 font-roboto",
          isHighlighted 
            ? 'text-white/90' 
            : 'text-muted-foreground'
        )}>
          {title}
        </p>
        <p className={cn(
          "text-2xl font-normal font-google",
          isHighlighted 
            ? 'text-white' 
            : 'text-foreground'
        )}>
          {value}
        </p>
      </div>
    </Card>
  );
}