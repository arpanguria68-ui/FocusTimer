import React from 'react';
import { useAuth, SignIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Dashboard } from './Dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModernAuth } from './auth/ModernAuth';

export function AuthenticatedDashboard() {
  const { isSignedIn, isLoaded } = useAuth();

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-xl">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Timer className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Focus Timer Dashboard</h1>
              <p className="text-gray-500">Sign in to access your productivity stats</p>
            </div>

            <SignedOut>
              <ModernAuth />
            </SignedOut>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}