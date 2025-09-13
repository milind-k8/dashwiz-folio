import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryRow } from '@/components/CategoryRow';

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  tags: string[];
}

interface TransactionListProps {
  expenseCategories: ExpenseCategory[];
}

export function TransactionList({ expenseCategories = [] }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Mock tag spending data - in real app this would come from actual transaction data
  const getTagSpending = (category: string, tags: string[], totalAmount: number) => {
    const tagSpending: Record<string, number> = {};
    const baseAmount = totalAmount / tags.length;
    
    tags.forEach((tag, index) => {
      // Add some variation to make it more realistic
      const variation = (Math.random() - 0.5) * 0.3;
      tagSpending[tag] = Math.round(baseAmount * (1 + variation));
    });
    
    return tagSpending;
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

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
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
    <Card className="p-3 sm:p-4 md:p-6 shadow-card">
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
          Category Spending
        </h3>
        <span className="text-xs sm:text-sm text-muted-foreground">
          {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3 sm:mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search categories or tags..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 h-8 sm:h-9"
        />
      </div>

      {/* Categories Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px] sm:w-[40%] text-xs sm:text-sm">Category</TableHead>
              <TableHead className="min-w-[100px] sm:w-[35%] text-xs sm:text-sm hidden sm:table-cell">Tags</TableHead>
              <TableHead className="min-w-[60px] sm:w-[15%] text-center text-xs sm:text-sm">Share</TableHead>
              <TableHead className="min-w-[80px] sm:w-[10%] text-right text-xs sm:text-sm">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCategories.length === 0 ? (
              <TableRow>
                <td colSpan={4} className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    No categories found matching "{searchTerm}"
                  </p>
                </td>
              </TableRow>
            ) : (
              paginatedCategories.map((category) => (
                <CategoryRow
                  key={category.category}
                  category={category.category}
                  amount={category.amount}
                  percentage={category.percentage}
                  color={category.color}
                  tags={category.tags}
                  tagSpending={getTagSpending(category.category, category.tags, category.amount)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCategories.length)} of {filteredCategories.length}
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-medium px-2">
              {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}