import { ReactNode } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  pageTitle?: string;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background flex-col">
      <DashboardHeader activeTab={activeTab} onTabChange={onTabChange} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}