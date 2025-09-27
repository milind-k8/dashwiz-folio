import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer } from 'vaul';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFilterStore } from '@/store/filterStore';
import { ChevronRight, List, Grid3X3, X } from 'lucide-react';
import { useGlobalStore } from '@/store/globalStore';
import { TableLoader } from '@/components/ui/loader';
import { TransactionFilters } from '@/components/TransactionFilters';
import { TransactionItem } from '@/components/TransactionItem';
import { CategoryGroup } from '@/components/CategoryGroup';

interface GroupedCategory {
  category: string;
  totalAmount: number;
  merchantCount: number;
  transactionCount: number;
  transactions: any[];
}

export const TransactionsContent = () => {
  const { banks, transactions, loading } = useGlobalStore();
  const { selectedBank, selectedDuration, setSelectedBank, setSelectedDuration } = useFilterStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string>(selectedBank || '');
  const [activeTab, setActiveTab] = useState('group');
  const [selectedCategory, setSelectedCategory] = useState<GroupedCategory | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Set defaults when banks are loaded
  useEffect(() => {
    if (banks.length > 0 && !selectedBankId) {
      const defaultBank = banks[0].id;
      setSelectedBankId(defaultBank);
      setSelectedBank(defaultBank);
    }
    
    if (!selectedDuration) {
      setSelectedDuration('current-month');
    }
  }, [banks, selectedBankId, selectedBank, setSelectedBank, selectedDuration, setSelectedDuration]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!selectedBankId) return [];
    
    return transactions.filter(transaction => {
      if (transaction.transaction_type === 'balance') return false;
      
      const matchesSearch = searchTerm === '' || 
        (transaction.merchant && transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase())) ||
        transaction.amount.toString().includes(searchTerm.toLowerCase()) ||
        (transaction.category && transaction.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesBank = transaction.bank_id === selectedBankId;
      
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
      
      return matchesSearch && matchesBank && matchesMonth;
    });
  }, [transactions, searchTerm, selectedBankId, selectedDuration]);

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
      
      const uniqueMerchants = new Set(groups[category].transactions.map(t => t.merchant));
      groups[category].merchantCount = uniqueMerchants.size;
    });
    
    return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredTransactions]);

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <div className="p-6">
          <TableLoader text="Loading transactions..." />
        </div>
      </div>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <TransactionFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedBankId={selectedBankId}
          setSelectedBankId={(value) => {
            setSelectedBankId(value);
            setSelectedBank(value);
          }}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          banks={banks}
          filterOpen={filterOpen}
          setFilterOpen={setFilterOpen}
        />
        <div className="max-w-2xl mx-auto p-4">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transactions found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TransactionFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedBankId={selectedBankId}
        setSelectedBankId={(value) => {
          setSelectedBankId(value);
          setSelectedBank(value);
        }}
        selectedDuration={selectedDuration}
        setSelectedDuration={setSelectedDuration}
        banks={banks}
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
      />

      <div className="max-w-2xl mx-auto">
        {/* View Toggle */}
        <div className="p-4 border-b border-border/20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9 bg-muted/30">
              <TabsTrigger value="group" className="text-xs h-7">
                <Grid3X3 className="h-3 w-3 mr-1" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="list" className="text-xs h-7">
                <List className="h-3 w-3 mr-1" />
                List
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="group" className="mt-4 space-y-2">
              {groupedByCategory.map((group, index) => (
                <CategoryGroup
                  key={group.category}
                  group={group}
                  onClick={() => setSelectedCategory(group)}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="list" className="mt-4">
              <div className="border border-border/20 rounded-lg overflow-hidden">
                {filteredTransactions.map((transaction, index) => (
                  <div key={transaction.id} className={index !== filteredTransactions.length - 1 ? "border-b border-border/10" : ""}>
                    <TransactionItem transaction={transaction} />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Category Detail Drawer */}
      <Drawer.Root open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[85%] mt-24 fixed bottom-0 left-0 right-0 z-50">
            <div className="p-4 bg-background rounded-t-[10px] flex-1 overflow-auto">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
              <div className="max-w-md mx-auto">
                {selectedCategory && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold">{selectedCategory.category}</h2>
                        <p className="text-sm text-muted-foreground">
                          {selectedCategory.transactionCount} transactions
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-px border border-border/20 rounded-lg overflow-hidden">
                      {selectedCategory.transactions.map((transaction, index) => (
                        <div key={transaction.id} className={index !== selectedCategory.transactions.length - 1 ? "border-b border-border/10" : ""}>
                          <TransactionItem transaction={transaction} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};