import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'page' | 'inline' | 'overlay';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8'
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

export function Loader({ 
  size = 'md', 
  variant = 'inline', 
  text = 'Loading...',
  className 
}: LoaderProps) {
  if (variant === 'page') {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[200px] p-8",
        className
      )}>
        <div className="relative">
          <Loader2 className={cn(
            "animate-spin text-primary",
            sizeClasses[size]
          )} />
        </div>
        {text && (
          <p className={cn(
            "mt-4 text-muted-foreground font-medium animate-pulse",
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className={cn(
        "absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg",
        className
      )}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={cn(
            "animate-spin text-primary",
            sizeClasses[size]
          )} />
          {text && (
            <p className={cn(
              "text-muted-foreground font-medium",
              textSizeClasses[size]
            )}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // inline variant
  return (
    <div className={cn(
      "flex items-center gap-2",
      className
    )}>
      <Loader2 className={cn(
        "animate-spin text-primary",
        sizeClasses[size]
      )} />
      {text && (
        <span className={cn(
          "text-muted-foreground",
          textSizeClasses[size]
        )}>
          {text}
        </span>
      )}
    </div>
  );
}

// Specialized loaders for common use cases
export function PageLoader({ text = "", className }: { text?: string; className?: string }) {
  return <Loader variant="page" size="lg" text={text} className={cn("min-h-screen", className)} />;
}

export function TableLoader({ text = "Loading data..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader variant="inline" text={text} />
    </div>
  );
}

export function ButtonLoader({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <Loader2 className={cn(
      "animate-spin",
      sizeClasses[size]
    )} />
  );
}