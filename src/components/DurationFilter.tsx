import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const durationOptions = [
  { value: 'current-month', label: 'Current Month' },
  { value: 'previous-month', label: 'Previous Month' },
  { value: 'previous-3-months', label: 'Previous 3 Months' },
  { value: 'previous-6-months', label: 'Previous 6 Months' }
];

export function DurationFilter() {
  const [selectedDuration, setSelectedDuration] = useState('current-month');

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Duration</h4>
        <Select value={selectedDuration} onValueChange={setSelectedDuration}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Select duration" />
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
    </Card>
  );
}