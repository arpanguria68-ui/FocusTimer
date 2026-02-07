import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Download, Key, AlertTriangle, LogOut, User } from 'lucide-react';
import { clearChromeStorage } from '@/utils/storageCleanup';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PrivacySettingsProps {
    appSettings: any;
    updateAppSetting: (key: string, value: any) => void;
}

export function PrivacySettings({ appSettings, updateAppSetting }: PrivacySettingsProps) {
    const { user, signOut } = useAuth();

    return (
        <div className="space-y-6">
            <Card className="glass p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                    <Shield className="h-5 w-5" />
                    Privacy & Data
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Data Collection</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow anonymous usage analytics to improve the app
                            </p>
                        </div>
                        <Switch
                            checked={appSettings.privacy.dataCollection}
                            onCheckedChange={(checked) => updateAppSetting('privacy', {
                                ...appSettings.privacy,
                                dataCollection: checked
                            })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Analytics</Label>
                            <p className="text-sm text-muted-foreground">
                                Send performance and usage statistics
                            </p>
                        </div>
                        <Switch
                            checked={appSettings.privacy.analytics}
                            onCheckedChange={(checked) => updateAppSetting('privacy', {
                                ...appSettings.privacy,
                                analytics: checked
                            })}
                        />
                    </div>
                </div>
            </Card>

            <Card className="glass p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                    <Download className="h-5 w-5" />
                    Data Management
                </h3>
                <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                        <Download className="mr-2 h-4 w-4" />
                        Export My Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                        <Key className="mr-2 h-4 w-4" />
                        Manage API Keys
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={async () => {
                            try {
                                await clearChromeStorage();
                                toast.success(
                                    "All extension data has been cleared. Please reconfigure your settings."
                                );
                                window.location.reload();
                            } catch (error) {
                                toast.error("Failed to clear storage. Try reloading the extension.");
                            }
                        }}
                    >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Clear Storage (Fix Quota Issues)
                    </Button>
                    <Button variant="destructive" className="w-full justify-start">
                        <Shield className="mr-2 h-4 w-4" />
                        Delete All Data
                    </Button>
                </div>
            </Card>

            {/* Account Management */}
            {user && (
                <Card className="glass p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                        <User className="h-5 w-5" />
                        Account
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                            <div>
                                <p className="font-medium text-foreground">Signed in as</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={async () => {
                                try {
                                    await signOut();
                                    toast.success("You have been successfully signed out.");
                                } catch (error) {
                                    toast.error("There was an error signing out. Please try again.");
                                }
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
