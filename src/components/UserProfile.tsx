import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import {
  useUserProfile,
  useUserStatistics,
  useUserAchievements,
  useUserPreferences
} from '@/hooks/useConvexQueries';
import { UserOverview } from './profile/UserOverview';
import { UserAchievements } from './profile/UserAchievements';
import { UserGoals } from './profile/UserGoals';
import { UserActivity } from './profile/UserActivity';

export function UserProfile() {
  // Data fetching hooks
  // We keep profile, statistics in the parent as they are used in the "Overview" which is the main tab
  // Achievements are also needed for the overview summary
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: statistics, isLoading: statsLoading } = useUserStatistics();
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements();
  const { data: preferences } = useUserPreferences();

  if (profileLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 glass">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <UserOverview
            profile={profile}
            statistics={statistics}
            preferences={preferences}
            achievements={achievements}
          />
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <UserAchievements />
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <UserGoals />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <UserActivity />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Profile Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Profile Visibility</p>
                  <p className="text-sm text-muted-foreground">Control who can see your profile</p>
                </div>
                <Badge variant="outline">{preferences?.profile_public ? 'public' : 'private'}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Onboarding Status</p>
                  <p className="text-sm text-muted-foreground">Complete setup process</p>
                </div>
                <Badge variant={profile?.onboarding_completed ? "secondary" : "outline"}>
                  {profile?.onboarding_completed ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Last Active</p>
                  <p className="text-sm text-muted-foreground">When you last used the app</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {statistics?.last_session_date ? new Date(statistics.last_session_date).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
