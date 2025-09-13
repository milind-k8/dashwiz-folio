import { LayoutDashboard, Receipt, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'banks', label: 'Banks', icon: Building },
];

interface BottomNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavbar({ activeTab, onTabChange }: BottomNavbarProps) {
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
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border px-4 py-2 safe-area-pb z-50" style={{ minHeight: 'var(--touch-target)' }}>
      <nav className="flex items-center">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`relative flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-colors duration-200 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}