import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Zap, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimerCircle } from './TimerCircle';
import { MiniTimerSettings } from './MiniTimerSettings';
import { SessionStats } from './SessionStats';
import { TaskList } from './TaskList';
import { TaskManagementGate } from './FeatureGate';
import { DashboardTaskManagementGate } from './DashboardFeatureGate';
import SmilePopup from './SmilePopup';
import { useToast } from '@/hooks/use-toast';
import { useSmilePopupSettings } from '@/hooks/useChromeStorage';
import { useOfflineTimerState } from '@/hooks/useOfflineTimerState';
import { useTaskState } from '@/hooks/useTaskState';
import { useAuth } from '@/hooks/useAuth';
import '@/utils/timerDebug'; // Load debug utilities

export type TimerMode = 'focus' | 'short_break' | 'long_break';

interface FocusTimerProps {
  isCompact?: boolean;
}

export function FocusTimer({ isCompact = false }: FocusTimerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showSmilePopup, setShowSmilePopup] = useState(false);

  // Local state for task selection
  // const [selectedTaskId, setSelectedTaskId] = useState<string>('none'); // Replaced by global state
  const [selectedCategory, setSelectedCategory] = useState<'signal' | 'noise'>('signal');

  // Get smile popup settings from Chrome storage
  const { value: smilePopupSettings } = useSmilePopupSettings();

  // Get shared task state
  const { activeTasks, selectedTaskId, selectTask } = useTaskState();

  // Use offline-first timer state management
  const {
    currentTime,
    isRunning,
    sessionType,
    currentSession,
    totalSessions,
    startTimer,
    pauseTimer,
    resetTimer,
    switchSessionType,
    taskId,
    category
  } = useOfflineTimerState();

  // Helper function to get total duration for current session type
  const getTotalDuration = (sessionType: TimerMode): number => {
    const savedSettings = localStorage.getItem('timer_settings');
    let settings = { focusTime: 25, breakTime: 5, longBreakTime: 15 };
    if (savedSettings) {
      try {
        settings = JSON.parse(savedSettings);
      } catch (error) {
        console.error('Failed to parse timer settings:', error);
      }
    }
    switch (sessionType) {
      case 'focus': return settings.focusTime * 60;
      case 'short_break': return settings.breakTime * 60;
      case 'long_break': return settings.longBreakTime * 60;
      default: return 25 * 60;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeTitle = (mode: TimerMode): string => {
    switch (mode) {
      case 'focus': return 'Focus Time';
      case 'short_break': return 'Short Break';
      case 'long_break': return 'Long Break';
      default: return 'Focus Time';
    }
  };

  const getModeVariant = (mode: TimerMode) => {
    switch (mode) {
      case 'focus': return 'timer';
      case 'short_break':
      case 'long_break':
        return 'break';
      default: return 'timer';
    }
  };

  const handleStartTimer = () => {
    if (selectedTaskId && selectedTaskId !== 'none') {
      const task = activeTasks.find(t => t.id === selectedTaskId);
      startTimer(selectedTaskId, task?.category || 'signal');
    } else {
      startTimer(undefined, selectedCategory);
    }
  };

  const toggleTimer = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      handleStartTimer();
    }
  };

  const handleReset = () => {
    resetTimer();
    toast({
      title: "Timer Reset",
      description: "Timer has been reset to the beginning.",
    });
  };

  const handleSkipBreak = () => {
    switchSessionType('focus');
    toast({
      title: "🔥 Break skipped!",
      description: "Ready to focus again? Let's get productive!",
    });
  };

  const handleStartBreak = () => {
    toast({
      title: "🎉 Focus session completed!",
      description: `Great work! Time for a ${sessionType === 'long_break' ? 'long' : 'short'} break.`,
    });
  };

  const handleSettingsChange = (newSettings: any) => {
    console.log('Timer settings changed:', newSettings);

    toast({
      title: "Settings Updated",
      description: "Timer settings have been applied successfully!",
    });
  };

  const openExternalSmilePopup = () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const params = new URLSearchParams({
      sessionType,
      sessionCount: totalSessions.toString(),
    });

    // Add task info if available
    if (taskId) {
      const task = activeTasks.find(t => t.id === taskId);
      if (task) {
        params.append('taskTitle', task.title);
        params.append('category', task.category);
      }
    } else if (category) {
      params.append('category', category);
    }

    if (typeof chrome !== 'undefined' && chrome.windows) {
      const url = chrome.runtime.getURL(`smile-popup.html?${params.toString()}`);
      chrome.windows.create({
        url,
        type: 'popup',
        width,
        height,
        left: Math.round(left),
        top: Math.round(top),
        focused: true,
      });
    } else {
      const url = `/smile-popup?${params.toString()}`;
      window.open(
        url,
        'smilePopup',
        `width=${width},height=${height},left=${left},top=${top},resizable=no`
      );
    }
  };

  // Handle timer completion
  useEffect(() => {
    if (currentTime === 0 && !isRunning) {
      if (smilePopupSettings.enabled && smilePopupSettings.showAsExternalWindow) {
        openExternalSmilePopup();
      } else {
        setShowSmilePopup(true);
      }

      if (sessionType === 'focus') {
        handleStartBreak();
      }
    }
  }, [currentTime, isRunning, sessionType]);

  const progress = ((getTotalDuration(sessionType) - currentTime) / getTotalDuration(sessionType)) * 100;
  const isLoading = false; // Placeholder if needed

  if (isCompact) {
    return (
      <div className="space-y-4">
        <div className="text-center flex flex-col items-center">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            {getModeTitle(sessionType)}
          </h2>
          <div className="mb-4 flex justify-center">
            <TimerCircle
              timeLeft={currentTime}
              totalTime={getTotalDuration(sessionType)}
              mode={sessionType}
              isRunning={isRunning}
              size="sm"
            />
          </div>
          <div className="timer-display-compact text-foreground mb-4 text-center">
            {formatTime(currentTime)}
          </div>
          <div className="w-full">
            <Progress value={progress} className="h-1 mb-4" />
          </div>
        </div>

        <div className="flex justify-center gap-2">
          <Button
            variant={getModeVariant(sessionType)}
            size="sm"
            onClick={toggleTimer}
            disabled={isLoading}
            className="min-w-20"
          >
            {isRunning ? (
              <>
                <Pause className="mr-1 h-3 w-3" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-1 h-3 w-3" />
                Start
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isLoading}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>

          <MiniTimerSettings onSettingsChange={handleSettingsChange} />
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Session {currentSession} • {totalSessions} completed
        </div>

        <SmilePopup
          isOpen={showSmilePopup}
          onClose={() => setShowSmilePopup(false)}
          onSkipBreak={handleSkipBreak}
          onStartBreak={handleStartBreak}
          sessionType={sessionType}
          sessionCount={totalSessions}
          customImage={smilePopupSettings.customImage}
          taskTitle={taskId ? activeTasks.find(t => t.id === taskId)?.title : undefined}
          category={category || undefined}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src="/logo.svg" alt="Focus Timer" className="w-16 h-16" />
            <h1 className="text-4xl font-light tracking-tight text-foreground">
              Focus Timer
            </h1>
          </div>
          <p className="text-muted-foreground">
            Stay productive with the Pomodoro Technique
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="glass p-8 text-center">
              <div className="mb-6">
                <h2 className="mb-2 text-2xl font-medium text-foreground">
                  {getModeTitle(sessionType)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Session {currentSession} • {totalSessions} completed
                </p>
              </div>

              <div className="mb-8 flex justify-center">
                <TimerCircle
                  timeLeft={currentTime}
                  totalTime={getTotalDuration(sessionType)}
                  mode={sessionType}
                  isRunning={isRunning}
                >
                  <div className="timer-display text-center text-foreground flex flex-col items-center justify-center">
                    <span className="text-6xl font-bold tracking-tight digital-font text-foreground drop-shadow-md">
                      {formatTime(currentTime)}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-widest opacity-60 mt-2">
                      {sessionType === 'focus' ? 'Focus' : 'Break'}
                    </span>
                  </div>
                </TimerCircle>
              </div>

              <div className="mb-8 flex justify-center flex-col items-center">
                {/* Session Info */}
                <div className="flex flex-col items-center gap-1 mb-6">
                  {isRunning && (
                    <Badge
                      variant={selectedTaskId ? 'default' : 'secondary'}
                      className={`text-xs ${(selectedTaskId ? activeTasks.find(t => t.id === selectedTaskId)?.category : selectedCategory) === 'signal'
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : ''
                        }`}
                    >
                      {selectedTaskId
                        ? activeTasks.find(t => t.id === selectedTaskId)?.title
                        : (selectedCategory === 'signal' ? 'Signal ⚡' : 'Noise 🔔')
                      }
                    </Badge>
                  )}
                </div>

                {/* Task/Category Selection (only when not running) */}
                {!isRunning && sessionType === 'focus' && (
                  <div className="w-full max-w-xs mb-6 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground ml-1">Focus Task</label>
                      <Select
                        value={selectedTaskId || 'none'}
                        onValueChange={(val) => selectTask(val === 'none' ? null : val)}
                      >
                        <SelectTrigger className="w-full glass">
                          <SelectValue placeholder="Select a task..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific task</SelectItem>
                          {activeTasks.map(task => (
                            <SelectItem key={task.id} value={task.id}>
                              <span className="flex items-center justify-between w-full gap-2">
                                <span className="truncate max-w-[180px]">{task.title}</span>
                                <span className="flex items-center gap-2">
                                  {(task as any).isLocal && <span className="text-[10px] text-muted-foreground">(Local)</span>}
                                  <Badge variant="outline" className="text-[10px] h-5">
                                    {task.category === 'signal' ? '⚡' : '🔔'}
                                  </Badge>
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {!selectedTaskId && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground ml-1">Session Category</label>
                        <div className="flex gap-2">
                          <Button
                            variant={selectedCategory === 'signal' ? 'default' : 'outline'}
                            size="sm"
                            className={`flex-1 ${selectedCategory === 'signal' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
                            onClick={() => setSelectedCategory('signal')}
                          >
                            <Zap className="h-3 w-3 mr-2" />
                            Signal
                          </Button>
                          <Button
                            variant={selectedCategory === 'noise' ? 'secondary' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedCategory('noise')}
                          >
                            <Bell className="h-3 w-3 mr-2" />
                            Noise
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-8">
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  variant={getModeVariant(sessionType)}
                  size="lg"
                  onClick={toggleTimer}
                  disabled={isLoading}
                  className="min-w-32"
                >
                  {isRunning ? (
                    <>
                      <Pause className="mr-2 h-5 w-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Start
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>

                <div className="flex items-center">
                  <MiniTimerSettings onSettingsChange={handleSettingsChange} />
                </div>
              </div>
            </Card>

            <div className="mt-8">
              <SessionStats
                currentSession={currentSession}
                totalSessions={totalSessions}
                mode={sessionType}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            {/* Only show TaskList with gates in web contexts, not in extension */}
            {isCompact ? (
              // Extension mode - no task list, keep it simple
              <div className="text-center text-sm text-muted-foreground">
                <p>Click Dashboard for full features</p>
              </div>
            ) : window.location.pathname === '/dashboard' ? (
              // Dashboard context - use dashboard gates
              <DashboardTaskManagementGate>
                <TaskList />
              </DashboardTaskManagementGate>
            ) : (
              // Web app context - use regular gates
              <TaskManagementGate>
                <TaskList />
              </TaskManagementGate>
            )}
          </div>
        </div>

        <SmilePopup
          isOpen={showSmilePopup}
          onClose={() => setShowSmilePopup(false)}
          onSkipBreak={handleSkipBreak}
          onStartBreak={handleStartBreak}
          sessionType={sessionType}
          sessionCount={totalSessions}
          customImage={smilePopupSettings.customImage}
          taskTitle={taskId ? activeTasks.find(t => t.id === taskId)?.title : undefined}
          category={category || undefined}
        />
      </div>
    </div>
  );
}