import React, { useState, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useConvexQueries';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TimerSettingsProps {
  settings: {
    focusTime: number;
    breakTime: number;
    longBreakTime: number;
    sessionsUntilLongBreak: number;
  };
  onSettingsChange: (settings: any) => void;
  onClose: () => void;
}

export function TimerSettings({ settings, onSettingsChange, onClose }: TimerSettingsProps) {
  const { user } = useAuth();
  const { data: userSettings } = useUserSettings();
  const updateSettings = useUpdateUserSettings();

  const [tempSettings, setTempSettings] = useState({
    focusTime: Math.floor(settings.focusTime / 60),
    breakTime: Math.floor(settings.breakTime / 60),
    longBreakTime: Math.floor(settings.longBreakTime / 60),
    sessionsUntilLongBreak: settings.sessionsUntilLongBreak,
  });

  // Load current user settings when available
  useEffect(() => {
    if (userSettings) {
      setTempSettings({
        focusTime: userSettings.focus_duration || 25,
        breakTime: userSettings.short_break_duration || 5,
        longBreakTime: userSettings.long_break_duration || 15,
        sessionsUntilLongBreak: userSettings.sessions_until_long_break || 4,
      });
    }
  }, [userSettings]);

  const handleSave = async () => {
    const newSettings = {
      focusTime: tempSettings.focusTime * 60,
      breakTime: tempSettings.breakTime * 60,
      longBreakTime: tempSettings.longBreakTime * 60,
      sessionsUntilLongBreak: tempSettings.sessionsUntilLongBreak,
    };

    // Save to database if user is logged in
    if (user) {
      try {
        await updateSettings.mutateAsync({
          focus_duration: tempSettings.focusTime,
          short_break_duration: tempSettings.breakTime,
          long_break_duration: tempSettings.longBreakTime,
          sessions_until_long_break: tempSettings.sessionsUntilLongBreak,
        });
        toast.success('Timer settings saved successfully!');
      } catch (error) {
        toast.error('Failed to save settings to database');
        console.error('Settings save error:', error);
      }
    } else {
      toast.success('Timer settings updated! (Login to save permanently)');
    }

    // Apply settings to timer
    onSettingsChange(newSettings);

    // Trigger custom event for other components
    window.dispatchEvent(new CustomEvent('timerSettingsChanged', {
      detail: newSettings
    }));

    onClose();
  };

  const handleReset = () => {
    setTempSettings({
      focusTime: 25,
      breakTime: 5,
      longBreakTime: 15,
      sessionsUntilLongBreak: 4,
    });
  };

  const handleInputChange = (field: string, value: number) => {
    setTempSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="glass w-full max-w-md p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Timer Settings</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-8 w-8"
              title="Reset to defaults"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="focusTime" className="text-foreground">
              Focus Time (minutes)
            </Label>
            <Input
              id="focusTime"
              type="number"
              min="1"
              max="120"
              value={tempSettings.focusTime}
              onChange={(e) => handleInputChange('focusTime', parseInt(e.target.value) || 25)}
              className="glass"
            />
            <p className="text-xs text-muted-foreground">Recommended: 25 minutes</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breakTime" className="text-foreground">
              Short Break (minutes)
            </Label>
            <Input
              id="breakTime"
              type="number"
              min="1"
              max="30"
              value={tempSettings.breakTime}
              onChange={(e) => handleInputChange('breakTime', parseInt(e.target.value) || 5)}
              className="glass"
            />
            <p className="text-xs text-muted-foreground">Recommended: 5 minutes</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="longBreakTime" className="text-foreground">
              Long Break (minutes)
            </Label>
            <Input
              id="longBreakTime"
              type="number"
              min="5"
              max="60"
              value={tempSettings.longBreakTime}
              onChange={(e) => handleInputChange('longBreakTime', parseInt(e.target.value) || 15)}
              className="glass"
            />
            <p className="text-xs text-muted-foreground">Recommended: 15-30 minutes</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionsUntilLongBreak" className="text-foreground">
              Sessions until Long Break
            </Label>
            <Input
              id="sessionsUntilLongBreak"
              type="number"
              min="2"
              max="8"
              value={tempSettings.sessionsUntilLongBreak}
              onChange={(e) => handleInputChange('sessionsUntilLongBreak', parseInt(e.target.value) || 4)}
              className="glass"
            />
            <p className="text-xs text-muted-foreground">Recommended: 4 sessions</p>
          </div>
        </div>

        {!user && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Login to save settings permanently. Changes will be temporary otherwise.
            </p>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="timer"
            onClick={handleSave}
            className="flex-1"
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </Card>
    </div>
  );
}