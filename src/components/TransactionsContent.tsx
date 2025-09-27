import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  SlidersHorizontal,
  TrendingDown,
  Receipt,
  Filter
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
      setSelectedDuration('current-month');
    }
  }, [banks, selectedBankId, selectedBank, setSelectedBank, selectedDuration, setSelectedDuration]);

  
  // Get current date and generate duration options
  const getDurationOptions = () => {
    const options = [
      { value: 'current-month', label: 'Current Month' },
      { value: 'previous-month', label: 'Previous Month' },
      { value: 'month-before-previous', label: 'Month Before Previous' }
    ];
    
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

  // Calculate summary metrics
  const totalSpent = useMemo(() => {
    return filteredTransactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalEarned = useMemo(() => {
    return filteredTransactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const getDurationLabel = () => {
    const options = getDurationOptions();
    const current = options.find(opt => opt.value === selectedDuration);
    return current?.label || 'Current Month';
  };

  const getCurrentFilters = () => {
    const filters = [];
    if (selectedBankId) {
      filters.push(getBankName(selectedBankId));
    }
    if (selectedDuration) {
      filters.push(getDurationLabel());
    }
    return filters;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header with Context */}
      <div className="bg-gradient-to-b from-card to-card/50 border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          {/* Page Title & Context */}
          <div className="px-4 pt-6 pb-3">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            
            {/* Active Filters Display - Hidden on mobile */}
            <div className="hidden md:flex flex-wrap gap-2 mb-3">
              {getCurrentFilters().map((filter, index) => (
                <Badge key={index} variant="secondary" className="text-xs font-medium">
                  {filter}
                </Badge>
              ))}
            </div>

            {/* Summary Cards - Simplified on mobile */}
            <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
              <Card className="p-2 md:p-3 bg-gradient-to-br from-card to-muted/20 border border-border/50">
                <div className="flex items-center gap-1 md:gap-2">
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Spent</p>
                    <p className="text-sm md:text-lg font-bold text-foreground">₹{totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-2 md:p-3 bg-gradient-to-br from-card to-muted/20 border border-border/50">
                <div className="flex items-center gap-1 md:gap-2">
                  <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-success" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Earned</p>
                    <p className="text-sm md:text-lg font-bold text-foreground">₹{totalEarned.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Enhanced Search & Filters - Mobile Optimized */}
          <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-2 md:space-y-3">
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 md:pl-12 pr-14 md:pr-16 h-10 md:h-12 bg-background/60 border-2 border-border/30 rounded-2xl text-sm md:text-base font-medium placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-background shadow-sm"
              />
              
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-10 md:right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 md:h-7 md:w-7 p-0 hover:bg-muted/50 rounded-full"
                >
                  <X className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </Button>
              )}
              
              {/* Enhanced Filter Button */}
              <Popover open={filterOpen} onOpenChange={setFilterOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 h-8 px-2 md:px-3 bg-background/80 border-border/50 hover:bg-muted/50 rounded-xl"
                  >
                    <Filter className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 p-4 bg-background/95 backdrop-blur-sm border border-border shadow-xl rounded-2xl" 
                  align="end"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold text-base">Filters</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Bank Account</label>
                        <Select value={selectedBankId} onValueChange={(value) => {
                          setSelectedBankId(value);
                          setSelectedBank(value);
                        }}>
                          <SelectTrigger className="h-11 bg-background border-border rounded-xl">
                            <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Select Bank" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border shadow-lg rounded-xl z-[100]">
                            {banks.map((bank) => (
                              <SelectItem key={bank.id} value={bank.id} className="text-sm py-2 rounded-lg">
                                {bank.bank_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Time Period</label>
                        <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                          <SelectTrigger className="h-11 bg-background border-border rounded-xl">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Select Month" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border shadow-lg rounded-xl z-[100]">
                            {getDurationOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-sm py-2 rounded-lg">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Enhanced View Toggle - Mobile Optimized */}
            <div className="flex justify-center">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-xs md:max-w-md">
                <TabsList className="grid w-full grid-cols-2 bg-muted/40 h-8 md:h-10 p-0.5 md:p-1 rounded-xl">
                  <TabsTrigger value="group" className="text-xs md:text-sm font-semibold rounded-lg">
                    <Grid3X3 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Categories</span>
                    <span className="sm:hidden">Groups</span>
                  </TabsTrigger>
                  <TabsTrigger value="list" className="text-xs md:text-sm font-semibold rounded-lg">
                    <List className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">All Transactions</span>
                    <span className="sm:hidden">List</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area with Tabs */}
      <div className="max-w-2xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="group" className="mt-0">
            {/* Enhanced Grouped View - Categories */}
            {groupedByCategory.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wallet className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? 'No matches found' : 'No transactions yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Try adjusting your search terms or filters' 
                    : 'Your transaction categories will appear here'
                  }
                </p>
              </div>
            ) : (
              <div className="p-2 md:p-4 space-y-2 md:space-y-4">
                {groupedByCategory.map((group, index) => {
                  const { icon: CategoryIcon, bgColor, iconColor } = getCategoryIconAndColor('', group.category);
                  const percentageOfTotal = totalSpent > 0 ? (group.totalAmount / totalSpent) * 100 : 0;
                  
                  return (
                    <Card 
                      key={group.category} 
                      className="group p-0 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-border/50 rounded-2xl md:rounded-3xl bg-gradient-to-br from-card to-card/50 overflow-hidden"
                      onClick={() => setSelectedCategory(group)}
                    >
                      <CardContent className="p-3 md:p-5">
                        <div className="flex items-center md:items-start gap-3 md:gap-4">
                          {/* Enhanced Category Icon - Smaller on mobile */}
                          <div className={`p-2 md:p-4 rounded-xl md:rounded-2xl ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
                            <CategoryIcon className={`h-5 w-5 md:h-7 md:w-7 ${iconColor}`} />
                          </div>
                          
                          {/* Category Information - Mobile Optimized */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center md:items-start justify-between mb-1 md:mb-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base md:text-xl font-bold text-foreground mb-0 md:mb-1 truncate">
                                  {group.category}
                                </h3>
                                {/* Simplified badges on mobile */}
                                <div className="flex items-center gap-2 md:gap-3">
                                  <Badge variant="secondary" className="text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1">
                                    {group.merchantCount} merchant{group.merchantCount !== 1 ? 's' : ''}
                                  </Badge>
                                  {/* Hide transaction count on mobile */}
                                  <Badge variant="outline" className="hidden md:flex text-xs font-medium px-2 py-1">
                                    {group.transactionCount} transaction{group.transactionCount !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 md:gap-3 ml-3 md:ml-4">
                                <div className="text-right">
                                  <div className="text-lg md:text-2xl font-bold text-foreground mb-0 md:mb-1">
                                    ₹{group.totalAmount.toLocaleString()}
                                  </div>
                                  {/* Hide percentage on mobile */}
                                  {percentageOfTotal > 0 && (
                                    <div className="hidden md:block text-sm font-medium text-muted-foreground">
                                      {percentageOfTotal.toFixed(1)}% of spending
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:translate-x-1 transition-transform duration-300" />
                              </div>
                            </div>
                            
                            {/* Progress Bar - Hidden on mobile */}
                            {percentageOfTotal > 0 && (
                              <div className="hidden md:block w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: `${Math.min(percentageOfTotal, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="list" className="mt-0">
            {/* Enhanced List View */}
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wallet className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? 'No matches found' : 'No transactions yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Try adjusting your search terms or filters' 
                    : 'Your transactions will appear here'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {filteredTransactions.map((transaction, index) => {
                  const { icon: CategoryIcon, bgColor, iconColor } = getCategoryIconAndColor(transaction.merchant, transaction.category);
                  const isCredit = transaction.transaction_type === 'credit';
                  const transactionDate = new Date(transaction.mail_time);
                  const isHighValue = transaction.amount > 5000;
                  
                  return (
                    <div 
                      key={transaction.id} 
                      className="group p-3 md:p-5 hover:bg-gradient-to-r hover:from-muted/20 hover:to-transparent transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        {/* Enhanced Icon Avatar - Smaller on mobile */}
                        <div className="relative">
                          <Avatar className={`h-10 w-10 md:h-14 md:w-14 ${bgColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                            <AvatarFallback className={`${bgColor} border-0`}>
                              <CategoryIcon className={`h-5 w-5 md:h-7 md:w-7 ${iconColor}`} />
                            </AvatarFallback>
                          </Avatar>
                          {/* Hide high value indicator on mobile */}
                          {isHighValue && (
                            <div className="hidden md:flex absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full items-center justify-center">
                              <div className="w-2 h-2 bg-warning-foreground rounded-full" />
                            </div>
                          )}
                        </div>
                        
                        {/* Enhanced Transaction Details - Mobile Optimized */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center md:items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base md:text-lg font-bold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                                {transaction.merchant || 'Unknown Merchant'}
                              </h3>
                              {/* Simplified date display on mobile */}
                              <div className="flex items-center gap-2 md:gap-3 mb-0 md:mb-2">
                                <p className="text-xs md:text-sm font-medium text-muted-foreground">
                                  {transactionDate.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: transactionDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                  })}
                                </p>
                                {/* Hide category badge on mobile */}
                                <span className="hidden md:inline text-muted-foreground">•</span>
                                <div className="hidden md:flex items-center gap-1">
                                  <Tag className="h-4 w-4 text-muted-foreground" />
                                  <Badge variant="outline" className="text-xs font-medium px-2 py-0.5">
                                    {transaction.category || 'Other'}
                                  </Badge>
                                </div>
                              </div>
                              {/* Hide detailed time on mobile */}
                              <p className="hidden md:block text-xs text-muted-foreground">
                                {transactionDate.toLocaleDateString('en-US', { 
                                  weekday: 'long',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            
                            {/* Enhanced Amount Display - Simplified on mobile */}
                            <div className="text-right ml-3 md:ml-6">
                              <div className={`text-base md:text-xl font-bold mb-0 md:mb-1 ${
                                isCredit 
                                  ? 'text-success' 
                                  : 'text-foreground'
                              }`}>
                                {isCredit ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                              </div>
                              {/* Simplified transaction type display */}
                              <div className="flex items-center justify-end gap-0.5 md:gap-1">
                                {isCredit ? (
                                  <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-success" />
                                ) : (
                                  <ArrowDownLeft className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                                )}
                                {/* Hide type labels on mobile */}
                                <span className={`hidden md:inline text-xs font-medium ${isCredit ? 'text-success' : 'text-muted-foreground'}`}>
                                  {isCredit ? 'Credit' : 'Debit'}
                                </span>
                              </div>
                              {/* Hide high value badge on mobile */}
                              {isHighValue && (
                                <Badge variant="secondary" className="hidden md:inline-flex text-xs mt-1">
                                  High Value
                                </Badge>
                              )}
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
        
        {/* Enhanced Summary Footer - Simplified on mobile */}
        {(activeTab === 'group' ? groupedByCategory.length > 0 : filteredTransactions.length > 0) && (
          <div className="p-3 md:p-6 text-center border-t border-border/30 bg-gradient-to-t from-muted/30 to-transparent">
            <div className="flex items-center justify-center gap-1 md:gap-2 mb-1 md:mb-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full animate-pulse" />
              <p className="text-xs md:text-sm font-semibold text-foreground">
                {activeTab === 'group'
                  ? `${groupedByCategory.length} categor${groupedByCategory.length !== 1 ? 'ies' : 'y'}`
                  : `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {/* Simplified footer text on mobile */}
              <span className="md:hidden">{getBankName(selectedBankId)}</span>
              <span className="hidden md:inline">Showing data from {getBankName(selectedBankId)} • {getDurationLabel()}</span>
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
                    <div key={merchant.merchant} className="p-3 bg-muted/20 rounded-2xl">
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