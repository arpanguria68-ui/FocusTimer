import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { useUserAchievements } from '@/hooks/useConvexQueries';

export function UserAchievements() {
    const { data: achievements, isLoading } = useUserAchievements();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements?.map((achievement) => {
                const isUnlocked = achievement.progress >= achievement.max_progress;
                return (
                    <Card
                        key={achievement.id}
                        className={`glass p-6 transition-all ${isUnlocked
                            ? 'glow-primary cursor-pointer hover:scale-105'
                            : 'opacity-60'
                            }`}
                    >
                        <div className="space-y-3">
                            <div className="text-3xl">{achievement.achievement_icon || '🏆'}</div>
                            <div>
                                <h4 className="font-semibold text-foreground">{achievement.achievement_name}</h4>
                                <p className="text-sm text-muted-foreground">{achievement.achievement_description}</p>
                            </div>

                            {achievement.max_progress > 1 && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>Progress</span>
                                        <span>{achievement.progress}/{achievement.max_progress}</span>
                                    </div>
                                    <Progress value={(achievement.progress / achievement.max_progress) * 100} className="h-2" />
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <Badge variant={isUnlocked ? "secondary" : "outline"}>
                                    {isUnlocked ? 'Unlocked' : 'Locked'}
                                </Badge>
                                {achievement.points_awarded > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{achievement.points_awarded} XP
                                    </Badge>
                                )}
                            </div>

                            {isUnlocked && achievement.unlocked_at && (
                                <p className="text-xs text-muted-foreground">
                                    Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
