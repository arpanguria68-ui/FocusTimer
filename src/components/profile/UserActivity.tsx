import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, Activity } from 'lucide-react';
import { useUserActivityLog } from '@/hooks/useConvexQueries';

export function UserActivity() {
    const { data: activityLog, isLoading } = useUserActivityLog(20);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Activity</h3>
            <div className="space-y-4">
                {activityLog?.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center">
                            <Activity className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">
                                {activity.activity_description || activity.activity_type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(activity.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))}

                {(!activityLog || activityLog.length === 0) && (
                    <div className="text-center py-8">
                        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No recent activity</p>
                    </div>
                )}
            </div>
        </Card>
    );
}
