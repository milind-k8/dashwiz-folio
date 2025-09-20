import { useState } from 'react';
import { Plus, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FileUploadModal } from '@/components/FileUploadModal';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardHeaderProps {
  pageTitle?: string;
}

export function DashboardHeader({ pageTitle = "Dashboard" }: DashboardHeaderProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center gap-3 px-3 sm:px-4 py-2 bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">        
        {isMobile && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">PisaWise</span>
          </div>
        )}
        
        <div className="flex-1">
          {!isMobile && (
            <h1 className="text-base sm:text-lg font-semibold text-foreground">{pageTitle}</h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <FileUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </>
  );
}