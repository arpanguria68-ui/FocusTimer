import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { Loader2 } from "lucide-react";

// Lazy load components
const ChromeExtensionMain = React.lazy(() => import("./pages/ChromeExtensionMain").then(m => ({ default: m.ChromeExtensionMain })));
const AuthenticatedDashboard = React.lazy(() => import("./components/AuthenticatedDashboard").then(m => ({ default: m.AuthenticatedDashboard })));
const ExternalSmilePopupPage = React.lazy(() => import("./pages/ExternalSmilePopupPage").then(m => ({ default: m.ExternalSmilePopupPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  // Detect extension context
  const isExtension = typeof window !== 'undefined' && (
    window.location.protocol === 'chrome-extension:' ||
    window.location.href.includes('chrome-extension://')
  );

  // Use HashRouter for extension, BrowserRouter for web
  const Router = isExtension ? HashRouter : BrowserRouter;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConvexClientProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Router>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {isExtension ? (
                    // Extension Routes
                    <>
                      <Route path="/" element={<ChromeExtensionMain />} />
                      <Route path="/dashboard" element={<AuthenticatedDashboard />} />
                      <Route path="/smile-popup" element={<ExternalSmilePopupPage />} />
                      <Route path="*" element={<ChromeExtensionMain />} />
                    </>
                  ) : (
                    // Web Routes
                    <>
                      <Route path="/" element={<div>Web App Home</div>} />
                      <Route path="/dashboard" element={<AuthenticatedDashboard />} />
                      <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
                      <Route path="*" element={<div>404 - Page Not Found</div>} />
                    </>
                  )}
                </Routes>
              </Suspense>
            </Router>
          </TooltipProvider>
        </ConvexClientProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
