import { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBankData } from '@/hooks/useBankData';

interface InlineFiltersProps {
  onFiltersChange?: (banks: string[], duration: string) => void;
}

export function InlineFilters({ onFiltersChange }: InlineFiltersProps) {
  const [selectedBank, setSelectedBank] = useState('all-banks');
  const [selectedDuration, setSelectedDuration] = useState('current-month');
  const { availableBanks, isLoading } = useBankData();

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

  const bankOptions = [
    { value: 'all-banks', label: 'All Banks' },
    ...availableBanks.filter(bank => bank !== 'all-banks').map(bank => ({
      value: bank,
      label: getBankLabel(bank)
    }))
  ];

  const durationOptions = [
    { value: 'current-month', label: 'Current Month' },
    { value: 'previous-month', label: 'Previous Month' },
    { value: 'previous-3-months', label: 'Previous 3 Months' },
    { value: 'previous-6-months', label: 'Previous 6 Months' }
  ];

  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange([selectedBank], selectedDuration);
    }
  }, [selectedBank, selectedDuration, onFiltersChange]);

  const handleBankChange = (value: string) => {
    setSelectedBank(value);
  };

  const handleDurationChange = (value: string) => {
    setSelectedDuration(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Loading filters...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Filter:</span>
      
      <Select value={selectedBank} onValueChange={handleBankChange}>
        <SelectTrigger className="w-32 h-8 border-0 bg-transparent text-foreground font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {bankOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">|</span>

      <Select value={selectedDuration} onValueChange={handleDurationChange}>
        <SelectTrigger className="w-36 h-8 border-0 bg-transparent text-foreground font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {durationOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}