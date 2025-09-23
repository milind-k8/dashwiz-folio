import { IndianRupee } from 'lucide-react';
import { NavUser } from '@/components/NavUser';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGlobalStore } from '@/store/globalStore';

interface DashboardHeaderProps {
  pageTitle?: string;
}

export function DashboardHeader({ pageTitle = "Dashboard" }: DashboardHeaderProps) {
  const isMobile = useIsMobile();
  const { refreshData, refreshing } = useGlobalStore();

  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 px-3 sm:px-4 h-16 bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">        
      {isMobile && (
        <button 
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center">
            <IndianRupee className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">PisaWise</span>
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