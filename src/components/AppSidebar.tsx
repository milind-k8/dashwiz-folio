import { 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  PieChart, 
  Settings, 
  CreditCard,
  Target,
  IndianRupee,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'investments', label: 'Investments', icon: PieChart },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { open, setOpen } = useSidebar();

  return (
    <Sidebar 
      className="border-r border-border"
      collapsible="icon"
    >
      <SidebarContent>
        <div className="p-4">
          <div className={`flex items-center ${open ? 'gap-3' : 'justify-center'}`}>
            <div className={`${open ? 'w-8 h-8' : 'w-6 h-6'} bg-gradient-primary rounded-lg flex items-center justify-center`}>
              <IndianRupee className={`${open ? 'w-5 h-5' : 'w-4 h-4'} text-white`} />
            </div>
            {open && (
              <span className="text-xl font-bold text-foreground">PisaWise</span>
            )}
          </div>
          <div className="mt-3 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(!open)}
              className="h-6 w-6 p-0"
            >
              {open ? (
                <ChevronLeft className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
        
        <SidebarGroup>
          {open && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive}
                      className={`w-full h-10 ${open ? 'justify-start px-3' : 'justify-center px-0'}`}
                      tooltip={!open ? item.label : undefined}
                    >
                      <Icon className={`w-5 h-5 ${!open ? 'mx-auto' : ''}`} />
                      {open && <span className="ml-3">{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}