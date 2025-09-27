import { Card } from '@/components/ui/card';

interface GroupedCategory {
  category: string;
  totalAmount: number;
  merchantCount: number;
  transactionCount: number;
  transactions: any[];
}

interface CategoryGroupProps {
  group: GroupedCategory;
  onClick: () => void;
}

export const CategoryGroup = ({ group, onClick }: CategoryGroupProps) => {
  return (
    <Card 
      className="p-4 cursor-pointer hover:bg-muted/30 transition-colors border border-border/30"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {group.category}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {group.transactionCount} transactions • {group.merchantCount} merchants
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">
            ₹{group.totalAmount.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
};