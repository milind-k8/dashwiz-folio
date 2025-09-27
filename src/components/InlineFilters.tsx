import { useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useFilterStore } from '@/store/filterStore';
import { useGlobalStore } from '@/store/globalStore';
import { Loader } from '@/components/ui/loader';
import { format, subMonths, startOfMonth } from 'date-fns';

interface InlineFiltersProps {
  onFiltersChange?: (bank: string, duration: string) => void;
}

export function InlineFilters({ onFiltersChange }: InlineFiltersProps) {
  const { availableBanks, isLoading } = useFinancialData();
  const { banks } = useGlobalStore();
  const { 
    selectedBank, 
    selectedDuration, 
    setSelectedBank, 
    setSelectedDuration 
  } = useFilterStore();

  // Auto-select first bank if none is selected and banks are available
  useEffect(() => {
    if (availableBanks.length > 0) {
      // Check if current selectedBank is valid
      const isValidBank = selectedBank && availableBanks.includes(selectedBank);
      
      if (!isValidBank) {
        const firstBank = availableBanks[0];
        setSelectedBank(firstBank);
        if (onFiltersChange) {
          onFiltersChange(firstBank, selectedDuration);
        }
      }
    }
  }, [availableBanks, selectedBank, selectedDuration, setSelectedBank, onFiltersChange]);

  // Notify parent of current filters on mount or change
  useEffect(() => {
    if (selectedBank && onFiltersChange) {
      onFiltersChange(selectedBank, selectedDuration);
    }
  }, [selectedBank, selectedDuration, onFiltersChange]);

  const getBankLabel = (bankId: string) => {
    const bank = banks.find(b => b.id === bankId);
    if (!bank) return bankId;
    
    const bankName = bank.bank_name.toLowerCase();
    const labels: Record<string, string> = {
      'hdfc': 'HDFC Bank',
      'chase': 'Chase Bank', 
      'bofa': 'Bank of America',
      'wells': 'Wells Fargo',
      'citi': 'Citibank',
      'capital': 'Capital One'
    };
    return labels[bankName] || bank.bank_name.toUpperCase();
  };

  const bankOptions = availableBanks.map(bankId => ({
    value: bankId,
    label: getBankLabel(bankId)
  }));

  // Generate duration options for last 3 months
  const durationOptions = [
    { 
      value: 'current-month', 
      label: 'Current Month'
    },
    { 
      value: 'previous-month', 
      label: 'Previous Month'
    },
    { 
      value: 'month-before-previous', 
      label: 'Month Before Previous'
    }
  ];

  const handleBankChange = (value: string) => {
    setSelectedBank(value);
    if (onFiltersChange) {
      onFiltersChange(value, selectedDuration);
    }
  };

  const handleDurationChange = (value: string) => {
    setSelectedDuration(value);
    if (onFiltersChange) {
      onFiltersChange(selectedBank, value);
    }
  };

  if (isLoading) {
    return (
      <Loader variant="inline" size="sm" text="Loading filters..." />
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Bank Filter - Compact */}
      <div className="min-w-0">
        <Select value={selectedBank} onValueChange={handleBankChange}>
          <SelectTrigger className="h-7 px-2 py-1 bg-muted/30 border border-border rounded-full text-xs font-medium hover:bg-muted/50 transition-colors min-w-[80px] max-w-[120px]">
            <SelectValue placeholder="Bank" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-[100] min-w-[140px]">
            {bankOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs py-1.5 px-2"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration Filter - Compact */}
      <div className="min-w-0">
        <Select value={selectedDuration} onValueChange={handleDurationChange}>
          <SelectTrigger className="h-7 px-2 py-1 bg-muted/30 border border-border rounded-full text-xs font-medium hover:bg-muted/50 transition-colors min-w-[90px] max-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-[100] min-w-[160px]">
            {durationOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs py-1.5 px-2"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}