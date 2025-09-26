import { useState, useMemo } from 'react';
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

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">
        Category Spending
      </h3>

      <div className="space-y-2">
        {expenseCategories.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">No expense data available</p>
          </div>
        ) : (
          expenseCategories.map((category) => {
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
                searchTerm=""
                transactionCount={category.transactionCount || 0}
              />
            );
          })
        )}
      </div>
    </div>
  );
}