import { IndianRupee, Loader2 } from 'lucide-react';
import { NavUser } from '@/components/NavUser';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGlobalStore } from '@/store/globalStore';
import { useGlobalData } from '@/hooks/useGlobalData';

interface DashboardHeaderProps {
  pageTitle?: string;
}

export function DashboardHeader({ pageTitle = "Dashboard" }: DashboardHeaderProps) {
  const isMobile = useIsMobile();
  const { refreshData, refreshing } = useGlobalStore();

  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 px-3 sm:px-4 h-14 bg-card border-b border-border">        
      {isMobile && (
        <button 
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          <span className="text-2xl font-bold text-foreground font-google tracking-tight">
            Mona<span className="text-primary">ro</span>
          </span>
        </button>
      )}
      
      <div className="flex-1">
        {!isMobile && (
          <h1 className="text-base sm:text-lg font-semibold text-foreground">{pageTitle}</h1>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <NavUser />
      </div>
    </header>
  );
}