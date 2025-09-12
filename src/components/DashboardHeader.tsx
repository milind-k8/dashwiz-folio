import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DashboardHeaderProps {
  pageTitle?: string;
}

export function DashboardHeader({ pageTitle = "Dashboard" }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 px-3 sm:px-4 py-2 bg-card/95 backdrop-blur-sm border-b border-border">
      <SidebarTrigger className="lg:hidden" />
      
      <div className="flex-1">
        <h1 className="text-base sm:text-lg font-semibold text-foreground">{pageTitle}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2 flex h-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
          <Plus className="w-3 h-3" />
          <span className="text-sm hidden sm:inline">Add Transaction</span>
          <span className="text-sm sm:hidden">Add</span>
        </Button>
        
        <div className="border border-border rounded-md h-8">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}