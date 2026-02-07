import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { PreviewModeProvider, PreviewModeBanner } from "@/components/PreviewMode";
import { PreviewDashboard } from "@/components/PreviewDashboard";
import { Loader2 } from "lucide-react";

// Lazy load components
const PreviewPage = React.lazy(() => import("./pages/PreviewPage"));
const Index = React.lazy(() => import("./pages/Index"));
const ChromeExtensionMain = React.lazy(() => import("./pages/ChromeExtensionMain").then(m => ({ default: m.ChromeExtensionMain })));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage").then(m => ({ default: m.DashboardPage })));
const AuthenticatedDashboard = React.lazy(() => import("./components/AuthenticatedDashboard").then(m => ({ default: m.AuthenticatedDashboard })));
const ExternalSmilePopupPage = React.lazy(() => import("./pages/ExternalSmilePopupPage").then(m => ({ default: m.ExternalSmilePopupPage })));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  // Determine if we're in extension context or web development
  const isExtension = typeof window !== 'undefined' && (
    window.location.protocol === 'chrome-extension:' ||
    window.location.pathname.includes('.html') ||
    window.location.href.includes('chrome-extension://') ||
    (window as any).chrome?.runtime?.id
  );

  // Check for preview mode
  const isPreviewMode = typeof window !== 'undefined' && (
    window.location.search.includes('preview=true') ||
    localStorage.getItem('focusTimer_previewMode') === 'true'
  );

  // Use HashRouter for extension, BrowserRouter for web development
  const Router = isExtension ? HashRouter : BrowserRouter;



  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PreviewModeProvider>
          <ConvexClientProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <PreviewModeBanner />
              {isPreviewMode ? (
                <PreviewDashboard />
              ) : (
                <Router>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Chrome Extension Routes - Extension gets priority */}
                      {isExtension ? (
                        <>
                          {/* Main extension popup routes */}
                          <Route path="/" element={<ChromeExtensionMain />} />
                          <Route path="/index" element={<ChromeExtensionMain />} />

                          {/* Dashboard extension routes - Direct to authenticated dashboard, no freemium */}
                          <Route path="/dashboard" element={<AuthenticatedDashboard />} />
                          <Route path="/dashboard/*" element={<AuthenticatedDashboard />} />

                          {/* Full app extension routes */}
                          <Route path="/fullapp" element={<Index />} />
                          <Route path="/app" element={<Index />} />

                          {/* Utility extension routes */}
                          <Route path="/smile-popup" element={<ExternalSmilePopupPage />} />


                          {/* Fallback for extension */}
                          <Route path="*" element={<ChromeExtensionMain />} />
                        </>
                      ) : (
                        <>
                          {/* Web App Routes - Freemium Flow */}
                          <Route path="/" element={<Index />} />
                          <Route path="/app" element={<Index />} />
                          <Route path="/fullapp" element={<Index />} />
                          <Route path="/dashboard" element={<DashboardPage />} />
                          <Route path="/preview" element={<PreviewPage />} />

                          {/* Auth & Utility Routes */}
                          <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />

                          {/* 404 Catch-all - Must be last */}
                          <Route path="*" element={<NotFound />} />
                        </>
                      )}
                    </Routes>
                  </Suspense>
                </Router>
              )}
            </TooltipProvider>
          </ConvexClientProvider>
        </PreviewModeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
