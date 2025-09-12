import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';

const pathToTab = (pathname: string): string => {
  if (pathname.startsWith('/analytics')) return 'analytics';
  if (pathname.startsWith('/wallet')) return 'wallet';
  if (pathname.startsWith('/investments')) return 'investments';
  if (pathname.startsWith('/cards')) return 'cards';
  if (pathname.startsWith('/goals')) return 'goals';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'dashboard';
};

const tabToPath = (tab: string): string => {
  switch (tab) {
    case 'analytics':
      return '/analytics';
    case 'wallet':
      return '/wallet';
    case 'investments':
      return '/investments';
    case 'cards':
      return '/cards';
    case 'goals':
      return '/goals';
    case 'settings':
      return '/settings';
    default:
      return '/';
  }
};

export const RootLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = useMemo(() => pathToTab(location.pathname), [location.pathname]);
  const onTabChange = useCallback((tab: string) => navigate(tabToPath(tab)), [navigate]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        <AppSidebar activeTab={activeTab} onTabChange={onTabChange} />
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <DashboardHeader pageTitle={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
          <main className="flex-1 overflow-auto px-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};


