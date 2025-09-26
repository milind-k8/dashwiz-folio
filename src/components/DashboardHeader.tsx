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
  const { autoProcessing } = useGlobalData();

  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 px-3 sm:px-4 h-14 bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">        
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
        {autoProcessing && (
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            <span className="text-xs text-primary font-medium">Processing transactions...</span>
          </div>
        )}
        <NavUser />
      </div>
    </header>
  );
}