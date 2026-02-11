import React from 'react';
import { Dashboard } from './Dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModernAuth } from './auth/ModernAuth';
import { useUniversalAuthContext } from '@/contexts/UniversalAuthContext';

export function AuthenticatedDashboard() {
  const { isSignedIn, isLoaded } = useUniversalAuthContext();

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Timer className="w-16 h-16 mb-4 text-primary animate-pulse" />
            <p className="text-muted-foreground">Loading Dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated - show full dashboard
  if (isSignedIn) {
    return <Dashboard />;
  }

  // User is not authenticated - show Clerk Sign In
  // User is not authenticated - show ModernAuth directly (it handles its own layout)
  return <ModernAuth />;
}