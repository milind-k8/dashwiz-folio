import { useSearchParams } from 'react-router-dom';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFinancialData } from '@/hooks/useFinancialData';
import { Loader } from '@/components/ui/loader';

interface InlineFiltersProps {
  onFiltersChange?: (bank: string, duration: string) => void;
}

export function InlineFilters({ onFiltersChange }: InlineFiltersProps) {
  const [searchParams] = useSearchParams();
  const { availableBanks, isLoading } = useFinancialData();

  // Get filter values from URL params
  const selectedBank = searchParams.get('bank') || '';
  const selectedDuration = searchParams.get('duration') || 'current-month';

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

  const durationOptions = [
    { value: 'current-month', label: 'Current Month' },
    { value: 'previous-month', label: 'Previous Month' },
    { value: 'previous-3-months', label: 'Previous 3 Months' },
    { value: 'previous-6-months', label: 'Previous 6 Months' }
  ];

  const handleBankChange = (value: string) => {
    if (onFiltersChange) {
      onFiltersChange(value, selectedDuration);
    }
  };

  const handleDurationChange = (value: string) => {
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
          <SelectTrigger className="w-full h-9 bg-card/50 border border-border/50 hover:bg-muted/50 transition-all duration-200 font-medium text-sm focus:ring-0 focus:ring-offset-0 backdrop-blur-sm">
            <SelectValue placeholder="Select Bank" />
          </SelectTrigger>
          <SelectContent className="bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl z-50">
            {bankOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="hover:bg-muted/50 cursor-pointer text-sm"
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
          <SelectTrigger className="w-full h-9 bg-card/50 border border-border/50 hover:bg-muted/50 transition-all duration-200 font-medium text-sm focus:ring-0 focus:ring-offset-0 backdrop-blur-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl z-50">
            {durationOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="hover:bg-muted/50 cursor-pointer text-sm"
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