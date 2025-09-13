import { LayoutDashboard, Receipt, Building, IndianRupee } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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

        {/* Navigation Items - Center (Hidden on mobile) */}
        {!isMobile && (
          <nav className="flex items-center">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`relative flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200 hover:text-primary ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Spacer for mobile to push theme toggle to right */}
        {isMobile && <div className="flex-1" />}

        {/* Theme Toggle - Right */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}