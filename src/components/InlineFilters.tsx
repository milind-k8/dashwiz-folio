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

  const allChecked = selectedBanks.length === 0 || (availableBanks.length > 0 && availableBanks.every(b => selectedBanks.includes(b)));

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
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground font-medium">Filter:</span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md hover:bg-muted/50 transition-colors font-medium text-foreground min-w-[140px] justify-between">
            <span className="truncate">
              {allChecked || selectedBanks.length === 0
                ? 'All Banks'
                : `${selectedBanks.length} selected`}
            </span>
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-card border border-border shadow-lg z-50">
          <DropdownMenuCheckboxItem 
            checked={allChecked} 
            onCheckedChange={toggleAllBanks}
            className="font-medium"
          >
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

      <div className="w-px h-4 bg-border" />

      <Select value={selectedDuration} onValueChange={handleDurationChange}>
        <SelectTrigger className="w-44 h-9 bg-card border border-border hover:bg-muted/50 transition-colors font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card border border-border shadow-lg z-50">
          {durationOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="hover:bg-muted/50 cursor-pointer"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}