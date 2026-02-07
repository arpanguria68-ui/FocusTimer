import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timer, Save, RotateCcw, Loader2 } from 'lucide-react';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useConvexQueries';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function TimerDurationSettings() {
  const { user } = useAuth();
  const { data: userSettings, isLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();

  const [settings, setSettings] = useState({
    focus_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    sessions_until_long_break: 4,
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Load settings when data is available
  useEffect(() => {
    if (userSettings) {
      setSettings({
        focus_duration: userSettings.focus_duration || 25,
        short_break_duration: userSettings.short_break_duration || 5,
        long_break_duration: userSettings.long_break_duration || 15,
        sessions_until_long_break: userSettings.sessions_until_long_break || 4,
      });
      setHasChanges(false);
    }
  }, [userSettings]);

  const handleInputChange = (field: keyof typeof settings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please login to save settings');
      return;
    }

    try {
      await updateSettings.mutateAsync(settings);
      setHasChanges(false);
      toast.success('Timer settings saved successfully!');

      // Trigger a custom event to notify timer components
      window.dispatchEvent(new CustomEvent('timerSettingsChanged', {
        detail: settings
      }));
    } catch (error) {
      toast.error('Failed to save timer settings');
      console.error('Settings save error:', error);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      focus_duration: 25,
      short_break_duration: 5,
      long_break_duration: 15,
      sessions_until_long_break: 4,
    };
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card className="glass p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Timer className="h-5 w-5" />
          Timer Durations
        </h3>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="timer"
              size="sm"
              onClick={handleSave}
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="focus_duration" className="text-foreground">
            Focus Time (minutes)
          </Label>
          <Input
            id="focus_duration"
            type="number"
            min="1"
            max="120"
            value={settings.focus_duration}
            onChange={(e) => handleInputChange('focus_duration', parseInt(e.target.value) || 25)}
            className="glass"
          />
          <p className="text-xs text-muted-foreground">
            Recommended: 25 minutes (Pomodoro standard)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="short_break_duration" className="text-foreground">
            Short Break (minutes)
          </Label>
          <Input
            id="short_break_duration"
            type="number"
            min="1"
            max="30"
            value={settings.short_break_duration}
            onChange={(e) => handleInputChange('short_break_duration', parseInt(e.target.value) || 5)}
            className="glass"
          />
          <p className="text-xs text-muted-foreground">
            Recommended: 5 minutes
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="long_break_duration" className="text-foreground">
            Long Break (minutes)
          </Label>
          <Input
            id="long_break_duration"
            type="number"
            min="5"
            max="60"
            value={settings.long_break_duration}
            onChange={(e) => handleInputChange('long_break_duration', parseInt(e.target.value) || 15)}
            className="glass"
          />
          <p className="text-xs text-muted-foreground">
            Recommended: 15-30 minutes
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sessions_until_long_break" className="text-foreground">
            Sessions until Long Break
          </Label>
          <Input
            id="sessions_until_long_break"
            type="number"
            min="2"
            max="8"
            value={settings.sessions_until_long_break}
            onChange={(e) => handleInputChange('sessions_until_long_break', parseInt(e.target.value) || 4)}
            className="glass"
          />
          <p className="text-xs text-muted-foreground">
            Recommended: 4 sessions (classic Pomodoro)
          </p>
        </div>
      </div>

      {!user && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Please login to save your timer settings. Changes will be lost when you refresh the page.
          </p>
        </div>
      )}

      {hasChanges && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            You have unsaved changes. Click "Save" to apply your new timer settings.
          </p>
        </div>
      )}
    </Card>
  );
}