import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Target } from 'lucide-react';
import { useUserGoals } from '@/hooks/useConvexQueries';
import { GoalCreationDialog } from '../GoalCreationDialog';

export function UserGoals() {
    const { data: goals, isLoading } = useUserGoals(true);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Goals Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Your Goals</h3>
                    <p className="text-sm text-muted-foreground">
                        Track your progress and achieve your objectives
                    </p>
                </div>
                {goals && goals.length > 0 && (
                    <GoalCreationDialog>
                        <Button>
                            <Target className="mr-2 h-4 w-4" />
                            Create Goal
                        </Button>
                    </GoalCreationDialog>
                )}
            </div>

            <div className="space-y-4">
                {goals?.map((goal) => (
                    <Card key={goal.id} className="glass p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-foreground">{goal.goal_name}</h4>
                                    <p className="text-sm text-muted-foreground">{goal.goal_description}</p>
                                </div>
                                <Badge variant={goal.is_completed ? "secondary" : "outline"}>
                                    {goal.is_completed ? 'Completed' : 'Active'}
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progress</span>
                                    <span>{goal.current_value}/{goal.target_value} {goal.unit}</span>
                                </div>
                                <Progress value={(goal.current_value / goal.target_value) * 100} className="h-2" />
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Started: {new Date(goal.start_date).toLocaleDateString()}</span>
                                {goal.end_date && (
                                    <span>Ends: {new Date(goal.end_date).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}

                {(!goals || goals.length === 0) && (
                    <Card className="glass p-8 text-center">
                        <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Active Goals</h3>
                        <p className="text-muted-foreground mb-4">Set some goals to track your progress!</p>
                        <GoalCreationDialog>
                            <Button>Create Your First Goal</Button>
                        </GoalCreationDialog>
                    </Card>
                )}
            </div>
        </div>
    );
}
