import { LayoutDashboard, Receipt, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'transactions', label: 'Transactions', icon: Receipt, path: '/transactions' },
  { id: 'banks', label: 'Banks', icon: Building, path: '/banks' },
];

interface BottomNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavbar({ activeTab, onTabChange }: BottomNavbarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around px-2 py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                navigate(item.path);
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-0 flex-1 transition-colors ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}