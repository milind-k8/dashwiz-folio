import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  pageTitle?: string;
}

export function Layout({ children, activeTab, onTabChange, pageTitle }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
        <AppSidebar activeTab={activeTab} onTabChange={onTabChange} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader pageTitle={pageTitle} />
          
          <main className="flex-1 overflow-auto px-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}