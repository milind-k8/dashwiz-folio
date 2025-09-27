import { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Tag
} from 'lucide-react';

import { useGlobalStore } from '@/store/globalStore';
import { TableLoader } from '@/components/ui/loader';

export const TransactionsContent = () => {
  const { banks, transactions, loading } = useGlobalStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string>('');

  // Set first bank as default when banks are loaded
  useEffect(() => {
    if (banks.length > 0 && !selectedBankId) {
      setSelectedBankId(banks[0].id);
    }
  }, [banks, selectedBankId]);

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

  // Filter transactions based on search term and selected bank
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
      
      return matchesSearch && matchesBank;
    });
  }, [transactions, searchTerm, selectedBankId]);

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
        <div className="max-w-md mx-auto p-4">
          <h1 className="text-xl font-medium text-foreground font-google mb-4">
            Transactions
          </h1>
          
          <div className="flex items-center gap-2">
            {/* Search Bar - Takes most space */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-8 bg-muted/30 border border-border/50 rounded-full text-xs font-medium"
              />
            </div>
            
            {/* Bank Filter - Compact fixed width */}
            <div className="w-24">
              <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                <SelectTrigger className="h-8 px-3 bg-muted/30 border border-border/50 rounded-full text-xs font-medium hover:bg-muted/50 transition-colors w-full">
                  <SelectValue placeholder="Bank" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg">
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id} className="text-xs py-1.5">
                      {bank.bank_name.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List - Google Pay style */}
      <div className="max-w-md mx-auto">
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
        
        {/* Summary Footer */}
        {filteredTransactions.length > 0 && (
          <div className="p-4 text-center border-t border-border/50 bg-muted/20">
            <p className="text-xs text-muted-foreground font-google">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} • {getBankName(selectedBankId)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};