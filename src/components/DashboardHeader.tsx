import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DashboardHeaderProps {
  pageTitle?: string;
}

export function DashboardHeader({ pageTitle = "Dashboard" }: DashboardHeaderProps) {
  return (
    <header className="flex items-center gap-4 p-3 sm:p-4 bg-card border-b border-border">
      <SidebarTrigger className="lg:hidden" />
      
      <div className="flex-1">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>
      
      <div className="flex items-center gap-2 lg:gap-4">
        <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Add Transaction</span>
        </Button>
        
        <ThemeToggle />
        
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary text-primary-foreground font-medium">
            JS
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}