import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GlassTimer } from '@/components/GlassTimer';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModernAuth } from '@/components/auth/ModernAuth';

/**
 * Chrome Extension Main
 * 
 * Simple auth flow:
 * 1. Check if user is signed in via Clerk
 * 2. If yes → show timer
 * 3. If no → show simple auth options
 * 
 * No complex token syncing. User authenticates directly in extension.
 */
export function ChromeExtensionMain() {
  const { isSignedIn, loading, signIn, signUp } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="w-[400px] h-[600px] flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0f172a] to-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Not authenticated - show auth screen
  if (!isSignedIn) {
    return (
      <div className="w-[400px] h-[600px] overflow-hidden relative text-slate-100 font-sans">
        <ModernAuth />
      </div>
    );
  }

  // Authenticated - show timer
  return (
    <div className="w-[400px] h-[600px] overflow-hidden relative text-slate-100 font-sans">
      <GlassTimer />
    </div>
  );
}
