import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface Bank {
  id: string;
  name: string;
  logo?: string;
}

const availableBanks: Bank[] = [
  { id: 'chase', name: 'Chase Bank' },
  { id: 'bofa', name: 'Bank of America' },
  { id: 'wells', name: 'Wells Fargo' },
  { id: 'citi', name: 'Citibank' },
  { id: 'capital', name: 'Capital One' }
];

export function CardFilter() {
  const [selectedBanks, setSelectedBanks] = useState<string[]>(
    availableBanks.map(bank => bank.id)
  );

  const handleBankToggle = (bankId: string) => {
    setSelectedBanks(prev => 
      prev.includes(bankId)
        ? prev.filter(id => id !== bankId)
        : [...prev, bankId]
    );
  };

  const clearAll = () => setSelectedBanks([]);
  const selectAll = () => setSelectedBanks(availableBanks.map(bank => bank.id));

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-foreground">Bank Cards</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <span className="text-xs">
                {selectedBanks.length === availableBanks.length 
                  ? 'All Banks' 
                  : `${selectedBanks.length} Selected`
                }
              </span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Select Banks</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex gap-2 px-2 py-1">
              <Button variant="ghost" size="sm" onClick={selectAll} className="h-6 text-xs">
                All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-xs">
                None
              </Button>
            </div>
            <DropdownMenuSeparator />
            {availableBanks.map((bank) => (
              <DropdownMenuCheckboxItem
                key={bank.id}
                checked={selectedBanks.includes(bank.id)}
                onCheckedChange={() => handleBankToggle(bank.id)}
              >
                {bank.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {selectedBanks.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedBanks.map((bankId) => {
            const bank = availableBanks.find(b => b.id === bankId);
            return bank ? (
              <Badge key={bankId} variant="secondary" className="text-xs">
                {bank.name}
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </Card>
  );
}