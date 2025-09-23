import { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Calendar,
  Tag
} from 'lucide-react';
import { useGlobalData } from '@/hooks/useGlobalData';
import { useGlobalStore } from '@/store/globalStore';
import { TableLoader } from '@/components/ui/loader';

export const TransactionsContent = () => {
  const { loading } = useGlobalData();
  const { banks, transactions } = useGlobalStore();
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
      <div className="p-4 md:p-6 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Transaction History
          </h1>
        </div>
        <Card className="p-6">
          <TableLoader text="Loading transactions..." />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Transaction History
        </h1>
        <p className="text-muted-foreground">
          View and manage your transactions from the last 3 months
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by merchant, amount, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedBankId} onValueChange={setSelectedBankId}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select Bank" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.bank_name.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Mobile-Optimized Transaction Cards */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <Card className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No transactions match your search' : 'No transactions found'}
            </p>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="p-4 hover:shadow-md transition-shadow">
              {/* Mobile Layout */}
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground truncate">
                        {getBankName(transaction.bank_id)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground truncate">
                      {transaction.merchant || 'Unknown Merchant'}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 ml-3">
                  <div className={`font-bold text-lg ${
                    transaction.transaction_type === 'credit' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </div>
                  </div>
                </div>

                {/* Details Row */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(transaction.mail_time).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span>{transaction.category}</span>
                  </div>
                </div>

                {/* Type Badge */}
                <div className="flex items-center justify-between">
                <Badge 
                  variant={transaction.transaction_type === 'credit' ? 'default' : 'secondary'}
                  className={`text-xs font-medium ${
                    transaction.transaction_type === 'credit'
                      ? 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {transaction.transaction_type === 'credit' ? (
                      <ArrowUpRight className="h-3 w-3 flex-shrink-0" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 flex-shrink-0" />
                    )}
                    <span>{transaction.transaction_type === 'credit' ? 'Credit' : 'Debit'}</span>
                  </div>
                </Badge>
                  <div className="text-xs text-muted-foreground">
                    {new Date(transaction.mail_time).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <Card className="p-4 bg-muted/30">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} from {getBankName(selectedBankId)}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};