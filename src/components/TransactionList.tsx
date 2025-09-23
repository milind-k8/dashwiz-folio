import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { CategoryCard } from './CategoryCard';

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  tags: string[];
  transactions?: any[];
  transactionCount?: number;
  merchants?: Array<{
    name: string;
    count: number;
    totalAmount: number;
  }>;
}

interface TransactionListProps {
  expenseCategories: ExpenseCategory[];
}

export function TransactionList({ expenseCategories = [] }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate merchant spending - use merchants directly as they are
  const getMerchantSpendingAndCounts = (merchants: Array<{name: string; count: number; totalAmount: number}> = []) => {
    const merchantSpending: Record<string, number> = {};
    const merchantCounts: Record<string, number> = {};
    
    // Use merchant data directly without any transformation
    merchants.forEach(merchant => {
      merchantSpending[merchant.name] = merchant.totalAmount;
      merchantCounts[merchant.name] = merchant.count;
    });
    
    return { merchantSpending, merchantCounts };
  };

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return expenseCategories;
    
    return expenseCategories.filter(category =>
      category.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      category.merchants?.some(merchant => 
        merchant.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [expenseCategories, searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  if (expenseCategories.length === 0) {
    return (
      <Card className="p-4 sm:p-6 shadow-card">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            Category Spending
          </h3>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No expense data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-1">
        <h3 className="text-sm font-medium text-foreground">
          Category Spending
        </h3>
        <span className="text-xs text-muted-foreground">
          {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search categories, merchants, or tags..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Categories Cards */}
      <div className="space-y-2">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              No categories found matching "{searchTerm}"
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => {
            // Check if search term matches any merchant in this category
            const shouldExpand = searchTerm.trim() && (
              category.tags.some(tag => 
                tag.toLowerCase().includes(searchTerm.toLowerCase())
              ) || 
              category.merchants?.some(merchant => 
                merchant.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
            );
            
            const { merchantSpending, merchantCounts } = getMerchantSpendingAndCounts(category.merchants || []);
            
            return (
              <CategoryCard
                key={category.category}
                category={category.category}
                amount={category.amount}
                percentage={category.percentage}
                tags={category.tags}
                tagSpending={merchantSpending}
                tagCounts={merchantCounts}
                shouldExpand={shouldExpand}
                searchTerm={searchTerm}
                transactionCount={category.transactionCount || 0}
              />
            );
          })
        )}
      </div>

    </Card>
  );
}