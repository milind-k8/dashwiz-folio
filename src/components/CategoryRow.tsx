import { useState } from 'react';
import { ChevronDown, ChevronRight, Dot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';

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
      <TableRow 
        className="cursor-pointer hover:bg-muted/50 transition-colors group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell className="py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform" />
              )}
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <div>
              <span className="font-medium text-foreground">{category}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {tags.length} tags
                </span>
              </div>
            </div>
          </div>
        </TableCell>
        
        <TableCell className="text-center py-3">
          <Badge variant="secondary" className="text-xs font-medium">
            {percentage}%
          </Badge>
        </TableCell>
        
        <TableCell className="text-right py-3">
          <span className="font-semibold text-destructive">
            {formatCurrency(amount)}
          </span>
        </TableCell>
      </TableRow>

      {/* Expanded Tag Rows */}
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={3} className="p-0">
            <div className="bg-muted/20 animate-accordion-down">
              <div className="px-4 py-3 space-y-2">
                {tags.map((tag) => {
                  const tagAmount = tagSpending[tag] || 0;
                  const tagPercentage = amount > 0 ? Math.round((tagAmount / amount) * 100) : 0;
                  
                  return (
                    <div
                      key={tag}
                      className="flex items-center justify-between py-1.5 px-3 rounded-md bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Dot className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {tag}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {tagPercentage}%
                        </Badge>
                      </div>
                      <span className="text-sm font-medium text-destructive">
                        {formatCurrency(tagAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}