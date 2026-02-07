import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GlassTimer } from '@/components/GlassTimer';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <div className="w-[400px] h-[600px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#0f172a] to-black text-white p-6">
        {/* Logo */}
        <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Focus Timer</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">
          Sign in to sync your sessions across devices
        </p>

        {/* Sign In Button */}
        <Button
          onClick={() => signIn()}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl mb-3"
        >
          Sign In
        </Button>

        {/* Sign Up Button */}
        <Button
          onClick={() => window.open('https://focus-timer-green.vercel.app', '_blank')}
          variant="outline"
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
        >
          Create Account (Web App)
        </Button>

        <p className="text-xs text-slate-500 mt-6 text-center">
          Already signed in on web?<br />
          Use the same email/password here
        </p>
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
