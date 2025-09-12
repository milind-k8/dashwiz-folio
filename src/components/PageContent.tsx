import { ReactNode } from 'react';

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className = "" }: PageContentProps) {
  return (
    <div className={`p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in max-w-full ${className}`}>
      {children}
    </div>
  );
}

interface ComingSoonPageProps {
  title: string;
  description?: string;
}

export function ComingSoonPage({ title, description = "This section is coming soon!" }: ComingSoonPageProps) {
  return (
    <PageContent>
      <div className="text-center py-12">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </PageContent>
  );
}