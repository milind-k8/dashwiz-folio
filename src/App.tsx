import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { lazy, Suspense } from 'react';
import { PageLoader } from '@/components/ui/loader';
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const InvestmentsPage = lazy(() => import('./pages/InvestmentsPage'));
const CardsPage = lazy(() => import('./pages/CardsPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
import { RootLayout } from '@/components/RootLayout';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="dashboard-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* No redirects needed here */}
            <Route element={<RootLayout />}>
              <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
              <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>} />
              <Route path="wallet" element={<Suspense fallback={<PageLoader />}><WalletPage /></Suspense>} />
              <Route path="investments" element={<Suspense fallback={<PageLoader />}><InvestmentsPage /></Suspense>} />
              <Route path="cards" element={<Suspense fallback={<PageLoader />}><CardsPage /></Suspense>} />
              <Route path="goals" element={<Suspense fallback={<PageLoader />}><GoalsPage /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
