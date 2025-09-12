import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Loader } from '@/components/ui/loader';

interface InlineFiltersProps {
  onFiltersChange?: (banks: string[], duration: string) => void;
}

export function InlineFilters({ onFiltersChange }: InlineFiltersProps) {
  const [searchParams] = useSearchParams();
  const { availableBanks, isLoading } = useBankData();

  // Get filter values from URL params
  const selectedBanks = searchParams.get('banks')?.split(',').filter(Boolean) || [];
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

  // Remove the problematic useEffect that was causing infinite loops

  const allChecked = selectedBanks.length === 0 || (availableBanks.length > 0 && availableBanks.every(b => selectedBanks.includes(b)));

  const toggleAllBanks = () => {
    const newBanks = allChecked ? [] : [...availableBanks];
    if (onFiltersChange) {
      onFiltersChange(newBanks, selectedDuration);
    }
  };

  const toggleBank = (value: string) => {
    const currentBanks = new Set(selectedBanks);
    if (currentBanks.has(value)) {
      currentBanks.delete(value);
    } else {
      currentBanks.add(value);
    }
    const newBanks = Array.from(currentBanks);
    if (onFiltersChange) {
      onFiltersChange(newBanks, selectedDuration);
    }
  };

  const handleDurationChange = (value: string) => {
    if (onFiltersChange) {
      onFiltersChange(selectedBanks, value);
    }
  };

  if (isLoading) {
    return (
      <Loader variant="inline" size="sm" text="Loading filters..." />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm min-w-0">
      <span className="text-muted-foreground font-medium whitespace-nowrap">Filter:</span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-card border border-border rounded-md hover:bg-muted/50 transition-colors font-medium text-foreground min-w-[100px] sm:min-w-[140px] justify-between text-xs sm:text-sm">
            <span className="truncate">
              {allChecked || selectedBanks.length === 0
                ? 'All Banks'
                : `${selectedBanks.length} selected`}
            </span>
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 sm:w-56 bg-card border border-border shadow-lg z-50">
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

      <div className="w-px h-3 sm:h-4 bg-border" />

      <Select value={selectedDuration} onValueChange={handleDurationChange}>
        <SelectTrigger className="w-32 sm:w-44 h-7 sm:h-9 bg-card border border-border hover:bg-muted/50 transition-colors font-medium text-xs sm:text-sm focus:ring-0 focus:ring-offset-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card border border-border shadow-lg z-50">
          {durationOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="hover:bg-muted/50 cursor-pointer text-xs sm:text-sm"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}