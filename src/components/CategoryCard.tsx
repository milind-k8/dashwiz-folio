import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Tag, TrendingDown, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CategoryCardProps {
  category: string;
  amount: number;
  percentage: number;
  tags: string[];
  tagSpending: Record<string, number>;
  tagCounts?: Record<string, number>;
  shouldExpand?: boolean;
  searchTerm?: string;
}

export function CategoryCard({
  category,
  amount,
  percentage,
  tags,
  tagSpending,
  tagCounts = {},
  shouldExpand = false,
  searchTerm = ''
}: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(shouldExpand);

  // Update expansion state when shouldExpand prop changes
  useEffect(() => {
    setIsExpanded(shouldExpand);
  }, [shouldExpand]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;

  return (
    <Card className="p-0 hover:shadow-lg transition-all duration-300 border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
      {/* Main Category Info */}
      <div 
        className="cursor-pointer p-3 rounded-lg hover:bg-muted/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 h-8 w-8 hover:bg-transparent focus:bg-transparent active:bg-transparent rounded-full flex-shrink-0"
          >
            <ChevronRightIcon className={`w-3.5 h-3.5 transition-transform duration-200 text-muted-foreground ${isExpanded ? 'rotate-90' : 'rotate-0'}`} />
          </Button>
          
          <div className="flex items-start justify-between gap-4 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="mb-1.5">
                <h4 className="font-medium text-foreground text-sm leading-tight mb-1">
                  {category}
                </h4>
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex items-center gap-1 w-fit">
                  <Tag className="w-2.5 h-2.5" />
                  {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                  <div className="font-medium text-destructive text-sm">
                    {formatCurrency(amount)}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Tag Details */}
      {isExpanded && (
        <div className="border-t border-border/30 pt-3 px-3 pb-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <h5 className="text-xs font-medium text-muted-foreground">
              Tag Breakdown ({tags.length} {tags.length === 1 ? 'tag' : 'tags'})
            </h5>
          </div>
          {tags.map((tag) => {
            const tagAmount = tagSpending[tag] || 0;
            const tagCount = tagCounts[tag] || 1;
            const tagPercentage = amount > 0 ? Math.round((tagAmount / amount) * 100) : 0;
            const isMatching = searchTerm.trim() && tag.toLowerCase().includes(searchTerm.toLowerCase());
            
            return (
              <div 
                key={`${category}-${tag}`} 
                className={`flex items-center justify-between py-2 px-3 rounded-lg border transition-all duration-200 ${
                  isMatching 
                    ? 'bg-gradient-to-r from-destructive/20 to-destructive/10 border-destructive/30 hover:from-destructive/30 hover:to-destructive/20' 
                    : 'bg-gradient-to-r from-muted/30 to-muted/20 border-border/20 hover:from-muted/40 hover:to-muted/30'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isMatching ? 'bg-destructive' : 'bg-destructive/60'}`}></div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className={`text-xs font-medium truncate ${isMatching ? 'text-destructive font-semibold' : 'text-foreground'}`}>
                      {tag}
                    </span>
                    {tagCount > 1 && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {tagCount}x
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className={`text-xs px-1.5 py-0.5 ${isMatching ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                    {tagPercentage}%
                  </Badge>
                  <span className="text-xs font-medium text-destructive">
                    {formatCurrency(tagAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
