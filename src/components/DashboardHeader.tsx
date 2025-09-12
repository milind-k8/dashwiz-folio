import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DashboardHeaderProps {
  pageTitle?: string;
}

export function DashboardHeader({ pageTitle = "Dashboard" }: DashboardHeaderProps) {
  return (
    <header className="flex items-center gap-4 p-4 lg:p-6 bg-card border-b border-border">
      <SidebarTrigger className="lg:hidden" />
      
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>
      
      <div className="flex items-center gap-2 lg:gap-4">
        <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Add Transaction</span>
        </Button>
        
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
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