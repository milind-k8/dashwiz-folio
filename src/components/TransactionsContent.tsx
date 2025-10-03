import { useMemo, useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
  Wallet,
  X,
  Calendar,
  SlidersHorizontal
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

import { useGlobalStore } from '@/store/globalStore';
import { TableLoader } from '@/components/ui/loader';
import { CategorySelector } from './CategorySelector';
import { CategoryManagementDialog } from './CategoryManagementDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  mail_time: string;
  merchant: string;
  bank_id: string;
  category?: string;
}


export const TransactionsContent = () => {
  const { user } = useAuth();
  const { banks, transactions, loading, refreshData } = useGlobalStore();
  const { selectedBank, selectedDuration, setSelectedBank, setSelectedDuration } = useFilterStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string>(selectedBank || '');
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

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

  // Get merchant initial and random background color
  const getMerchantInitial = (merchant: string) => {
    const name = merchant || 'Unknown';
    const initial = name.charAt(0).toUpperCase();
    
    // Generate consistent background color based on first character
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700', 
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-cyan-100 text-cyan-700',
      'bg-red-100 text-red-700'
    ];
    
    const colorIndex = initial.charCodeAt(0) % colors.length;
    return {
      initial,
      colorClass: colors[colorIndex]
    };
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

  // Calculate net amount for the month (Credits - Debits)
  const monthNetAmount = useMemo(() => {
    const debits = filteredTransactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const credits = filteredTransactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return credits - debits;
  }, [filteredTransactions]);

  // Get month display text
  const getMonthDisplay = () => {
    const now = new Date();
    let targetYear: number, targetMonth: number;
    
    switch (selectedDuration) {
      case 'current-month':
        targetYear = now.getFullYear();
        targetMonth = now.getMonth();
        break;
      case 'previous-month':
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        targetYear = prevMonth.getFullYear();
        targetMonth = prevMonth.getMonth();
        break;
      case 'month-before-previous':
        const monthBefore = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        targetYear = monthBefore.getFullYear();
        targetMonth = monthBefore.getMonth();
        break;
      default:
        targetYear = now.getFullYear();
        targetMonth = now.getMonth();
    }
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${monthNames[targetMonth]} ${targetYear}`;
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setSelectedCategory(transaction.category || 'Other');
  };

  const handleSaveCategory = async () => {
    if (!editingTransaction || !user) return;

    const { error } = await supabase
      .from('transactions')
      .update({ category: selectedCategory })
      .eq('id', editingTransaction.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Category updated successfully",
    });

    setEditingTransaction(null);
    // Force immediate refresh
    await refreshData();
  };

  // Real-time subscription for transaction updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `bank_id=in.(${banks.map(b => b.id).join(',')})`
        },
        () => {
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, banks, refreshData]);


  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in max-w-md mx-auto">
        <div className="space-y-2">
          <h1 className="text-xl font-medium text-foreground font-google">
            Transaction Statements
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
              className="pl-10 pr-20 h-12 bg-muted/30 border border-border/50 rounded-full text-base font-normal placeholder:text-muted-foreground/70"
            />
            
            {/* Clear search button */}
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/50 rounded-full"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            
            {/* Filter Popover */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
                >
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-4 bg-background border border-border shadow-lg" 
                align="end"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
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
                        {getDurationOptions().map((option) => (
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
          
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-2xl mx-auto">
        {/* Normal List View */}
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-google">
              {searchTerm ? 'No transactions match your search' : 'No transactions found'}
            </p>
          </div>
        ) : (
          <>
            {/* Month Header */}
            <div className="bg-card border-b border-border/50 px-4 py-3 sticky top-[76px] z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground font-google">
                  {getMonthDisplay()}
                </h3>
                <div className={`text-base font-semibold font-google ${
                  monthNetAmount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {monthNetAmount >= 0 ? '+' : ''}₹{Math.abs(monthNetAmount).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="divide-y divide-border/50">
              {filteredTransactions.map((transaction) => {
                const { initial, colorClass } = getMerchantInitial(transaction.merchant);
                const isCredit = transaction.transaction_type === 'credit';
                
                return (
                  <div 
                    key={transaction.id} 
                    className="px-4 py-4 hover:bg-muted/30 transition-colors bg-card cursor-pointer active:bg-muted/50"
                    onClick={() => handleEditTransaction(transaction as Transaction)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Merchant Initial Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${colorClass} border-0 text-sm font-semibold`}>
                          {initial}
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
                              <p className="text-xs text-muted-foreground truncate">
                                {transaction.category || 'Other'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Amount */}
                          <div className="text-right ml-3">
                            <div className={`text-sm font-semibold font-google ${
                              isCredit 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {isCredit ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                            </div>
                            <div className="flex items-center justify-end mt-1">
                              {isCredit ? (
                                <ArrowUpRight className="h-3 w-3 text-green-600" />
                              ) : (
                                <ArrowDownLeft className="h-3 w-3 text-red-600" />
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
          </>
        )}
        
        {/* Summary Footer */}
        {filteredTransactions.length > 0 && (
          <div className="p-4 text-center border-t border-border/50 bg-muted/20">
            <p className="text-xs text-muted-foreground font-google">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} • {getBankName(selectedBankId)}
            </p>
          </div>
        )}
      </div>

      {/* Edit Category Drawer */}
      <Drawer open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DrawerContent>
          <DrawerHeader className="border-b">
            <DrawerTitle>Transaction Details</DrawerTitle>
          </DrawerHeader>
          <div className="p-6 space-y-6">
            {/* Transaction Info Card */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Merchant</p>
                  <p className="font-semibold text-lg capitalize">{editingTransaction?.merchant || 'Unknown'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Amount</p>
                  <p className={`font-bold text-xl ${
                    editingTransaction?.transaction_type === 'credit' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {editingTransaction?.transaction_type === 'credit' ? '+' : '-'}₹
                    {Math.abs(Number(editingTransaction?.amount || 0)).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">
                    {editingTransaction?.mail_time 
                      ? new Date(editingTransaction.mail_time).toLocaleDateString('en-IN', { 
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : '-'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <p className="font-medium capitalize">{editingTransaction?.transaction_type || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Bank</p>
                <p className="font-medium">{getBankName(editingTransaction?.bank_id || '')}</p>
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Category</p>
                {user && <CategoryManagementDialog userId={user.id} />}
              </div>
              {user && (
                <CategorySelector
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  userId={user.id}
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setEditingTransaction(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveCategory}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

    </div>
  );
};