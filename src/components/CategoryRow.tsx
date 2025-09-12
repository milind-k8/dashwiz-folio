import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell className="py-2 sm:py-3">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            )}
            <div
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="font-medium text-foreground text-xs sm:text-sm truncate">{category}</span>
          </div>
        </TableCell>
        
        <TableCell className="py-2 sm:py-3 hidden sm:table-cell">
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2} more
              </Badge>
            )}
          </div>
        </TableCell>
        
        <TableCell className="text-center py-2 sm:py-3">
          <Badge variant="outline" className="text-xs">
            {percentage}%
          </Badge>
        </TableCell>
        
        <TableCell className="text-right py-2 sm:py-3">
          <span className="font-semibold text-destructive text-xs sm:text-sm">
            {formatCurrency(amount)}
          </span>
        </TableCell>
      </TableRow>

      {/* Expanded Tag Rows */}
      {isExpanded && tags.map((tag) => {
        const tagAmount = tagSpending[tag] || 0;
        const tagPercentage = amount > 0 ? Math.round((tagAmount / amount) * 100) : 0;
        
        return (
          <TableRow key={`${category}-${tag}`} className="bg-muted/20">
            <TableCell className="py-2">
              <div className="flex items-center gap-2 ml-4 sm:ml-6">
                <div
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  {tag}
                </span>
              </div>
            </TableCell>
            
            <TableCell className="py-2 hidden sm:table-cell">
              <span className="text-xs text-muted-foreground">
                Sub-category of {category}
              </span>
            </TableCell>
            
            <TableCell className="text-center py-2">
              <Badge variant="secondary" className="text-xs">
                {tagPercentage}%
              </Badge>
            </TableCell>
            
            <TableCell className="text-right py-2">
              <span className="text-xs sm:text-sm font-medium text-destructive">
                {formatCurrency(tagAmount)}
              </span>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}