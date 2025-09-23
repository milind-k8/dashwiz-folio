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
import { useFinancialData } from '@/hooks/useFinancialData';
import { Loader } from '@/components/ui/loader';

interface InlineFiltersProps {
  onFiltersChange?: (banks: string[], duration: string) => void;
}

export function InlineFilters({ onFiltersChange }: InlineFiltersProps) {
  const [searchParams] = useSearchParams();
  const { availableBanks, isLoading } = useFinancialData();

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
    <div className="flex flex-row items-center gap-3 text-sm min-w-0 w-full">
      {/* Bank Filter - 50% width on mobile */}
      <div className="flex-1 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 bg-card/50 border border-border/50 rounded-lg hover:bg-muted/50 transition-all duration-200 font-medium text-foreground w-full justify-between text-sm backdrop-blur-sm">
              <span className="truncate">
                {allChecked || selectedBanks.length === 0
                  ? 'All Banks'
                  : `${selectedBanks.length} selected`}
              </span>
              <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl z-50">
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