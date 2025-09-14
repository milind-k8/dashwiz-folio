import { useEffect, useMemo, useState } from 'react';
import { bankDataService } from '@/services/bankDataService';
import { getBanksSync, getTransactionsForBanksSync, isDbReady } from '@/lib/lokiDb';
import { TableLoader } from '@/components/ui/loader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { FileUploadModal } from '@/components/FileUploadModal';
import { 
  Database, 
  CreditCard, 
  Trash2,
  Building,
  Plus,
  Upload
} from 'lucide-react';

export const BanksContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);

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
  
  const transactions = useMemo(() => {
    if (!isDbReady()) return [];
    return getTransactionsForBanksSync(['all-banks']);
  }, [tick, isLoading]);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Banks Management
          </h1>
          <p className="text-muted-foreground">
            Manage your connected banks and upload transaction data
          </p>
        </div>
        
        <Button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Bank Data
        </Button>
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
                <TableHead className="font-semibold w-32">Last Updated</TableHead>
                <TableHead className="font-semibold w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map((b) => {
                const bankTransactions = transactions.filter((t) => t.bank === b);
                const count = bankTransactions.length;
                const lastTransaction = bankTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                
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
                    <TableCell className="w-32">
                      <div className="text-sm text-muted-foreground">
                        {lastTransaction ? new Date(lastTransaction.date).toLocaleDateString() : 'No data'}
                      </div>
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
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {isLoading ? (
                      <TableLoader text="Loading banks..." />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Building className="h-8 w-8 text-muted-foreground/50" />
                        <p>No banks connected yet</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowUploadModal(true)}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Bank
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <FileUploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />
    </div>
  );
};