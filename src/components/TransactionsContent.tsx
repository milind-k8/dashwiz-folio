import { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Drawer } from 'vaul';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFilterStore } from '@/store/filterStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  ArrowUpRight,
  ArrowDownLeft,
  Store,
  Coffee,
  ShoppingBag,
  Car,
  Utensils,
  CreditCard,
  Wallet,
  Building2,
  Tag,
  X,
  ChevronRight,
  List,
  Grid3X3,
  Calendar,
  SlidersHorizontal
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { useGlobalStore } from '@/store/globalStore';
import { TableLoader } from '@/components/ui/loader';

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

export const TransactionsContent = () => {
  const { banks, transactions, loading } = useGlobalStore();
  const { selectedBank, selectedDuration, setSelectedBank, setSelectedDuration } = useFilterStore();
  
  // Get current month as default
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string>(selectedBank || '');
  const [activeTab, setActiveTab] = useState('group');
  const [selectedCategory, setSelectedCategory] = useState<GroupedCategory | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Reset modal search when category changes
  useEffect(() => {
    if (selectedCategory) {
      setModalSearchTerm('');
    }
  }, [selectedCategory]);

  // Set defaults when banks are loaded and components mount
  useEffect(() => {
    if (banks.length > 0) {
      // Validate that the selected bank from store is still valid
      const validBankIds = banks.map(bank => bank.id);
      const currentSelectedBank = selectedBank || selectedBankId;
      
      if (!currentSelectedBank || !validBankIds.includes(currentSelectedBank)) {
        // If no valid bank is selected, use the first bank
        const defaultBank = banks[0].id;
        setSelectedBankId(defaultBank);
        setSelectedBank(defaultBank);
      } else if (!selectedBankId) {
        // If store has valid bank but local state doesn't, sync it
        setSelectedBankId(currentSelectedBank);
      }
    }
    
    // Set current month as default if no duration is selected
    if (!selectedDuration) {
      setSelectedDuration(getCurrentMonth());
    }
  }, [banks, selectedBankId, selectedBank, setSelectedBank, selectedDuration, setSelectedDuration]);

  
  // Get current date and generate last 3 month options
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  };

  // Get bank name by ID
  const getBankName = (bankId: string) => {
    const bank = banks.find(b => b.id === bankId);
    return bank ? bank.bank_name : 'Unknown Bank';
  };

  // Get category icon and color based on merchant or category
  const getCategoryIconAndColor = (merchant: string, category: string) => {
    const merchantLower = merchant?.toLowerCase() || '';
    const categoryLower = category?.toLowerCase() || '';
    
    if (merchantLower.includes('coffee') || merchantLower.includes('starbucks') || merchantLower.includes('cafe')) {
      return { icon: Coffee, bgColor: 'bg-amber-50', iconColor: 'text-amber-600' };
    } else if (merchantLower.includes('uber') || merchantLower.includes('taxi') || categoryLower.includes('transport')) {
      return { icon: Car, bgColor: 'bg-blue-50', iconColor: 'text-blue-600' };
    } else if (merchantLower.includes('restaurant') || merchantLower.includes('food') || categoryLower.includes('food')) {
      return { icon: Utensils, bgColor: 'bg-orange-50', iconColor: 'text-orange-600' };
    } else if (merchantLower.includes('shop') || merchantLower.includes('store') || categoryLower.includes('shopping')) {
      return { icon: ShoppingBag, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' };
    } else if (categoryLower.includes('bank') || categoryLower.includes('atm')) {
      return { icon: CreditCard, bgColor: 'bg-green-50', iconColor: 'text-green-600' };
    } else {
      return { icon: Store, bgColor: 'bg-rose-50', iconColor: 'text-rose-600' };
    }
  };

  // Filter transactions based on search term, selected bank, and month
  const filteredTransactions = useMemo(() => {
    if (!selectedBankId) {
      return [];
    }
    
    return transactions.filter(transaction => {
      // Exclude balance transactions
      if (transaction.transaction_type === 'balance') {
        return false;
      }
      
      const matchesSearch = searchTerm === '' || 
        (transaction.merchant && transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase())) ||
        transaction.amount.toString().includes(searchTerm.toLowerCase()) ||
        transaction.transaction_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.category && transaction.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesBank = transaction.bank_id === selectedBankId;
      
      // Month filter - always filter by selected month since no "all-time" option
      let matchesMonth = true;
      if (selectedDuration) {
        const transactionDate = new Date(transaction.mail_time);
        const [year, month] = selectedDuration.split('-');
        const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
        matchesMonth = transactionMonth === selectedDuration;
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

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in max-w-md mx-auto">
        <div className="space-y-2">
          <h1 className="text-xl font-medium text-foreground font-google">
            Transactions
          </h1>
        </div>
        <Card className="p-6 shadow-sm border border-border/50">
          <TableLoader text="Loading transactions..." />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Google Pay style */}
      <div className="bg-card border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto p-4 space-y-3">
          {/* Search Bar with Filter Icon */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions, merchants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-12 h-12 bg-muted/30 border border-border/50 rounded-full text-base font-normal placeholder:text-muted-foreground/70"
            />
            
            {/* Filter Popover */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
                >
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 bg-background border border-border shadow-lg" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Filters</h4>
                  
                  {/* Bank Filter */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Bank</label>
                    <Select value={selectedBankId} onValueChange={(value) => {
                      setSelectedBankId(value);
                      setSelectedBank(value);
                    }}>
                      <SelectTrigger className="h-10 bg-muted/30 border border-border/50 rounded-md">
                        <SelectValue placeholder="Select Bank" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg z-[100]">
                        {banks.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id} className="text-xs py-1.5">
                            {bank.bank_name.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Month Filter */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Month</label>
                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                      <SelectTrigger className="h-10 bg-muted/30 border border-border/50 rounded-md">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Select Month" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg z-[100]">
                        {getMonthOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs py-1.5">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Tabs for List/Group view */}
          <div className="flex justify-center">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/30 h-8">
                <TabsTrigger value="group" className="text-xs font-medium">
                  <Grid3X3 className="h-3 w-3 mr-1" />
                  Group
                </TabsTrigger>
                <TabsTrigger value="list" className="text-xs font-medium">
                  <List className="h-3 w-3 mr-1" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content Area with Tabs */}
      <div className="max-w-2xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="group" className="mt-0">
            {/* Grouped View - Categories with Enhanced Cards */}
            {groupedByCategory.length === 0 ? (
              <div className="p-8 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-google">
                  {searchTerm ? 'No transactions match your search' : 'No transactions found'}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {groupedByCategory.map((group) => {
                  const { icon: CategoryIcon, bgColor, iconColor } = getCategoryIconAndColor('', group.category);
                  
                  return (
                    <Card 
                      key={group.category} 
                      className="p-4 hover:shadow-md transition-all cursor-pointer border border-border/50"
                      onClick={() => setSelectedCategory(group)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Category Icon */}
                        <div className={`p-3 rounded-xl ${bgColor}`}>
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
            )}
          </TabsContent>
          
          <TabsContent value="list" className="mt-0">
            {/* Normal List View */}
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-google">
                  {searchTerm ? 'No transactions match your search' : 'No transactions found'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredTransactions.map((transaction) => {
                  const { icon: CategoryIcon, bgColor, iconColor } = getCategoryIconAndColor(transaction.merchant, transaction.category);
                  const isCredit = transaction.transaction_type === 'credit';
                  
                  return (
                    <div key={transaction.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Icon Avatar with category colors */}
                        <Avatar className={`h-10 w-10 ${bgColor}`}>
                          <AvatarFallback className={`${bgColor} border-0`}>
                            <CategoryIcon className={`h-5 w-5 ${iconColor}`} />
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Transaction Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground font-google truncate">
                                {transaction.merchant || 'Unknown Merchant'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(transaction.mail_time).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric'
                                  })}
                                </p>
                                <span className="text-xs text-muted-foreground">•</span>
                                <div className="flex items-center gap-1">
                                  <Tag className="h-3 w-3 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground truncate">
                                    {transaction.category || 'Other'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Amount */}
                            <div className="text-right ml-3">
                              <div className={`text-sm font-medium font-google ${
                                isCredit 
                                  ? 'text-success' 
                                  : 'text-foreground'
                              }`}>
                                {isCredit ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                              </div>
                              <div className="flex items-center justify-end mt-1">
                                {isCredit ? (
                                  <ArrowUpRight className="h-3 w-3 text-success" />
                                ) : (
                                  <ArrowDownLeft className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Summary Footer */}
        {(activeTab === 'group' ? groupedByCategory.length > 0 : filteredTransactions.length > 0) && (
          <div className="p-4 text-center border-t border-border/50 bg-muted/20">
            <p className="text-xs text-muted-foreground font-google">
              {activeTab === 'group'
                ? `${groupedByCategory.length} categor${groupedByCategory.length !== 1 ? 'ies' : 'y'} • ${getBankName(selectedBankId)}`
                : `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} • ${getBankName(selectedBankId)}`
              }
            </p>
          </div>
        )}
      </div>

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
          <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[80vh] mt-24 fixed bottom-0 left-0 right-0 z-50">
            {/* Drag Handle */}
            <div className="p-4 bg-background rounded-t-[10px] flex-shrink-0">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/40" />
            </div>
            
            <div className="px-6 flex flex-col flex-1 overflow-hidden">
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
                    <div key={merchant.merchant} className="p-3 bg-muted/20 rounded-lg">
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
    </div>
  );
};