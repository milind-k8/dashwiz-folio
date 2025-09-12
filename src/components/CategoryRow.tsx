import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CategoryRowProps {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  tags: string[];
  tagSpending: Record<string, number>;
}

export function CategoryRow({
  category,
  amount,
  percentage,
  color,
  tags,
  tagSpending
}: CategoryRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;

  return (
    <>
      {/* Main Category Row */}
      <div
        className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground truncate">
                {category}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {percentage}% of expenses
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-destructive">
                {formatCurrency(amount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Tag Rows */}
      {isExpanded && (
        <div className="ml-6 mt-2 space-y-2">
          {tags.map((tag) => {
            const tagAmount = tagSpending[tag] || 0;
            const tagPercentage = amount > 0 ? Math.round((tagAmount / amount) * 100) : 0;
            
            return (
              <div
                key={tag}
                className="flex items-center justify-between p-2 rounded-md bg-muted/30 border-l-2"
                style={{ borderLeftColor: color }}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {tag}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tagPercentage}% of {category.toLowerCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-destructive">
                    {formatCurrency(tagAmount)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}