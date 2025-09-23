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
import { Loader } from '@/components/ui/loader';
import { format, subMonths, startOfMonth } from 'date-fns';

interface InlineFiltersProps {
  onFiltersChange?: (bank: string, duration: string) => void;
}

export function InlineFilters({ onFiltersChange }: InlineFiltersProps) {
  const { availableBanks, isLoading } = useFinancialData();
  const { 
    selectedBank, 
    selectedDuration, 
    setSelectedBank, 
    setSelectedDuration 
  } = useFilterStore();

  // Auto-select first bank if none is selected and banks are available
  useEffect(() => {
    if (!selectedBank && availableBanks.length > 0) {
      const firstBank = availableBanks[0];
      setSelectedBank(firstBank);
      if (onFiltersChange) {
        onFiltersChange(firstBank, selectedDuration);
      }
    }
  }, [availableBanks, selectedBank, selectedDuration, setSelectedBank, onFiltersChange]);

  // Notify parent of current filters on mount or change
  useEffect(() => {
    if (selectedBank && onFiltersChange) {
      onFiltersChange(selectedBank, selectedDuration);
    }
  }, [selectedBank, selectedDuration, onFiltersChange]);

  const getBankLabel = (bankCode: string) => {
    const labels: Record<string, string> = {
      'hdfc': 'HDFC Bank',
      'chase': 'Chase Bank',
      'bofa': 'Bank of America',
      'wells': 'Wells Fargo',
      'citi': 'Citibank',
      'capital': 'Capital One'
    };
    return labels[bankCode] || bankCode.toUpperCase();
  };

  const bankOptions = availableBanks.map(bank => ({
    value: bank,
    label: getBankLabel(bank)
  }));

  // Generate duration options for last 3 months
  const durationOptions = (() => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const previousMonth = startOfMonth(subMonths(now, 1));
    const monthBeforePrevious = startOfMonth(subMonths(now, 2));

    return [
      { 
        value: 'current-month', 
        label: `${format(currentMonth, 'MMMM yyyy')} (Current)` 
      },
      { 
        value: 'previous-month', 
        label: format(previousMonth, 'MMMM yyyy') 
      },
      { 
        value: 'month-before-previous', 
        label: format(monthBeforePrevious, 'MMMM yyyy') 
      }
    ];
  })();

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
    <div className="flex flex-row items-center gap-3 text-sm min-w-0 w-full">
      {/* Bank Filter - 50% width on mobile */}
      <div className="flex-1 min-w-0">
        <Select value={selectedBank} onValueChange={handleBankChange}>
          <SelectTrigger className="w-full h-9 bg-card border border-border hover:bg-muted/50 transition-all duration-200 font-medium text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <SelectValue placeholder="Select Bank" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border shadow-elevated z-[100] min-w-[200px]">
            {bankOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm py-2 px-3"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration Filter - 50% width on mobile */}
      <div className="flex-1 min-w-0">
        <Select value={selectedDuration} onValueChange={handleDurationChange}>
          <SelectTrigger className="w-full h-9 bg-card border border-border hover:bg-muted/50 transition-all duration-200 font-medium text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border shadow-elevated z-[100] min-w-[200px]">
            {durationOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm py-2 px-3"
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