import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';

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
  const activeTab = useMemo(() => pathToTab(location.pathname), [location.pathname]);
  const onTabChange = useCallback((tab: string) => navigate(tabToPath(tab)), [navigate]);

  return (
    <div className="flex min-h-screen w-full bg-background flex-col">
      <DashboardHeader activeTab={activeTab} onTabChange={onTabChange} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};


