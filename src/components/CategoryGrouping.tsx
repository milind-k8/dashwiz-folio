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
  ChevronRight
} from 'lucide-react';
import { useGlobalStore } from '@/store/globalStore';
import { cn } from '@/lib/utils';

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

  // Get category initials and color based on merchant or category
  const getCategoryInitialsAndColor = (merchant: string, category: string) => {
    const merchantLower = merchant?.toLowerCase() || '';
    const categoryLower = category?.toLowerCase() || '';
    
    // Generate initials from category nam
    
    const initials = getInitials(category);
    
    if (merchantLower.includes('coffee') || merchantLower.includes('starbucks') || merchantLower.includes('cafe')) {
      return { initials, bgColor: 'bg-warning-subtle dark:bg-warning-subtle', textColor: 'text-warning dark:text-warning' };
    } else if (merchantLower.includes('uber') || merchantLower.includes('taxi') || categoryLower.includes('transport')) {
      return { initials, bgColor: 'bg-primary-subtle dark:bg-primary-subtle', textColor: 'text-primary dark:text-primary' };
    } else if (merchantLower.includes('restaurant') || merchantLower.includes('food') || categoryLower.includes('food')) {
      return { initials, bgColor: 'bg-muted dark:bg-muted', textColor: 'text-muted-foreground dark:text-muted-foreground' };
    } else if (merchantLower.includes('shop') || merchantLower.includes('store') || categoryLower.includes('shopping')) {
      return { initials, bgColor: 'bg-accent/10 dark:bg-accent/10', textColor: 'text-accent dark:text-accent' };
    } else if (categoryLower.includes('bank') || categoryLower.includes('atm')) {
      return { initials, bgColor: 'bg-success-subtle dark:bg-success-subtle', textColor: 'text-success dark:text-success' };
    } else {
      return { initials, bgColor: 'bg-destructive-subtle dark:bg-destructive-subtle', textColor: 'text-destructive dark:text-destructive' };
    }
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
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            Spending Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-0 divide-y divide-border">
        {groupedByCategory.map((group, index) => {
          const { initials, bgColor, textColor } = getCategoryInitialsAndColor('', group.category);
          
          return (
            <div 
              key={group.category}
              className="flex items-center justify-between py-3 hover:bg-muted/20 transition-colors first:pt-0 last:pb-0 cursor-pointer"
              onClick={() => setSelectedCategory(group)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${bgColor}`}>
                    <span className={textColor}>
                      {initials}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {group.category}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{group.merchantCount} merchant{group.merchantCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className="font-bold text-sm text-foreground">
                    ₹{group.totalAmount.toLocaleString()}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          );
        })}
          </div>
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
              <div className="space-y-2 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
                {groupedMerchants.map((merchant) => {
                  const { initials, bgColor, textColor } = getCategoryInitialsAndColor(merchant.merchant, selectedCategory?.category || '');
                  
                  return (
                    <div key={merchant.merchant} className="p-3 bg-muted/80 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-8 w-8 ${bgColor}`}>
                          <AvatarFallback className={`${bgColor} border-0 flex items-center justify-center`}>
                            <span className={`text-xs font-bold ${textColor}`}>
                              {getInitials(merchant.merchant)}
                            </span>
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground font-google truncate">
                                {merchant.merchant}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {merchant.transactionCount}x transaction{merchant.transactionCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                            
                            <div className="text-right ml-3">
                              <div className="text-sm font-medium font-google text-foreground">
                                ₹{merchant.totalAmount.toLocaleString()}
                              </div>
                            </div>
                          </div>
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