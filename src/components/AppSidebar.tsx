import { 
  LayoutDashboard, 
  Receipt, 
  Building, 
  IndianRupee,
  ChevronsLeft,
  ChevronsRight,
  Monitor
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
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useGlobalStore } from '@/store/globalStore';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'banks', label: 'Banks', icon: Building },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { open, setOpen } = useSidebar();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { refreshData, refreshing } = useGlobalStore();

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

  return (
    <Sidebar 
      className="border-r border-border data-[state=collapsed]:w-36"
      collapsible="icon"
    >
      <SidebarContent>
        <div className="p-4">
          <div className={`flex items-center ${open || isMobile ? 'justify-between' : 'justify-center'}`}>
            <button 
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              <div className={`${open || isMobile ? 'w-8 h-8' : 'w-6 h-6'} bg-gradient-primary rounded-lg flex items-center justify-center`}>
                <IndianRupee className={`${open || isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-white`} />
              </div>
              {(open || isMobile) && (
                <span className="text-xl font-bold text-foreground">PisaWise</span>
              )}
            </button>
            {!isMobile && (open || isMobile) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(!open)}
                className="h-6 w-6 p-0"
              >
                <ChevronsLeft className="w-3 h-3" />
              </Button>
            )}
          </div>
          {!isMobile && !open && (
            <div className="mt-2 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(!open)}
                className="h-6 w-6 p-0"
              >
                <ChevronsRight className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
        
        <SidebarGroup>
          {(open || isMobile) && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        onTabChange(item.id);
                        navigate(tabToPath(item.id));
                      }}
                      isActive={isActive}
                      className={`w-full h-10 ${(open || isMobile) ? 'justify-start px-3' : 'justify-center px-0'}`}
                      tooltip={!(open || isMobile) ? item.label : undefined}
                    >
                      <Icon className={`w-5 h-5 ${!(open || isMobile) ? 'mx-auto' : ''}`} />
                      {(open || isMobile) && <span className="ml-3">{item.label}</span>}
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