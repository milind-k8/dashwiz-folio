import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FileUploadModal } from '@/components/FileUploadModal';

interface DashboardHeaderProps {
  pageTitle?: string;
}

export function DashboardHeader({ pageTitle = "Dashboard" }: DashboardHeaderProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3 px-3 sm:px-4 py-2 bg-card/95 backdrop-blur-sm border-b border-border">
        <SidebarTrigger className="lg:hidden" />
        
        <div className="flex-1">
          <h1 className="text-base sm:text-lg font-semibold text-foreground">{pageTitle}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            className="flex h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
          
          <div className="border border-border rounded-md h-8">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <FileUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </>
  );
}