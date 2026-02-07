import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';

interface NotificationSettingsProps {
    appSettings: any;
    updateAppSetting: (key: string, value: any) => void;
}

export function NotificationSettings({ appSettings, updateAppSetting }: NotificationSettingsProps) {
    return (
        <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Bell className="h-5 w-5" />
                Notification Settings
            </h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Desktop Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                            Show browser notifications for session changes
                        </p>
                    </div>
                    <Switch
                        checked={appSettings.notifications}
                        onCheckedChange={(checked) => updateAppSetting('notifications', checked)}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Sound Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                            Play sound when sessions start or end
                        </p>
                    </div>
                    <Switch
                        checked={appSettings.soundEnabled}
                        onCheckedChange={(checked) => updateAppSetting('soundEnabled', checked)}
                    />
                </div>
            </div>
        </Card>
    );
}
