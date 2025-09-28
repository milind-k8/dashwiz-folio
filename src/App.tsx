import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { lazy, Suspense } from 'react';
import { PageLoader } from '@/components/ui/loader';
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const BanksPage = lazy(() => import('./pages/BanksPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
import { RootLayout } from '@/components/RootLayout';
import NotFound from "./pages/NotFound";

const App = () => {
  console.log("App component rendered");
  return (
  <ThemeProvider defaultTheme="system" storageKey="dashboard-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Suspense fallback={<PageLoader />}><AuthPage /></Suspense>} />
            <Route element={<RootLayout />}>
              <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
              <Route path="transactions" element={<Suspense fallback={<PageLoader />}><TransactionsPage /></Suspense>} />
              <Route path="banks" element={<Suspense fallback={<PageLoader />}><BanksPage /></Suspense>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;
