import { useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function InlineFilters() {
  const [selectedBank, setSelectedBank] = useState('all-banks');
  const [selectedDuration, setSelectedDuration] = useState('current-month');

  const bankOptions = [
    { value: 'all-banks', label: 'All Banks' },
    { value: 'chase', label: 'Chase Bank' },
    { value: 'bofa', label: 'Bank of America' },
    { value: 'wells', label: 'Wells Fargo' },
    { value: 'citi', label: 'Citibank' },
    { value: 'capital', label: 'Capital One' }
  ];

  const durationOptions = [
    { value: 'current-month', label: 'Current Month' },
    { value: 'previous-month', label: 'Previous Month' },
    { value: 'previous-3-months', label: 'Previous 3 Months' },
    { value: 'previous-6-months', label: 'Previous 6 Months' }
  ];

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Filter:</span>
      
      <Select value={selectedBank} onValueChange={setSelectedBank}>
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

      <Select value={selectedDuration} onValueChange={setSelectedDuration}>
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