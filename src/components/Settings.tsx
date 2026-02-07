import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { GeminiAISettings } from './GeminiAISettings';
// import { EmailManagement } from './EmailManagement';
import { TimerSettings } from './settings/TimerSettings';
import { NotificationSettings } from './settings/NotificationSettings';
import { SmilePopupSettings } from './settings/SmilePopupSettings';
import { PrivacySettings } from './settings/PrivacySettings';

import { useSmilePopupSettings, useAppSettings } from '@/hooks/useChromeStorage';
import { useToast } from '@/hooks/use-toast';

export function Settings() {
  const { toast } = useToast();

  // Use Chrome storage hooks
  const {
    value: smilePopupSettings,
    setValue: setSmilePopupSettings,
    isLoading: smilePopupLoading,
    error: smilePopupError
  } = useSmilePopupSettings();

  const {
    value: appSettings,
    setValue: setAppSettings,
    isLoading: appSettingsLoading,
    error: appSettingsError
  } = useAppSettings();

  const updateSmilePopupSetting = <K extends keyof typeof smilePopupSettings>(
    key: K,
    value: typeof smilePopupSettings[K]
  ) => {
    const newSettings = {
      ...smilePopupSettings,
      [key]: value
    };
    setSmilePopupSettings(newSettings);
    // Settings auto-save with Chrome storage hooks
    toast({
      title: "Setting Updated",
      description: "Your preference has been saved automatically.",
    });
  };

  const updateAppSetting = <K extends keyof typeof appSettings>(
    key: K,
    value: typeof appSettings[K]
  ) => {
    const newSettings = {
      ...appSettings,
      [key]: value
    };
    setAppSettings(newSettings);
    // Settings auto-save with Chrome storage hooks
    toast({
      title: "Setting Updated",
      description: "Your preference has been saved automatically.",
    });
  };

  const resetToDefaults = async () => {
    try {
      await setSmilePopupSettings({
        enabled: true,
        showQuotes: true,
        showCelebration: true,
        customImage: '',
        animationIntensity: 'medium',
        quotesSource: 'motivational',
        autoClose: false,
        closeDelay: 5,
        showAsExternalWindow: false,
        windowWidth: 400,
        windowHeight: 300,
        enableSound: true,
        customSound: '',
      });

      await setAppSettings({
        theme: 'system',
        notifications: true,
        soundEnabled: true,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        privacy: {
          dataCollection: true,
          analytics: true,
        },
      });

      toast({
        title: "Settings reset",
        description: "All settings have been reset to defaults",
      });
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "Failed to reset settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (smilePopupLoading || appSettingsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show error state
  if (smilePopupError || appSettingsError) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Failed to load settings: {smilePopupError || appSettingsError}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Reload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-slate-400">Personalize your focus experience and manage preferences</p>
      </div>

      <Tabs defaultValue="timer" className="w-full space-y-6">
        <div className="relative">
          <TabsList className="w-full justify-start overflow-x-auto bg-[#1e293b]/50 p-1 rounded-full border border-white/5 backdrop-blur-xl">
            <TabsTrigger
              value="timer"
              className="rounded-full px-6 py-2.5 data-[state=active]:bg-[#2a2a40] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              Timer
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="rounded-full px-6 py-2.5 data-[state=active]:bg-[#2a2a40] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              AI
            </TabsTrigger>
            {/* Email Tab Removed */}
            <TabsTrigger
              value="notifications"
              className="rounded-full px-6 py-2.5 data-[state=active]:bg-[#2a2a40] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="smile"
              className="rounded-full px-6 py-2.5 data-[state=active]:bg-[#2a2a40] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              Smile Popup
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="rounded-full px-6 py-2.5 data-[state=active]:bg-[#2a2a40] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              Privacy
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Container - Box Design */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 border border-white/5 shadow-xl min-h-[500px]">
          {/* Decorative blur */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            {/* Timer Settings */}
            <TabsContent value="timer" className="space-y-6 mt-0">
              <TimerSettings appSettings={appSettings} updateAppSetting={updateAppSetting} />
            </TabsContent>

            {/* AI Settings */}
            <TabsContent value="ai" className="space-y-6 mt-0">
              <GeminiAISettings />
            </TabsContent>

            {/* Email Content Removed */}

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6 mt-0">
              <NotificationSettings appSettings={appSettings} updateAppSetting={updateAppSetting} />
            </TabsContent>

            {/* Smile Popup Settings */}
            <TabsContent value="smile" className="space-y-6 mt-0">
              <SmilePopupSettings
                smilePopupSettings={smilePopupSettings}
                updateSmilePopupSetting={updateSmilePopupSetting}
              />
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-6 mt-0">
              <PrivacySettings appSettings={appSettings} updateAppSetting={updateAppSetting} />
            </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* Settings Actions */}
      <div className="flex justify-end gap-3 items-center pt-2">
        <div className="flex items-center gap-2 text-sm text-slate-500 mr-auto">
          <Save className="h-4 w-4" />
          Settings auto-save as you change them
        </div>
        <Button
          variant="outline"
          onClick={resetToDefaults}
          className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
