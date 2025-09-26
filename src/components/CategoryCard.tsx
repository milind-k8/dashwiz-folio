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
  tags
}: CategoryCardProps) {

  return (
    <div className="p-3 hover:bg-muted/30 transition-colors border border-border/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-foreground text-sm truncate">
            {category}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {tags.length} merchants
            </span>
            <span className="text-xs text-muted-foreground">
              {percentage}%
            </span>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <div className="font-medium text-destructive text-sm">
            ₹{amount.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
