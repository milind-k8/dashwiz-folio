import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

type BankBreakdownItem = {
  bank: string;
  balance?: number;
  income?: number;
  expenses?: number;
};

interface BalanceOverviewCardProps {
  totalBalance: number;
  bankBreakdown?: BankBreakdownItem[];
  className?: string;
}

function formatIndianCompact(value: number): string {
  if (value >= 1_00_00_000) {
    return `${(value / 1_00_00_000).toFixed(1).replace(/\.0$/, '')}Cr`;
  }
  if (value >= 1_00_000) {
    return `${(value / 1_00_000).toFixed(1).replace(/\.0$/, '')}L`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return value.toString();
}

function getPillColor(index: number) {
  const colors = [
    'bg-[hsl(217,91%,60%)]', // blue
    'bg-[hsl(142,71%,45%)]', // green
    'bg-[hsl(45,93%,47%)]',  // yellow
    'bg-[hsl(0,72%,51%)]',   // red
    'bg-[hsl(262,52%,47%)]', // purple
    'bg-[hsl(173,80%,40%)]', // teal
    'bg-[hsl(24,95%,53%)]',  // orange
    'bg-[hsl(339,82%,52%)]', // pink
  ];
  return colors[index % colors.length];
}

export function BalanceOverviewCard({ totalBalance, bankBreakdown = [], className }: BalanceOverviewCardProps) {
  const isMasked = useUIStore(state => state.isBalanceMasked);
  const topBanks = bankBreakdown
    .filter(b => (b.balance || 0) > 0)
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 4);

  const totalIncome = bankBreakdown.reduce((sum, b) => sum + (b.income || 0), 0);
  const totalExpenses = bankBreakdown.reduce((sum, b) => sum + (b.expenses || 0), 0);
  const savings = totalIncome - totalExpenses;

  const renderBankAvatar = (bankName: string, idx: number) => {
    if (/hdfc/i.test(bankName)) {
      return (
        <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center ring-1 ring-border overflow-hidden">
          <img src="/banks/hdfc.png" alt="HDFC" className="w-full h-full object-contain" />
        </span>
      );
    }
    return (
      <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white', getPillColor(idx))}>
        {bankName.trim().charAt(0).toUpperCase()}
      </span>
    );
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <Header totalBalance={totalBalance} />

        <div className="h-px bg-border my-4" />

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground font-roboto mb-1">Income</div>
            <div className="text-base font-medium text-success font-google">
              {isMasked ? '••••' : `₹${formatIndianCompact(totalIncome)}`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground font-roboto mb-1">Expenses</div>
            <div className="text-base font-medium text-destructive font-google">
              {isMasked ? '••••' : `₹${formatIndianCompact(totalExpenses)}`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground font-roboto mb-1">Savings</div>
            <div className={cn("text-base font-medium font-google", savings >= 0 ? "text-success" : "text-destructive")}>
              {isMasked ? '••••' : `₹${formatIndianCompact(savings)}`}
            </div>
          </div>
        </div>

        {topBanks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topBanks.map((b, idx) => (
              <div key={b.bank} className="inline-flex items-center gap-2 bg-muted/30 rounded-full pr-3 pl-2 py-1">
                {renderBankAvatar(b.bank, idx)}
                <span className="text-xs text-foreground font-roboto">
                  {isMasked ? '••••••' : formatIndianCompact(b.balance || 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BalanceOverviewCard;

function Header({ totalBalance }: { totalBalance: number }) {
  const isMasked = useUIStore(state => state.isBalanceMasked);
  const toggle = useUIStore(state => state.toggleBalanceMasked);

  const maskedText = '•••••••';
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-xs text-muted-foreground font-roboto mb-1">Total Balance</div>
        <div className="text-3xl sm:text-4xl font-normal text-foreground font-google tracking-tight">
          {isMasked ? maskedText : `₹${totalBalance.toLocaleString()}`}
        </div>
      </div>
      <button
        type="button"
        aria-label={isMasked ? 'Show balance' : 'Hide balance'}
        onClick={toggle}
        className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
      >
        {isMasked ? <Eye className="w-5 h-5 text-muted-foreground" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
      </button>
    </div>
  );
}


