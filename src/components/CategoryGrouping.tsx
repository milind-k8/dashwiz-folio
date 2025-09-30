import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Drawer } from 'vaul';
import { useFilterStore } from '@/store/filterStore';
import { 
  Search, 
  Wallet,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useGlobalStore } from '@/store/globalStore';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GroupedCategory {
  category: string;
  totalAmount: number;
  merchantCount: number;
  transactionCount: number;
  transactions: any[];
}

interface GroupedMerchant {
  merchant: string;
  totalAmount: number;
  transactionCount: number;
  transactions: any[];
}

export const CategoryGrouping = () => {
  const { transactions } = useGlobalStore();
  const { selectedBank, selectedDuration } = useFilterStore();
  
  const [selectedCategory, setSelectedCategory] = useState<GroupedCategory | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  // Reset modal search when category changes
  useEffect(() => {
    if (selectedCategory) {
      setModalSearchTerm('');
    }
  }, [selectedCategory]);

  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // Get category color based on category
  const getCategoryColor = (category: string, index: number) => {
    const categoryLower = category?.toLowerCase() || '';
    
    // Color palette similar to Google Storage
    const colors = [
      { bg: 'bg-[hsl(var(--success))]', dot: 'bg-[hsl(var(--success))]' },
      { bg: 'bg-[hsl(var(--warning))]', dot: 'bg-[hsl(var(--warning))]' },
      { bg: 'bg-[hsl(var(--destructive))]', dot: 'bg-[hsl(var(--destructive))]' },
      { bg: 'bg-[hsl(var(--primary))]', dot: 'bg-[hsl(var(--primary))]' },
      { bg: 'bg-[hsl(var(--accent))]', dot: 'bg-[hsl(var(--accent))]' },
    ];
    
    return colors[index % colors.length];
  };

  // Filter transactions based on selected bank and duration - only debit transactions
  const filteredTransactions = useMemo(() => {
    if (!selectedBank) {
      return [];
    }
    
    return transactions.filter(transaction => {
      // Only include debit transactions, exclude balance and credit transactions
      if (transaction.transaction_type !== 'debit') {
        return false;
      }
      
      const matchesBank = transaction.bank_id === selectedBank;
      
      // Month filter - convert duration to actual date range
      let matchesMonth = true;
      if (selectedDuration) {
        const transactionDate = new Date(transaction.mail_time);
        const now = new Date();
        let targetYear: number, targetMonth: number;
        
        switch (selectedDuration) {
          case 'current-month':
            targetYear = now.getFullYear();
            targetMonth = now.getMonth() + 1;
            break;
          case 'previous-month':
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            targetYear = prevMonth.getFullYear();
            targetMonth = prevMonth.getMonth() + 1;
            break;
          case 'month-before-previous':
            const monthBefore = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            targetYear = monthBefore.getFullYear();
            targetMonth = monthBefore.getMonth() + 1;
            break;
          default:
            targetYear = now.getFullYear();
            targetMonth = now.getMonth() + 1;
        }
        
        const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
        const targetMonthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
        matchesMonth = transactionMonth === targetMonthStr;
      }
      
      return matchesBank && matchesMonth;
    });
  }, [transactions, selectedBank, selectedDuration]);

  // Group transactions by category
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, GroupedCategory> = {};
    
    filteredTransactions.forEach(transaction => {
      const category = transaction.category || 'Other';
      
      if (!groups[category]) {
        groups[category] = {
          category,
          totalAmount: 0,
          merchantCount: 0,
          transactionCount: 0,
          transactions: []
        };
      }
      
      groups[category].totalAmount += transaction.amount;
      groups[category].transactionCount += 1;
      groups[category].transactions.push(transaction);
      
      // Count unique merchants
      const uniqueMerchants = new Set(groups[category].transactions.map(t => t.merchant));
      groups[category].merchantCount = uniqueMerchants.size;
    });
    
    return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredTransactions]);

  // Calculate total spending
  const totalSpending = useMemo(() => {
    return groupedByCategory.reduce((sum, group) => sum + group.totalAmount, 0);
  }, [groupedByCategory]);

  // Group merchants in selected category
  const groupedMerchants = useMemo(() => {
    if (!selectedCategory) return [];
    
    const groups: Record<string, GroupedMerchant> = {};
    const categoryTransactions = selectedCategory.transactions.filter(transaction => {
      if (!modalSearchTerm) return true;
      return transaction.merchant?.toLowerCase().includes(modalSearchTerm.toLowerCase());
    });
    
    categoryTransactions.forEach(transaction => {
      const merchant = transaction.merchant || 'Unknown Merchant';
      
      if (!groups[merchant]) {
        groups[merchant] = {
          merchant,
          totalAmount: 0,
          transactionCount: 0,
          transactions: []
        };
      }
      
      groups[merchant].totalAmount += transaction.amount;
      groups[merchant].transactionCount += 1;
      groups[merchant].transactions.push(transaction);
    });
    
    return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [selectedCategory, modalSearchTerm]);

  if (groupedByCategory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Spending Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No spending categories found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6 pb-6">
          {/* Summary Section */}
          <div className="text-center mb-6">
            <h2 className="text-4xl font-normal mb-2 text-foreground">
              ₹{totalSpending.toLocaleString()}
            </h2>
            <p className="text-muted-foreground text-sm">
              Total spending across {groupedByCategory.length} categories
            </p>
          </div>

          {/* Visual Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Category breakdown</span>
              <span className="font-medium text-foreground">₹{totalSpending.toLocaleString()}</span>
            </div>
            <div className="h-3 rounded-full bg-muted/30 overflow-hidden flex">
              {groupedByCategory.slice(0, 5).map((group, index) => {
                const percentage = (group.totalAmount / totalSpending) * 100;
                const color = getCategoryColor(group.category, index);
                return (
                  <div
                    key={group.category}
                    className={`${color.bg} transition-all`}
                    style={{ width: `${percentage}%` }}
                    title={`${group.category}: ₹${group.totalAmount.toLocaleString()}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Collapsible Category Details */}
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger className="flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span>Category details</span>
              {isDetailsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              <div className="space-y-3">
                {groupedByCategory.map((group, index) => {
                  const color = getCategoryColor(group.category, index);
                  
                  return (
                    <div 
                      key={group.category}
                      className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/20 rounded-lg px-2 -mx-2 transition-colors"
                      onClick={() => setSelectedCategory(group)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-3 h-3 rounded-full ${color.dot} flex-shrink-0`} />
                        <span className="text-sm text-foreground truncate">{group.category}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium text-foreground">
                          ₹{group.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Bottom Modal for Category Details - Draggable with Vaul */}
      <Drawer.Root 
        open={!!selectedCategory} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCategory(null);
            setModalSearchTerm('');
          }
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="bg-card flex flex-col rounded-t-[10px] h-[80vh] mt-24 fixed bottom-0 left-0 right-0 z-50">
            {/* Drag Handle */}
            <div className="p-4 bg-card rounded-t-[10px] flex-shrink-0">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/40" />
            </div>
            
            <div className="px-4 flex flex-col flex-1 overflow-hidden">
              {/* Header */}
              <div className="pb-4">
                <Drawer.Title className="text-lg font-semibold text-foreground font-google">
                  {selectedCategory?.category}
                </Drawer.Title>
                <Drawer.Description className="text-sm text-muted-foreground">
                  {selectedCategory?.transactionCount} transactions • ₹{selectedCategory?.totalAmount.toLocaleString()}
                </Drawer.Description>
              </div>
              
              {/* Search in Modal */}
              <div className="relative mb-4 flex-shrink-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search merchants"
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="pl-10 h-9 bg-muted/30 border border-border/50 rounded-full text-base font-google"
                />
              </div>
              
              {/* Grouped Merchants - Scrollable */}
              <div className="space-y-3 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
                {groupedMerchants.map((merchant) => {
                  return (
                    <div key={merchant.merchant} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground truncate">
                            {merchant.merchant}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {merchant.transactionCount}x transaction{merchant.transactionCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="text-sm font-medium text-foreground">
                          ₹{merchant.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
};