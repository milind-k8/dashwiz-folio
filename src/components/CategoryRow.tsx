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
        <TableCell>
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
            <span className="font-medium text-foreground">{category}</span>
          </div>
        </TableCell>
        
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3} more
              </Badge>
            )}
          </div>
        </TableCell>
        
        <TableCell className="text-center">
          <Badge variant="outline" className="text-xs">
            {percentage}%
          </Badge>
        </TableCell>
        
        <TableCell className="text-right">
          <span className="font-semibold text-destructive">
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
            <TableCell>
              <div className="flex items-center gap-2 ml-6">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium text-foreground">
                  {tag}
                </span>
              </div>
            </TableCell>
            
            <TableCell>
              <span className="text-xs text-muted-foreground">
                Sub-category of {category}
              </span>
            </TableCell>
            
            <TableCell className="text-center">
              <Badge variant="secondary" className="text-xs">
                {tagPercentage}%
              </Badge>
            </TableCell>
            
            <TableCell className="text-right">
              <span className="text-sm font-medium text-destructive">
                {formatCurrency(tagAmount)}
              </span>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}