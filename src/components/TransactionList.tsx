import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  MoreHorizontal,
  PieChart,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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

interface CategoryCardProps {
  category: ExpenseCategory;
  tagSpending: Record<string, number>;
  totalExpenses: number;
}

function CategoryCard({ category, tagSpending, totalExpenses }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAmounts, setShowAmounts] = useState(true);

  const formatAmount = (amount: number) => {
    if (!showAmounts) return '****';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 30) return 'bg-expense';
    if (percentage > 20) return 'bg-warning';
    return 'bg-income';
  };

  return (
    <Card className="p-4 hover-scale hover:shadow-elevated transition-all duration-300 border-l-4" 
          style={{ borderLeftColor: category.color }}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
            <div>
              <h3 className="font-semibold text-foreground">{category.category}</h3>
              <p className="text-xs text-muted-foreground">
                {category.tags.length} {category.tags.length === 1 ? 'tag' : 'tags'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAmounts(!showAmounts)}
              className="h-6 w-6 p-0"
            >
              {showAmounts ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">
                {formatAmount(category.amount)}
              </p>
              <Badge variant="outline" className="text-xs">
                {category.percentage.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Share of total expenses</span>
            <span className="font-medium">{category.percentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={category.percentage} 
            className={`h-2 [&>[data-progress]]:${getProgressColor(category.percentage)}`}
          />
        </div>

        {/* Tags Breakdown */}
        {category.tags.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" />
                  View tag breakdown ({category.tags.length})
                </span>
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                {category.tags.map((tag) => {
                  const tagAmount = tagSpending[tag] || 0;
                  const tagPercentage = category.amount > 0 ? (tagAmount / category.amount) * 100 : 0;
                  
                  return (
                    <div key={tag} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary/60" />
                        <span className="text-muted-foreground">{tag}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {formatAmount(tagAmount)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {tagPercentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </Card>
  );
}

export function TransactionList({ expenseCategories = [] }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'amount' | 'percentage' | 'name'>('amount');
  const [viewMode, setViewMode] = useState<'cards' | 'chart'>('cards');
  const itemsPerPage = 4;

  const totalExpenses = useMemo(() => {
    return expenseCategories.reduce((sum, cat) => sum + cat.amount, 0);
  }, [expenseCategories]);

  // Mock tag spending data
  const getTagSpending = (category: string, tags: string[], totalAmount: number) => {
    const tagSpending: Record<string, number> = {};
    const baseAmount = totalAmount / tags.length;
    
    tags.forEach((tag, index) => {
      const variation = (Math.random() - 0.5) * 0.3;
      tagSpending[tag] = Math.round(baseAmount * (1 + variation));
    });
    
    return tagSpending;
  };

  // Filter and sort categories
  const processedCategories = useMemo(() => {
    let filtered = expenseCategories;
    
    // Filter by search term
    if (searchTerm.trim()) {
      filtered = expenseCategories.filter(category =>
        category.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'percentage':
          return b.percentage - a.percentage;
        case 'name':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [expenseCategories, searchTerm, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = processedCategories.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (expenseCategories.length === 0) {
    return (
      <Card className="p-6 shadow-card">
        <div className="text-center py-8">
          <PieChart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No Spending Data</h3>
          <p className="text-muted-foreground">No expense categories available for the selected period.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Category Spending Analysis
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Total spending across {processedCategories.length} categories • ₹{totalExpenses.toLocaleString('en-IN')}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="amount">Sort by Amount</option>
              <option value="percentage">Sort by Percentage</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Category Cards */}
      {processedCategories.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <Search className="w-8 h-8 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No categories found matching "{searchTerm}"</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {paginatedCategories.map((category) => (
            <CategoryCard
              key={category.category}
              category={category}
              tagSpending={getTagSpending(category.category, category.tags, category.amount)}
              totalExpenses={totalExpenses}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, processedCategories.length)} of {processedCategories.length} categories
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-muted-foreground">...</span>
                    <Button
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(totalPages)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}