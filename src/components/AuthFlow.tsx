import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserService } from '@/services/userService';
import { ModernAuth } from '@/components/auth/ModernAuth'; // New premium component
import { OnboardingWizard } from './OnboardingWizard';
import { UserProfileCreator } from './UserProfileCreator';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

type AuthFlowState =
  | 'loading'
  | 'auth'
  | 'onboarding'
  | 'profile-setup'
  | 'complete';

interface AuthFlowProps {
  onComplete?: () => void;
}

export function AuthFlow({ onComplete }: AuthFlowProps) {
  const { user, loading: authLoading } = useAuth();
  const [flowState, setFlowState] = useState<AuthFlowState>('loading');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (authLoading) return;

      if (!user) {
        setFlowState('auth'); // Unified auth state
        return;
      }

      try {
        // Check if user profile exists
        const profile = await UserService.getUserProfile(user.id);
        setUserProfile(profile);

        if (!profile) {
          // No profile exists - need onboarding
          setFlowState('onboarding');
        } else if (!profile.onboarding_completed) {
          // Profile exists but onboarding not completed
          setFlowState('onboarding');
        } else {
          // Profile exists and onboarding completed
          setFlowState('complete');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        // If there's an error, assume we need to create profile
        setFlowState('profile-setup');
      }
    };

    checkUserStatus();
  }, [user, authLoading]);

  const handleOnboardingComplete = () => {
    setFlowState('complete');
    onComplete?.();
  };

  // Loading state
  if (flowState === 'loading' || authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black">
        <Card className="glass border-slate-700/50 bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <img src="/logo.svg" alt="Focus Timer" className="w-16 h-16 mb-4 animate-pulse" />
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-slate-400">Initializing workspace...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authentication complete - user is ready to use the app
  if (flowState === 'complete') {
    onComplete?.();
    return null; // Let the main app render
  }

  return (
    <>
      {/* Modern Premium Authentication */}
      {flowState === 'auth' && (
        <ModernAuth onComplete={() => {/* flow handled by useEffect */ }} />
      )}

      {flowState === 'onboarding' && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}

      {flowState === 'profile-setup' && (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-950">
          <UserProfileCreator />
        </div>
      )}
    </>
  );
}
