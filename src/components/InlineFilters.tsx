import { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBankData } from '@/hooks/useBankData';

interface InlineFiltersProps {
  onFiltersChange?: (banks: string[], duration: string) => void;
}

export function InlineFilters({ onFiltersChange }: InlineFiltersProps) {
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
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

  useEffect(() => {
    if (onFiltersChange) {
      const banksToSend = selectedBanks.length > 0 ? selectedBanks : availableBanks;
      onFiltersChange(banksToSend, selectedDuration);
    }
  }, [selectedBanks, selectedDuration, onFiltersChange, availableBanks]);

  const allChecked = availableBanks.length > 0 && availableBanks.every(b => selectedBanks.includes(b));

  const toggleAllBanks = () => {
    if (allChecked) {
      setSelectedBanks([]);
    } else {
      setSelectedBanks([...availableBanks]);
    }
  };

  const toggleBank = (value: string) => {
    setSelectedBanks(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return Array.from(next);
    });
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
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-40 h-8 border-0 bg-transparent text-foreground font-medium text-left truncate px-2">
            {allChecked || selectedBanks.length === 0
              ? 'All Banks'
              : `${selectedBanks.length} selected`}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuCheckboxItem checked={allChecked} onCheckedChange={toggleAllBanks}>
            All Banks
          </DropdownMenuCheckboxItem>
          {bankOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selectedBanks.includes(option.value)}
              onCheckedChange={() => toggleBank(option.value)}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="text-muted-foreground">|</span>

      <Select value={selectedDuration} onValueChange={handleDurationChange}>
        <SelectTrigger className="w-36 h-8 border-0 bg-transparent text-foreground font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-0">
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