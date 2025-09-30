import { Card, CardContent } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { TrendingUp } from 'lucide-react';
import { TopTransactions } from '@/components/TopTransactions';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  mail_time: string;
  merchant?: string;
  bank_id: string;
  snippet?: string;
}

interface Bank {
  id: string;
  bank_name: string;
}

interface TransactionChipsProps {
  transactions: Transaction[];
  banks: Bank[];
}

export function TransactionChips({ transactions, banks }: TransactionChipsProps) {
  return (
    <div className="mb-4">
      <div className="flex gap-2 overflow-x-auto pb-2 px-1 py-1 scrollbar-hide">
        <Drawer>
          <DrawerTrigger asChild>
            <Card className="flex-shrink-0 cursor-pointer border border-gray-300 shadow-sm">
              <CardContent className="p-2 px-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-foreground font-google">Top Expenses</span>
                </div>
              </CardContent>
            </Card>
          </DrawerTrigger>
          
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader className="border-b">
              <DrawerTitle className="flex items-center gap-2 text-foreground font-google">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                Top Expenses
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto">
              <TopTransactions 
                transactions={transactions}
                banks={banks}
                isDrawerContent={true}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
