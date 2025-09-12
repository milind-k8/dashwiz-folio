import { useEffect, useMemo, useState } from 'react';
import { bankDataService } from '@/services/bankDataService';
import { getBanksSync, getTransactionsForBanksSync, isDbReady } from '@/lib/lokiDb';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="p-4">
        <h2 className="text-lg font-medium mb-3">Banks</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank</TableHead>
                <TableHead>Total Transactions</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map((b) => {
                const count = transactions.filter((t) => t.bank === b).length;
                return (
                  <TableRow key={b}>
                    <TableCell className="font-medium uppercase">{b}</TableCell>
                    <TableCell>{count}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete bank “{b.toUpperCase()}”?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the bank and all its transactions. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => bankDataService.removeBank(b)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!banks.length && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">{isLoading ? 'Loading...' : 'No banks found'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Transactions</h2>
          <div className="text-sm text-muted-foreground">{transactions.length} records</div>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank</TableHead>
                <TableHead>Ref ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={`${t.bank}-${t.refId}`}>
                  <TableCell className="uppercase">{t.bank}</TableCell>
                  <TableCell className="font-mono text-xs">{t.refId}</TableCell>
                  <TableCell>{t.date}</TableCell>
                  <TableCell className={t.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}>{t.type}</TableCell>
                  <TableCell className="text-right">{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>{t.tags}</TableCell>
                </TableRow>
              ))}
              {!transactions.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">{isLoading ? 'Loading...' : 'No transactions found'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};


