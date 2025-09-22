import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BottomNavbar } from '@/components/BottomNavbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGlobalData } from '@/hooks/useGlobalData';

const pathToTab = (pathname: string): string => {
  if (pathname.startsWith('/transactions')) return 'transactions';
  if (pathname.startsWith('/banks')) return 'banks';
  return 'dashboard';
};

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

export const RootLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const activeTab = useMemo(() => pathToTab(location.pathname), [location.pathname]);
  const onTabChange = useCallback((tab: string) => navigate(tabToPath(tab)), [navigate]);
  
  // Initialize global data
  useGlobalData();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        {!isMobile && <AppSidebar activeTab={activeTab} onTabChange={onTabChange} />}
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <DashboardHeader pageTitle={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
          <main className={`flex-1 overflow-auto px-0 ${isMobile ? 'pb-16' : ''}`}>
            <Outlet />
          </main>
        </div>
        <BottomNavbar activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </SidebarProvider>
  );
};


