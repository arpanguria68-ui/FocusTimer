import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Timer } from 'lucide-react';

interface TimerSettingsProps {
    appSettings: any;
    updateAppSetting: (key: string, value: any) => void;
}

export function TimerSettings({ appSettings, updateAppSetting }: TimerSettingsProps) {
    return (
        <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Timer className="h-5 w-5" />
                Timer Behavior
            </h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Auto-start Breaks</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically start breaks after focus sessions
                        </p>
                    </div>
                    <Switch
                        checked={appSettings.autoStartBreaks}
                        onCheckedChange={(checked) => updateAppSetting('autoStartBreaks', checked)}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Auto-start Pomodoros</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically start focus sessions after breaks
                        </p>
                    </div>
                    <Switch
                        checked={appSettings.autoStartPomodoros}
                        onCheckedChange={(checked) => updateAppSetting('autoStartPomodoros', checked)}
                    />
                </div>
            </div>
        </Card>
    );
}
