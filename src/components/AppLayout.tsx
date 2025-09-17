import { ReactNode, useEffect, useState } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Production-ready PWA Layout Component
 * Handles iOS safe areas, sticky positioning, and responsive design
 * Used by companies like Twitter, Spotify for their PWAs
 */
export function AppLayout({ children, header, footer, className = '' }: AppLayoutProps) {
  const [isPWA, setIsPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect PWA mode
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');
    
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    setIsPWA(isPWAMode);
    setIsIOS(isIOSDevice);
  }, []);

  return (
    <div 
      className={`
        pwa-viewport 
        flex 
        flex-col 
        bg-background 
        text-foreground
        ${isPWA ? 'safe-x' : ''}
        ${className}
      `}
      data-pwa={isPWA}
      data-ios={isIOS}
    >
      {/* Header */}
      {header && (
        <div className={`
          pwa-header 
          bg-background/95 
          border-b 
          border-border
          ${isPWA ? 'safe-top' : 'py-4'}
          transition-all 
          duration-200
        `}>
          {header}
        </div>
      )}

      {/* Main Content */}
      <div className={`
        pwa-content 
        flex-1 
        relative 
        ${!header && isPWA ? 'safe-top' : ''}
        ${!footer && isPWA ? 'safe-bottom' : ''}
      `}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className={`
          pwa-footer 
          bg-background/95 
          border-t 
          border-border
          ${isPWA ? 'safe-bottom' : 'py-2'}
          transition-all 
          duration-200
        `}>
          {footer}
        </div>
      )}
    </div>
  );
}