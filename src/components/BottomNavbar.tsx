import { LayoutDashboard, Receipt, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const menuItems = [
  { id: 'transactions', label: 'Transactions', icon: Receipt, path: '/transactions' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
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
    <div className="fixed pb-2 bottom-0 left-0 right-0 z-50 bg-card border-t border-border ios-pwa-bottom h-20">
      <div className="flex items-center justify-around px-1 h-full">
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
              className={`flex flex-col items-center justify-center p-1 rounded-lg min-w-0 flex-1 transition-colors relative ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              } ${isActive ? 'before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-6 before:h-0.5 before:bg-primary before:rounded-b' : ''}`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}