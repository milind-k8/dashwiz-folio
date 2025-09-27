import { 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  PieChart, 
  Settings, 
  CreditCard,
  Target
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'investments', label: 'Investments', icon: PieChart },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-card border-r border-border h-screen p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-8 p-2">
        <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-foreground">Dashboard</span>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-card'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}