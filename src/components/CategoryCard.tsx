import { useState, useEffect } from 'react';
import { ChevronRight, TrendingDown } from 'lucide-react';

interface CategoryCardProps {
  category: string;
  amount: number;
  percentage: number;
  tags: string[];
  tagSpending: Record<string, number>;
  tagCounts?: Record<string, number>;
  shouldExpand?: boolean;
  searchTerm?: string;
  transactionCount?: number;
}

export function CategoryCard({
  category,
  amount,
  percentage,
  tags,
  tagSpending,
  tagCounts = {},
  shouldExpand = false,
  searchTerm = '',
  transactionCount = 0
}: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(shouldExpand);

  // Update expansion state when shouldExpand prop changes
  useEffect(() => {
    setIsExpanded(shouldExpand);
  }, [shouldExpand]);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      {/* Main Category Info */}
      <div 
        className="p-3 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 text-muted-foreground ${isExpanded ? 'rotate-90' : 'rotate-0'}`} />
            <div className="min-w-0">
              <h4 className="font-medium text-foreground text-sm truncate">
                {category} {tags.length} merchants
              </h4>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0 flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-destructive" />
            <div className="font-medium text-destructive text-sm">
              ₹{amount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Merchant Details */}
      {isExpanded && (
        <div className="border-t border-border/30">
          <div className="divide-y divide-border/30">
            {tags.map((merchant, index) => {
              const merchantAmount = tagSpending[merchant] || 0;
              const merchantCount = tagCounts[merchant] || 1;
              const isMatching = searchTerm.trim() && merchant.toLowerCase().includes(searchTerm.toLowerCase());
              
              return (
                <div 
                  key={`${category}-${merchant}`} 
                  className="flex items-center justify-between py-3 px-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`text-xs font-medium truncate ${isMatching ? 'text-primary font-semibold' : 'text-foreground'}`}>
                        {merchant}
                      </span>
                      {merchantCount > 1 && (
                        <span className="text-xs text-muted-foreground">
                          {merchantCount} x
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-medium text-destructive">
                      ₹{merchantAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
