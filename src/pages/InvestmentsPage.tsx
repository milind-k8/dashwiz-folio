import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';

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

const InvestmentsPage = () => {
  return <div className="p-6 text-sm text-muted-foreground">Investments page coming soon.</div>;
};

export default InvestmentsPage;


