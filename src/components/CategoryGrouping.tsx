import { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Drawer } from 'vaul';
import { useFilterStore } from '@/store/filterStore';
import { 
  Search, 
  Store,
  Coffee,
  ShoppingBag,
  Car,
  Utensils,
  CreditCard,
  Wallet,
  ChevronRight
} from 'lucide-react';
import { useGlobalStore } from '@/store/globalStore';

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

  // Get category icon and color based on merchant or category
  const getCategoryIconAndColor = (merchant: string, category: string) => {
    const merchantLower = merchant?.toLowerCase() || '';
    const categoryLower = category?.toLowerCase() || '';
    
    if (merchantLower.includes('coffee') || merchantLower.includes('starbucks') || merchantLower.includes('cafe')) {
      return { icon: Coffee, bgColor: 'bg-warning-subtle dark:bg-warning-subtle', iconColor: 'text-warning dark:text-warning' };
    } else if (merchantLower.includes('uber') || merchantLower.includes('taxi') || categoryLower.includes('transport')) {
      return { icon: Car, bgColor: 'bg-primary-subtle dark:bg-primary-subtle', iconColor: 'text-primary dark:text-primary' };
    } else if (merchantLower.includes('restaurant') || merchantLower.includes('food') || categoryLower.includes('food')) {
      return { icon: Utensils, bgColor: 'bg-muted dark:bg-muted', iconColor: 'text-muted-foreground dark:text-muted-foreground' };
    } else if (merchantLower.includes('shop') || merchantLower.includes('store') || categoryLower.includes('shopping')) {
      return { icon: ShoppingBag, bgColor: 'bg-accent/10 dark:bg-accent/10', iconColor: 'text-accent dark:text-accent' };
    } else if (categoryLower.includes('bank') || categoryLower.includes('atm')) {
      return { icon: CreditCard, bgColor: 'bg-success-subtle dark:bg-success-subtle', iconColor: 'text-success dark:text-success' };
    } else {
      return { icon: Store, bgColor: 'bg-destructive-subtle dark:bg-destructive-subtle', iconColor: 'text-destructive dark:text-destructive' };
    }
  };

  // Filter transactions based on selected bank and duration
  const filteredTransactions = useMemo(() => {
    if (!selectedBank) {
      return [];
    }
    
    return transactions.filter(transaction => {
      // Exclude balance transactions
      if (transaction.transaction_type === 'balance') {
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
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground font-google">Spending Categories</h2>
          <p className="text-sm text-muted-foreground">View your expenses grouped by category</p>
        </div>
        <div className="text-center py-4">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-google">
            No spending categories found
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground font-google">Spending Categories</h2>
          <p className="text-sm text-muted-foreground">View your expenses grouped by category</p>
        </div>
        <div className="space-y-3">
        {groupedByCategory.map((group) => {
          const { icon: CategoryIcon, bgColor, iconColor } = getCategoryIconAndColor('', group.category);
          
          return (
            <Card 
              key={group.category} 
              className="p-4 hover:shadow-md transition-all cursor-pointer border border-border/50 rounded-2xl"
              onClick={() => setSelectedCategory(group)}
            >
              <div className="flex items-center gap-4">
                {/* Category Icon */}
                <div className={`p-3 rounded-2xl ${bgColor}`}>
                  <CategoryIcon className={`h-6 w-6 ${iconColor}`} />
                </div>
                
                {/* Category Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-foreground font-google truncate">
                        {group.category}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {group.merchantCount} merchant{group.merchantCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      <div className="text-right">
                        <div className="text-lg font-bold font-google text-foreground">
                          ₹{group.totalAmount.toLocaleString()}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        </div>
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
                  const { icon: CategoryIcon, bgColor, iconColor } = getCategoryIconAndColor(merchant.merchant, selectedCategory?.category || '');
                  
                  return (
                    <div key={merchant.merchant} className="p-3 bg-muted/80 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-8 w-8 ${bgColor}`}>
                          <AvatarFallback className={`${bgColor} border-0`}>
                            <CategoryIcon className={`h-4 w-4 ${iconColor}`} />
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