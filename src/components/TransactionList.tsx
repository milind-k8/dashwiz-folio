import { useState, useMemo } from 'react';
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

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">
        Category Spending
      </h3>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search categories or merchants..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">
              {searchTerm ? `No categories found matching "${searchTerm}"` : "No expense data available"}
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => {
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
                shouldExpand={false}
                searchTerm={searchTerm}
                transactionCount={category.transactionCount || 0}
              />
            );
          })
        )}
      </div>
    </div>
  );
}