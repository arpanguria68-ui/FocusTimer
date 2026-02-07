import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Smile, Sparkles } from 'lucide-react';
import { ImageUpload } from '../ImageUpload';
import { AudioUpload } from './AudioUpload';
import { toast } from 'sonner';

interface SmilePopupSettingsProps {
    smilePopupSettings: any;
    updateSmilePopupSetting: (key: string, value: any) => void;
}

export function SmilePopupSettings({ smilePopupSettings, updateSmilePopupSetting }: SmilePopupSettingsProps) {
    return (
        <Card className="glass p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Smile className="h-5 w-5 text-primary" />
                Smile Popup Configuration
            </h3>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Enable Smile Popup</Label>
                        <p className="text-sm text-muted-foreground">
                            Show celebration popup when sessions complete
                        </p>
                    </div>
                    <Switch
                        checked={smilePopupSettings.enabled}
                        onCheckedChange={(checked) => updateSmilePopupSetting('enabled', checked)}
                    />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <div>
                        <Label>Show Motivational Quotes</Label>
                        <p className="text-sm text-muted-foreground">
                            Display inspirational quotes in popup
                        </p>
                    </div>
                    <Switch
                        checked={smilePopupSettings.showQuotes}
                        onCheckedChange={(checked) => updateSmilePopupSetting('showQuotes', checked)}
                        disabled={!smilePopupSettings.enabled}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <Label>Celebration Effects</Label>
                        <p className="text-sm text-muted-foreground">
                            Enable floating sparkles and animations
                        </p>
                    </div>
                    <Switch
                        checked={smilePopupSettings.showCelebration}
                        onCheckedChange={(checked) => updateSmilePopupSetting('showCelebration', checked)}
                        disabled={!smilePopupSettings.enabled}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <Label>Notification Sound</Label>
                        <p className="text-sm text-muted-foreground">
                            Play audio when popup appears
                        </p>
                    </div>
                    <Switch
                        checked={smilePopupSettings.enableSound}
                        onCheckedChange={(checked) => updateSmilePopupSetting('enableSound', checked)}
                        disabled={!smilePopupSettings.enabled}
                    />
                </div>

                {smilePopupSettings.enableSound && (
                    <AudioUpload
                        currentAudio={smilePopupSettings.customSound}
                        onAudioChange={(audioData) => updateSmilePopupSetting('customSound', audioData)}
                        disabled={!smilePopupSettings.enabled}
                        maxSizeKB={2048} // 2MB limit
                    />
                )}

                <Separator />

                <Separator />

                <ImageUpload
                    currentImage={smilePopupSettings.customImage}
                    onImageChange={(imageData) => updateSmilePopupSetting('customImage', imageData)}
                    disabled={!smilePopupSettings.enabled}
                    maxSizeKB={100}
                />

                <div className="space-y-3">
                    <Label>Animation Intensity</Label>
                    <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as const).map((intensity) => (
                            <Button
                                key={intensity}
                                variant={smilePopupSettings.animationIntensity === intensity ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateSmilePopupSetting('animationIntensity', intensity)}
                                disabled={!smilePopupSettings.enabled}
                                className="capitalize"
                            >
                                <Sparkles className="mr-1 h-3 w-3" />
                                {intensity}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Quotes Source</Label>
                    <div className="flex gap-2">
                        {(['motivational', 'productivity', 'custom'] as const).map((source) => (
                            <Button
                                key={source}
                                variant={smilePopupSettings.quotesSource === source ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateSmilePopupSetting('quotesSource', source)}
                                disabled={!smilePopupSettings.enabled || !smilePopupSettings.showQuotes}
                                className="capitalize"
                            >
                                {source}
                            </Button>
                        ))}
                    </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <div>
                        <Label>Show as External Window</Label>
                        <p className="text-sm text-muted-foreground">
                            Open celebration popup as a separate mini window outside Chrome
                        </p>
                    </div>
                    <Switch
                        checked={smilePopupSettings.showAsExternalWindow}
                        onCheckedChange={(checked) => updateSmilePopupSetting('showAsExternalWindow', checked)}
                        disabled={!smilePopupSettings.enabled}
                    />
                </div>

                {/* Test button for external popup */}
                {smilePopupSettings.showAsExternalWindow && (
                    <div className="mt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const width = smilePopupSettings.windowWidth || 400;
                                const height = smilePopupSettings.windowHeight || 300;
                                const left = Math.round((screen.width - width) / 2);
                                const top = Math.round((screen.height - height) / 2);

                                if (typeof chrome !== 'undefined' && chrome.windows) {
                                    const url = chrome.runtime.getURL('smile-popup.html?sessionType=focus&sessionCount=1');
                                    chrome.windows.create({
                                        url,
                                        type: 'popup',
                                        width,
                                        height,
                                        left,
                                        top,
                                        focused: true,
                                    }, (window) => {
                                        if (chrome.runtime.lastError) {
                                            toast.error(chrome.runtime.lastError.message);
                                        } else {
                                            toast.success("External popup window opened!");
                                        }
                                    });
                                } else {
                                    toast.error("Windows API not accessible in this environment");
                                }
                            }}
                        >
                            Test External Popup
                        </Button>
                    </div>
                )}

                {smilePopupSettings.showAsExternalWindow && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Window Width (px)</Label>
                            <Input
                                type="number"
                                min="300"
                                max="800"
                                value={smilePopupSettings.windowWidth || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow any input during typing - no validation/clamping
                                    if (value === '') {
                                        updateSmilePopupSetting('windowWidth', '');
                                    } else {
                                        // Store the raw input value to allow natural typing
                                        updateSmilePopupSetting('windowWidth', value);
                                    }
                                }}
                                onBlur={(e) => {
                                    const value = e.target.value;
                                    if (!value) {
                                        updateSmilePopupSetting('windowWidth', 400);
                                    } else {
                                        const numValue = parseInt(value);
                                        if (isNaN(numValue) || numValue < 300) {
                                            updateSmilePopupSetting('windowWidth', 400);
                                        } else if (numValue > 800) {
                                            updateSmilePopupSetting('windowWidth', 800);
                                        } else {
                                            updateSmilePopupSetting('windowWidth', numValue);
                                        }
                                    }
                                }}
                                placeholder="400"
                                disabled={!smilePopupSettings.enabled}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Window Height (px)</Label>
                            <Input
                                type="number"
                                min="200"
                                max="600"
                                value={smilePopupSettings.windowHeight || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow any input during typing - no validation/clamping
                                    if (value === '') {
                                        updateSmilePopupSetting('windowHeight', '');
                                    } else {
                                        // Store the raw input value to allow natural typing
                                        updateSmilePopupSetting('windowHeight', value);
                                    }
                                }}
                                onBlur={(e) => {
                                    const value = e.target.value;
                                    if (!value) {
                                        updateSmilePopupSetting('windowHeight', 300);
                                    } else {
                                        const numValue = parseInt(value);
                                        if (isNaN(numValue) || numValue < 200) {
                                            updateSmilePopupSetting('windowHeight', 300);
                                        } else if (numValue > 600) {
                                            updateSmilePopupSetting('windowHeight', 600);
                                        } else {
                                            updateSmilePopupSetting('windowHeight', numValue);
                                        }
                                    }
                                }}
                                placeholder="300"
                                disabled={!smilePopupSettings.enabled}
                            />
                        </div>
                    </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                    <div>
                        <Label>Auto Close Popup</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically close popup after set time (works for both inline and external windows)
                        </p>
                    </div>
                    <Switch
                        checked={smilePopupSettings.autoClose}
                        onCheckedChange={(checked) => updateSmilePopupSetting('autoClose', checked)}
                        disabled={!smilePopupSettings.enabled}
                    />
                </div>

                {smilePopupSettings.autoClose && (
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label>Auto Close Delay (seconds)</Label>
                            <Input
                                type="number"
                                min="1"
                                max="30"
                                value={smilePopupSettings.closeDelay || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow any input during typing - no validation/clamping
                                    if (value === '') {
                                        updateSmilePopupSetting('closeDelay', '');
                                    } else {
                                        // Store the raw input value to allow natural typing
                                        updateSmilePopupSetting('closeDelay', value);
                                    }
                                }}
                                onBlur={(e) => {
                                    const value = e.target.value;
                                    if (!value) {
                                        updateSmilePopupSetting('closeDelay', 5);
                                    } else {
                                        const numValue = parseInt(value);
                                        if (isNaN(numValue) || numValue < 1) {
                                            updateSmilePopupSetting('closeDelay', 5);
                                        } else if (numValue > 30) {
                                            updateSmilePopupSetting('closeDelay', 30);
                                        } else {
                                            updateSmilePopupSetting('closeDelay', numValue);
                                        }
                                    }
                                }}
                                placeholder="5"
                                disabled={!smilePopupSettings.enabled}
                            />
                        </div>

                        {/* Test auto-close functionality */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const width = smilePopupSettings.windowWidth || 400;
                                    const height = smilePopupSettings.windowHeight || 300;
                                    const left = Math.round((screen.width - width) / 2);
                                    const top = Math.round((screen.height - height) / 2);

                                    if (typeof chrome !== 'undefined' && chrome.windows) {
                                        const url = chrome.runtime.getURL(`smile-popup.html?sessionType=focus&sessionCount=1&autoClose=true&closeDelay=${smilePopupSettings.closeDelay}`);
                                        chrome.windows.create({
                                            url,
                                            type: 'popup',
                                            width,
                                            height,
                                            left,
                                            top,
                                            focused: true,
                                        }, (window) => {
                                            if (chrome.runtime.lastError) {
                                                toast.error(chrome.runtime.lastError.message);
                                            } else {
                                                toast.success(`External popup will close in ${smilePopupSettings.closeDelay} seconds`);
                                            }
                                        });
                                    } else {
                                        toast.error("Windows API not accessible in this environment");
                                    }
                                }}
                                disabled={!smilePopupSettings.showAsExternalWindow}
                            >
                                Test Auto-Close (External)
                            </Button>

                            <div className="text-xs text-muted-foreground self-center">
                                {smilePopupSettings.showAsExternalWindow
                                    ? `Will close in ${smilePopupSettings.closeDelay}s`
                                    : 'Enable external window to test'
                                }
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
