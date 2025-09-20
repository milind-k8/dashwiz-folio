import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { CategoryCard } from './CategoryCard';

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  tags: string[];
  transactions?: any[];
}

interface TransactionListProps {
  expenseCategories: ExpenseCategory[];
}

export function TransactionList({ expenseCategories = [] }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate tag spending and counts from actual transaction data
  const getTagSpendingAndCounts = (category: string, tags: string[], totalAmount: number, transactions: any[] = []) => {
    const tagSpending: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    
    if (transactions.length === 0) {
      // Fallback: distribute evenly if no transaction data
      if (tags.length === 1) {
        tagSpending[tags[0]] = totalAmount;
        tagCounts[tags[0]] = 1;
      } else {
        const baseAmount = totalAmount / tags.length;
        let remainingAmount = totalAmount;
        
        tags.forEach((tag, index) => {
          if (index === tags.length - 1) {
            tagSpending[tag] = remainingAmount;
          } else {
            const amount = Math.round(baseAmount);
            tagSpending[tag] = amount;
            remainingAmount -= amount;
          }
          tagCounts[tag] = 1;
        });
      }
    } else {
      // Calculate from actual transaction data
      transactions.forEach(transaction => {
        if (transaction.tags) {
          const transactionTags = transaction.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
          const amountPerTag = transaction.amount / transactionTags.length;
          
          transactionTags.forEach((tag: string) => {
            const formattedTag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
            if (tags.includes(formattedTag)) {
              tagSpending[formattedTag] = (tagSpending[formattedTag] || 0) + amountPerTag;
              tagCounts[formattedTag] = (tagCounts[formattedTag] || 0) + 1;
            }
          });
        }
      });
      
      // If no tags were found in transactions, fall back to even distribution
      if (Object.keys(tagSpending).length === 0) {
        if (tags.length === 1) {
          tagSpending[tags[0]] = totalAmount;
          tagCounts[tags[0]] = 1;
        } else {
          const baseAmount = totalAmount / tags.length;
          tags.forEach(tag => {
            tagSpending[tag] = baseAmount;
            tagCounts[tag] = 1;
          });
        }
      }
    }
    
    return { tagSpending, tagCounts };
  };

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return expenseCategories;
    
    return expenseCategories.filter(category =>
      category.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
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
          placeholder="Search categories or tags..."
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
            // Check if search term matches any tag in this category
            const shouldExpand = searchTerm.trim() && category.tags.some(tag => 
              tag.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            const { tagSpending, tagCounts } = getTagSpendingAndCounts(category.category, category.tags, category.amount, category.transactions);
            
            return (
              <CategoryCard
                key={category.category}
                category={category.category}
                amount={category.amount}
                percentage={category.percentage}
                tags={category.tags}
                tagSpending={tagSpending}
                tagCounts={tagCounts}
                shouldExpand={shouldExpand}
                searchTerm={searchTerm}
              />
            );
          })
        )}
      </div>

    </Card>
  );
}