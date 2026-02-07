import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { UserService } from '@/services/userService';
import { toast } from 'sonner';
import {
  Timer,
  Target,
  User,
  Settings,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  Coffee,
  Bell,
  Palette,
  Sparkles,
  BarChart3,
  Zap
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

interface OnboardingData {
  // Personal Info
  fullName: string;
  role: string;
  experience: string;

  // Timer Preferences
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;

  // Notifications & Features
  notifications: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'system';

  // Goals & Productivity
  dailyGoal: number;
  primaryGoals: string[];
  workStyle: string;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: user?.user_metadata?.full_name || '',
    role: '',
    experience: '',
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    notifications: true,
    soundEnabled: true,
    theme: 'system',
    dailyGoal: 8,
    primaryGoals: [],
    workStyle: '',
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGoalToggle = (goal: string) => {
    setData(prev => ({
      ...prev,
      primaryGoals: prev.primaryGoals.includes(goal)
        ? prev.primaryGoals.filter(g => g !== goal)
        : [...prev.primaryGoals, goal]
    }));
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create user profile
      await UserService.createUserProfile({
        id: user.id,
        email: user.email!,
        full_name: data.fullName,
        avatar_url: user.user_metadata?.avatar_url || undefined,
        onboarding_completed: true,
      });

      // Create user preferences
      await UserService.updateUserPreferences(user.id, {
        preferred_session_length: data.focusDuration,
        preferred_break_length: data.shortBreakDuration,
        preferred_long_break_length: data.longBreakDuration,
        sessions_before_long_break: data.sessionsUntilLongBreak,
        email_notifications: data.notifications,
        push_notifications: data.notifications,
        theme: data.theme,
        daily_focus_goal: data.dailyGoal * data.focusDuration,
      });

      // Create user settings (legacy compatibility)
      await UserService.upsertUserSettings(user.id, {
        focus_duration: data.focusDuration,
        short_break_duration: data.shortBreakDuration,
        long_break_duration: data.longBreakDuration,
        sessions_until_long_break: data.sessionsUntilLongBreak,
        notifications_enabled: data.notifications,
        sound_enabled: data.soundEnabled,
        theme: data.theme,
      });

      // Initialize user statistics
      await UserService.updateUserStatistics(user.id, {
        total_sessions: 0,
        completed_sessions: 0,
        total_focus_time: 0,
        current_level: 1,
        experience_points: 0,
      });

      // Create initial goals if any were selected
      if (data.primaryGoals.length > 0) {
        for (const goalType of data.primaryGoals) {
          let goalName = '';
          let targetValue = 0;
          let unit = 'sessions';

          switch (goalType) {
            case 'daily_sessions':
              goalName = 'Daily Focus Sessions';
              targetValue = data.dailyGoal;
              unit = 'sessions';
              break;
            case 'weekly_hours':
              goalName = 'Weekly Focus Hours';
              targetValue = 20;
              unit = 'hours';
              break;
            case 'consistency':
              goalName = '7-Day Consistency Streak';
              targetValue = 7;
              unit = 'days';
              break;
          }

          if (goalName) {
            await UserService.createUserGoal({
              user_id: user.id,
              goal_type: 'custom',
              goal_name: goalName,
              goal_description: `Achieve ${targetValue} ${unit} to build productive habits`,
              target_value: targetValue,
              unit: unit,
              start_date: new Date().toISOString(),
              is_active: true,
            });
          }
        }
      }

      toast.success('Welcome to Focus Timer! Your profile has been set up successfully.');
      onComplete();
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo.svg" alt="Focus Timer" className="w-12 h-12" />
            <CardTitle>Welcome to Focus Timer!</CardTitle>
          </div>
          <CardDescription>
            Let's personalize your productivity experience
          </CardDescription>

          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {step} of {totalSteps}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Tell us about yourself</h3>
                <p className="text-muted-foreground">Help us customize your experience</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={data.fullName}
                    onChange={(e) => setData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>What's your role?</Label>
                  <Select value={data.role} onValueChange={(value) => setData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="writer">Writer</SelectItem>
                      <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Experience with Pomodoro Technique?</Label>
                  <Select value={data.experience} onValueChange={(value) => setData(prev => ({ ...prev, experience: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">New to Pomodoro</SelectItem>
                      <SelectItem value="intermediate">Some experience</SelectItem>
                      <SelectItem value="advanced">Very experienced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Timer Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Timer className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Configure your timer</h3>
                <p className="text-muted-foreground">Set your preferred session lengths</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Focus Duration (minutes)</Label>
                  <Select
                    value={data.focusDuration.toString()}
                    onValueChange={(value) => setData(prev => ({ ...prev, focusDuration: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="25">25 minutes (Classic)</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Short Break (minutes)</Label>
                  <Select
                    value={data.shortBreakDuration.toString()}
                    onValueChange={(value) => setData(prev => ({ ...prev, shortBreakDuration: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 minutes</SelectItem>
                      <SelectItem value="5">5 minutes (Classic)</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Long Break (minutes)</Label>
                  <Select
                    value={data.longBreakDuration.toString()}
                    onValueChange={(value) => setData(prev => ({ ...prev, longBreakDuration: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes (Classic)</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sessions until long break</Label>
                  <Select
                    value={data.sessionsUntilLongBreak.toString()}
                    onValueChange={(value) => setData(prev => ({ ...prev, sessionsUntilLongBreak: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 sessions</SelectItem>
                      <SelectItem value="3">3 sessions</SelectItem>
                      <SelectItem value="4">4 sessions (Classic)</SelectItem>
                      <SelectItem value="5">5 sessions</SelectItem>
                      <SelectItem value="6">6 sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Your Schedule Preview:</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{data.focusDuration}min focus</span>
                  <ArrowRight className="h-3 w-3" />
                  <Coffee className="h-4 w-4 text-accent" />
                  <span>{data.shortBreakDuration}min break</span>
                  <span className="text-muted-foreground">
                    (Long break every {data.sessionsUntilLongBreak} sessions)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Notifications & Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <Settings className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Customize your experience</h3>
                <p className="text-muted-foreground">Set up notifications and appearance</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <Label>Enable Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get notified when sessions start and end
                    </p>
                  </div>
                  <Checkbox
                    checked={data.notifications}
                    onCheckedChange={(checked) => setData(prev => ({ ...prev, notifications: checked as boolean }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <Label>Sound Effects</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Play sounds for timer events
                    </p>
                  </div>
                  <Checkbox
                    checked={data.soundEnabled}
                    onCheckedChange={(checked) => setData(prev => ({ ...prev, soundEnabled: checked as boolean }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <Label>Theme Preference</Label>
                  </div>
                  <Select value={data.theme} onValueChange={(value: 'light' | 'dark' | 'system') => setData(prev => ({ ...prev, theme: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light Mode</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Goals & Productivity */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Set your goals</h3>
                <p className="text-muted-foreground">What would you like to achieve?</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Daily Focus Goal (sessions)</Label>
                  <Select
                    value={data.dailyGoal.toString()}
                    onValueChange={(value) => setData(prev => ({ ...prev, dailyGoal: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 sessions (2 hours)</SelectItem>
                      <SelectItem value="6">6 sessions (3 hours)</SelectItem>
                      <SelectItem value="8">8 sessions (4 hours)</SelectItem>
                      <SelectItem value="10">10 sessions (5 hours)</SelectItem>
                      <SelectItem value="12">12 sessions (6 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Primary Goals (select all that apply)</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'daily_sessions', label: 'Complete daily focus sessions', icon: Clock },
                      { id: 'weekly_hours', label: 'Achieve weekly focus hours', icon: BarChart3 },
                      { id: 'consistency', label: 'Build consistent habits', icon: Sparkles },
                    ].map((goal) => (
                      <div
                        key={goal.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${data.primaryGoals.includes(goal.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                          }`}
                        onClick={() => handleGoalToggle(goal.id)}
                      >
                        <Checkbox
                          checked={data.primaryGoals.includes(goal.id)}
                          onChange={() => { }} // Handled by parent click
                        />
                        <goal.icon className="h-4 w-4" />
                        <span className="text-sm">{goal.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Summary & Complete */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold mb-2">You're all set!</h3>
                <p className="text-muted-foreground">Review your settings and start your productivity journey</p>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-4 rounded-lg flex items-center justify-between group cursor-pointer hover:shadow-md transition-all" onClick={() => window.open('https://chrome.google.com/webstore/detail/your-extension-id', '_blank')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Get the Chrome Extension</h4>
                      <p className="text-xs text-muted-foreground">Stay focused from any tab with our browser companion</p>
                    </div>
                  </div>
                  <Button size="sm" variant="default" className="gap-2">
                    Install <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium">Your Configuration:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Focus Duration:</span>
                      <span className="ml-2 font-medium">{data.focusDuration} minutes</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Daily Goal:</span>
                      <span className="ml-2 font-medium">{data.dailyGoal} sessions</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Break Duration:</span>
                      <span className="ml-2 font-medium">{data.shortBreakDuration} minutes</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Theme:</span>
                      <span className="ml-2 font-medium capitalize">{data.theme}</span>
                    </div>
                  </div>

                  {data.primaryGoals.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Goals:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {data.primaryGoals.map(goal => (
                          <Badge key={goal} variant="secondary" className="text-xs">
                            {goal.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                  <h4 className="font-medium text-primary mb-2">What's Next?</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Start your first focus session</li>
                    <li>• Explore task management features</li>
                    <li>• Track your productivity analytics</li>
                    <li>• Customize settings anytime in preferences</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {step < totalSteps ? (
              <Button onClick={handleNext} className="flex items-center gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}