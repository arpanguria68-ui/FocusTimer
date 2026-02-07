import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserService } from '@/services/userService'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { User, Settings, CheckCircle, Loader2 } from 'lucide-react'

export const UserProfileCreator: React.FC = () => {
  const { user } = useAuth()
  const [creating, setCreating] = useState(false)
  const [profileCreated, setProfileCreated] = useState(false)
  const [settingsCreated, setSettingsCreated] = useState(false)

  const createUserProfile = async () => {
    if (!user) return

    setCreating(true)
    try {
      // Create user profile
      await UserService.createUserProfile({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || undefined,
      })

      setProfileCreated(true)
      toast.success('User profile created successfully!')

      // Create default user settings
      await UserService.upsertUserSettings(user.id, {
        focus_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        sessions_until_long_break: 4,
        notifications_enabled: true,
        sound_enabled: true,
        theme: 'light',
      })

      setSettingsCreated(true)
      toast.success('User settings initialized successfully!')

      // Refresh the page after a short delay to show updated status
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error: any) {
      console.error('Profile creation error:', error)
      if (error.message?.includes('duplicate key')) {
        toast.success('Profile already exists! Refreshing status...')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error(`Failed to create profile: ${error.message}`)
      }
    } finally {
      setCreating(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Profile Setup</CardTitle>
        <CardDescription>
          Create your user profile and initialize default settings to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <User className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Profile Setup Required</strong></p>
              <p>Your account is authenticated, but we need to create your profile and settings in the database.</p>
              <p className="text-sm text-muted-foreground">
                This is a one-time setup that will enable all features like session tracking, task management, and personalized settings.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            {profileCreated ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">User Profile</p>
              <p className="text-sm text-muted-foreground">
                {profileCreated ? 'Profile created successfully!' : 'Create your user profile in the database'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {settingsCreated ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Settings className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Default Settings</p>
              <p className="text-sm text-muted-foreground">
                {settingsCreated ? 'Settings initialized successfully!' : 'Initialize default timer and app settings'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">What will be created:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• User profile with email: {user.email}</li>
            <li>• Default focus timer: 25 minutes</li>
            <li>• Short break: 5 minutes, Long break: 15 minutes</li>
            <li>• Notifications and sound enabled</li>
            <li>• Light theme as default</li>
          </ul>
        </div>

        <Button
          onClick={createUserProfile}
          disabled={creating || (profileCreated && settingsCreated)}
          className="w-full"
        >
          {creating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Profile...
            </>
          ) : profileCreated && settingsCreated ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Profile Setup Complete
            </>
          ) : (
            <>
              <User className="mr-2 h-4 w-4" />
              Create Profile & Settings
            </>
          )}
        </Button>

        {(profileCreated && settingsCreated) && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Setup Complete!</strong> Your profile and settings have been created. The page will refresh automatically to show your updated status.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}