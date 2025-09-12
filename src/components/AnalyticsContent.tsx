import { useEffect, useMemo, useState } from 'react';
import { bankDataService } from '@/services/bankDataService';
import { getBanksSync, getTransactionsForBanksSync, isDbReady } from '@/lib/lokiDb';
import { TableLoader } from '@/components/ui/loader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Database, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  DollarSign,
  Calendar,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Building
} from 'lucide-react';

interface TxnRow {
  bank: string;
  refId: string;
  date: string;
  type: 'deposit' | 'withdrawl';
  amount: number;
  category: string;
  tags: string;
}

export const AnalyticsContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await bankDataService.loadBankData();
      setIsLoading(false);
    };
    init();
    const onChange = () => setTick((v) => v + 1);
    bankDataService.onChange(onChange);
    return () => bankDataService.offChange(onChange);
  }, []);

  const banks = useMemo(() => (isDbReady() ? getBanksSync() : []), [tick, isLoading]);
  
  // Set default bank when banks are loaded
  useEffect(() => {
    if (banks.length > 0 && !selectedBank) {
      setSelectedBank(banks[0]);
    }
  }, [banks, selectedBank]);
  const transactions = useMemo<TxnRow[]>(() => {
    if (!isDbReady()) return [];
    return getTransactionsForBanksSync(['all-banks']).map((t) => ({
      bank: (t as any).bank,
      refId: t.refId,
      date: t.date,
      type: t.type,
      amount: t.amount,
      category: t.category,
      tags: t.tags,
    }));
  }, [tick, isLoading]);

  // Calculate analytics data
  const analytics = useMemo(() => {
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdrawl')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const categories = [...new Set(transactions.map(t => t.category))];
    
    return {
      totalTransactions: transactions.length,
      totalBanks: banks.length,
      totalDeposits,
      totalWithdrawals,
      netFlow: totalDeposits - totalWithdrawals,
      totalCategories: categories.length,
    };
  }, [transactions, banks]);

  // Filter transactions based on search term and selected bank
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = searchTerm === '' || 
        transaction.refId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.tags && transaction.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
        transaction.amount.toString().includes(searchTerm.toLowerCase());
      
      const matchesBank = selectedBank === '' || transaction.bank === selectedBank;
      
      return matchesSearch && matchesBank;
    });
  }, [transactions, searchTerm, selectedBank]);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Comprehensive overview of your financial data and transaction history
        </p>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/50 dark:border-blue-800/30 hover-scale">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 leading-tight">Total Transactions</p>
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full flex-shrink-0">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300 leading-tight break-all">
              {analytics.totalTransactions.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200/50 dark:border-green-800/30 hover-scale">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 leading-tight">Total Deposits</p>
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/50 rounded-full flex-shrink-0">
                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-700 dark:text-green-300 leading-tight break-all">
              ₹{analytics.totalDeposits.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-red-50/50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 border-red-200/50 dark:border-red-800/30 hover-scale">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 leading-tight">Total Withdrawals</p>
              <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/50 rounded-full flex-shrink-0">
                <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-700 dark:text-red-300 leading-tight break-all">
              ₹{analytics.totalWithdrawals.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200/50 dark:border-purple-800/30 hover-scale">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 leading-tight">Connected Banks</p>
              <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full flex-shrink-0">
                <Building className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300 leading-tight break-all">
              {analytics.totalBanks}
            </p>
          </div>
        </Card>
      </div>

      {/* Banks Management */}
      <Card className="p-4 md:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Connected Banks</h2>
            <p className="text-sm text-muted-foreground">Manage your connected financial institutions</p>
          </div>
        </div>
        
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-semibold w-1/3 min-w-[120px]">Bank Name</TableHead>
                <TableHead className="font-semibold w-32">Transactions</TableHead>
                <TableHead className="font-semibold w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map((b) => {
                const count = transactions.filter((t) => t.bank === b).length;
                return (
                  <TableRow key={b} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 bg-primary/10 rounded-md flex-shrink-0">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium uppercase truncate">{b}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-32">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {count} transactions
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete bank "{b.toUpperCase()}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the bank and all its transactions. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => bankDataService.removeBank(b)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!banks.length && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    {isLoading ? (
                      <TableLoader text="Loading banks..." />
                    ) : (
                      'No banks connected yet'
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-4 md:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Transaction History</h2>
              <p className="text-sm text-muted-foreground">
                {filteredTransactions.length} of {transactions.length} transactions
              </p>
            </div>
          </div>
          
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger className="w-full sm:w-48 bg-background border border-border hover:bg-muted/50 transition-colors">
              <SelectValue placeholder="Select Bank" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-48">
              {banks.map((bank) => (
                <SelectItem 
                  key={bank} 
                  value={bank}
                  className="hover:bg-muted/50 cursor-pointer uppercase font-medium"
                >
                  {bank.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        </div>
        
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold w-32 min-w-[120px]">Date</TableHead>
                  <TableHead className="font-semibold w-40 min-w-[140px]">Reference</TableHead>
                  <TableHead className="font-semibold w-28 min-w-[100px]">Type</TableHead>
                  <TableHead className="font-semibold w-32 min-w-[120px] text-right">Amount</TableHead>
                  <TableHead className="font-semibold w-40 min-w-[140px]">Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((t) => (
                  <TableRow key={`${t.bank}-${t.refId}`} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="w-32">
                      <div className="text-sm font-medium whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: '2-digit' 
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="font-mono text-sm text-muted-foreground truncate">{t.refId}</div>
                    </TableCell>
                    <TableCell className="w-28">
                      <Badge 
                        variant={t.type === 'deposit' ? 'default' : 'secondary'}
                        className={`text-xs font-medium ${
                          t.type === 'deposit' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {t.type === 'deposit' ? (
                            <ArrowUpRight className="h-3 w-3 flex-shrink-0" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 flex-shrink-0" />
                          )}
                          <span className="capitalize">{t.type}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="w-32 text-right">
                      <div className="font-mono font-semibold text-sm">
                        ₹{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="text-sm text-muted-foreground">
                        {t.tags ? (
                          <div className="flex flex-wrap gap-1">
                            {t.tags.split(',').slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                                {tag.trim()}
                              </Badge>
                            ))}
                            {t.tags.split(',').length > 2 && (
                              <span className="text-xs text-muted-foreground">+{t.tags.split(',').length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredTransactions.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {isLoading ? (
                        <TableLoader text="Loading transactions..." />
                      ) : searchTerm ? (
                        'No transactions match your search'
                      ) : (
                        'No transactions found'
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
};