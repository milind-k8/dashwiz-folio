import { LayoutDashboard, Receipt, Building, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'banks', label: 'Banks', icon: Building },
];

interface DashboardHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardHeader({ activeTab, onTabChange }: DashboardHeaderProps) {
  const navigate = useNavigate();

  const tabToPath = (tab: string): string => {
    switch (tab) {
      case 'transactions':
        return '/transactions';
      case 'banks':
        return '/banks';
      default:
        return '/';
    }
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    navigate(tabToPath(tab));
  };

  return (
    <header className="bg-background border-b border-border px-4 py-3">
      <div className="flex items-center justify-between w-full">
        {/* Brand Icon - Left */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">PisaWise</span>
        </div>

        {/* Navigation Items - Center */}
        <nav className="flex items-center gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                onClick={() => handleTabChange(item.id)}
                className="flex items-center gap-2 px-4 py-2"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* Theme Toggle - Right */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}