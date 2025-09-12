import { Search, Bell, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between p-6 bg-card border-b border-border">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search for transaction, user, etc"
            className="pl-10 bg-muted/50 border-0 focus:bg-card"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
        
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>
        
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary text-primary-foreground font-medium">
            JS
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}