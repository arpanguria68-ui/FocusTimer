import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useCreateSession, useCompleteSession } from './useConvexQueries'
import { handleError } from '@/lib/errorHandler'

// @ts-ignore
declare const chrome: any;

export interface TimerState {
  currentTime: number // Seconds remaining (derived from endTime)
  isRunning: boolean
  sessionType: 'focus' | 'short_break' | 'long_break'
  currentSession: number
  totalSessions: number
  currentSessionId: string | null
  lastUpdated: number
  taskId: string | null
  category: 'signal' | 'noise' | null
  endTime: number | null // Timestamp when timer ends
}

const DEFAULT_TIMER_STATE: TimerState = {
  currentTime: 25 * 60,
  isRunning: false,
  sessionType: 'focus',
  currentSession: 1,
  totalSessions: 0,
  currentSessionId: null,
  lastUpdated: Date.now(),
  taskId: null,
  category: null,
  endTime: null
}

// Helper to get session duration from storage
const getSessionDurationFromStorage = (sessionType: TimerState['sessionType']) => {
  const savedSettings = localStorage.getItem('timer_settings');
  let settings = {
    focusTime: 25,
    breakTime: 5,
    longBreakTime: 15,
    sessionsUntilLongBreak: 4
  };

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

/**
 * Offline-first timer state management with Background Sync
 * - Uses Timestamp (endTime) to track progress across reloads/background
 * - Syncs with chrome.runtime for background alarms
 */
export function useOfflineTimerState() {
  const { user } = useAuth()
  const createSession = useCreateSession()
  const completeSession = useCompleteSession()

  // Load state from localStorage
  const [timerState, setTimerState] = useState<TimerState>(() => {
    const saved = localStorage.getItem('focus-timer-state');
    if (saved) {
      try {
        const parsedState = { ...DEFAULT_TIMER_STATE, ...JSON.parse(saved) };

        // Recalculate currentTime if running
        if (parsedState.isRunning && parsedState.endTime) {
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((parsedState.endTime - now) / 1000));

          // If time passed while closed
          if (remaining === 0) {
            // Timer finished while away
            return { ...parsedState, currentTime: 0, isRunning: false };
          }
          return { ...parsedState, currentTime: remaining };
        }

        return parsedState;
      } catch (error) {
        console.error('Failed to parse timer state:', error);
      }
    }
    return DEFAULT_TIMER_STATE;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('focus-timer-state', JSON.stringify(timerState));
  }, [timerState]);

  // Sync with Chrome Background Script
  const syncWithBackground = useCallback((action: 'START' | 'STOP', duration?: number, metadata?: any) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        if (action === 'START' && duration) {
          // @ts-ignore
          chrome.runtime.sendMessage({ type: 'START_TIMER', duration, metadata });
        } else {
          // @ts-ignore
          chrome.runtime.sendMessage({ type: 'STOP_TIMER' });
        }
      } catch (e) {
        console.warn("Background sync failed (context invalid or not extension):", e);
      }
    }
  }, []);


  // Get duration based on session type
  const getSessionDuration = useCallback((sessionType: TimerState['sessionType']) => {
    return getSessionDurationFromStorage(sessionType);
  }, []);

  // Start timer
  const startTimer = useCallback(async (taskId?: string, category?: 'signal' | 'noise') => {
    try {
      const durationSeconds = timerState.currentTime > 0
        ? timerState.currentTime // Resume
        : getSessionDuration(timerState.sessionType); // Start new

      const endTime = Date.now() + (durationSeconds * 1000);
      let sessionId = timerState.currentSessionId;

      // Try to create session in database if user is logged in AND it's a new session (not resume)
      if (user && !timerState.isRunning && !sessionId) {
        const sessionData = await createSession.mutateAsync({
          user_id: user.id,
          session_type: timerState.sessionType,
          duration_minutes: Math.floor(durationSeconds / 60),
          ...(taskId && { task_id: taskId }),
        });
        sessionId = sessionData;
      }

      // Notify Background Script
      syncWithBackground('START', durationSeconds, {
        sessionType: timerState.sessionType,
        sessionCount: timerState.currentSession,
        taskId: taskId || timerState.taskId,
        category: category || timerState.category,
        taskTitle: null // We don't have title here easily, relying on taskId
      });

      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        currentTime: durationSeconds,
        endTime: endTime,
        currentSessionId: sessionId,
        lastUpdated: Date.now(),
        taskId: taskId || prev.taskId,
        category: category || prev.category
      }));

    } catch (error) {
      handleError(error, { title: "Failed to start session", context: "startTimer" });
      // Fallback local start
      const durationSeconds = timerState.currentTime > 0 ? timerState.currentTime : getSessionDuration(timerState.sessionType);
      const endTime = Date.now() + (durationSeconds * 1000);

      syncWithBackground('START', durationSeconds, {
        sessionType: timerState.sessionType,
        sessionCount: timerState.currentSession,
        taskId: taskId || timerState.taskId,
        category: category || timerState.category,
        taskTitle: null
      });

      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        currentTime: durationSeconds,
        endTime: endTime,
        lastUpdated: Date.now(),
        taskId: taskId || prev.taskId,
        category: category || prev.category
      }));
    }
  }, [user, timerState, createSession, getSessionDuration, syncWithBackground]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    syncWithBackground('STOP');
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      endTime: null, // Clear end time on pause
      lastUpdated: Date.now()
    }));
  }, [syncWithBackground]);

  // Complete session
  const completeCurrentSession = useCallback(async () => {
    // 1. Sync to DB
    if (user && timerState.currentSessionId) {
      completeSession.mutateAsync(timerState.currentSessionId)
        .catch(err => handleError(err, { title: "Failed to save session", context: "completeSession", showToast: false }));
    }

    // 2. Stop Background Alarm
    syncWithBackground('STOP');

    // 3. Update Local State
    try {
      const savedSettings = localStorage.getItem('timer_settings');
      let settings = { sessionsUntilLongBreak: 4 };
      if (savedSettings) {
        try { settings = JSON.parse(savedSettings); } catch { }
      }

      const isLongBreakTime = timerState.currentSession % settings.sessionsUntilLongBreak === 0;
      let nextSessionType: TimerState['sessionType'];

      if (timerState.sessionType === 'focus') {
        nextSessionType = isLongBreakTime ? 'long_break' : 'short_break';
      } else {
        nextSessionType = 'focus';
      }

      const nextDuration = getSessionDurationFromStorage(nextSessionType);

      setTimerState(prev => ({
        ...prev,
        currentTime: nextDuration,
        endTime: null,
        isRunning: false,
        sessionType: nextSessionType,
        currentSession: timerState.sessionType === 'focus' ? prev.currentSession + 1 : prev.currentSession,
        totalSessions: timerState.sessionType === 'focus' ? prev.totalSessions + 1 : prev.totalSessions,
        currentSessionId: null,
        lastUpdated: Date.now()
      }));
    } catch (error) {
      handleError(error, { title: "Timer Error", context: "completeCurrentSession" });
    }
  }, [user, timerState, completeSession, syncWithBackground]);

  // Reset timer
  const resetTimer = useCallback(() => {
    syncWithBackground('STOP');
    const duration = getSessionDuration(timerState.sessionType);
    setTimerState(prev => ({
      ...prev,
      currentTime: duration,
      endTime: null,
      isRunning: false,
      currentSessionId: null,
      lastUpdated: Date.now()
    }));
  }, [timerState.sessionType, getSessionDuration, syncWithBackground]);

  // Switch session type
  const switchSessionType = useCallback((newType: TimerState['sessionType']) => {
    syncWithBackground('STOP');
    const duration = getSessionDuration(newType);
    setTimerState(prev => ({
      ...prev,
      sessionType: newType,
      currentTime: duration,
      endTime: null,
      isRunning: false,
      currentSessionId: null,
      lastUpdated: Date.now()
    }));
  }, [getSessionDuration, syncWithBackground]);

  // Timer Tick Effect (Timestamp-based)
  useEffect(() => {
    if (!timerState.isRunning || !timerState.endTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((timerState.endTime! - now) / 1000);
      const newTime = Math.max(0, remaining);

      // Only update state if time has changed (prevents excessive re-renders)
      if (newTime !== timerState.currentTime) {
        setTimerState(prev => ({
          ...prev,
          currentTime: newTime,
          lastUpdated: now
        }));
      }

      if (newTime === 0) {
        completeCurrentSession();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.endTime, completeCurrentSession, timerState.currentTime]);

  // Listen for storage changes from other windows/tabs (Dashboard <-> Popup Sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'focus-timer-state' && e.newValue) {
        const newState = JSON.parse(e.newValue);
        // Only update if the other window has a newer update
        if (newState.lastUpdated > timerState.lastUpdated) {
          setTimerState(newState);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [timerState.lastUpdated]);

  // Settings listener
  useEffect(() => {
    const handleSettingsChange = () => {
      if (!timerState.isRunning) {
        const newDuration = getSessionDuration(timerState.sessionType);
        setTimerState(prev => ({
          ...prev,
          currentTime: newDuration,
          lastUpdated: Date.now()
        }));
      }
    };
    window.addEventListener('timerSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('timerSettingsChanged', handleSettingsChange);
  }, [timerState.isRunning, timerState.sessionType, getSessionDuration]);

  return {
    ...timerState,
    startTimer,
    pauseTimer,
    resetTimer,
    switchSessionType,
    completeCurrentSession,
    progress: (() => {
      const totalDuration = getSessionDuration(timerState.sessionType);
      return totalDuration > 0
        ? ((totalDuration - timerState.currentTime) / totalDuration) * 100
        : 0;
    })(),
    isLoading: createSession.isPending || completeSession.isPending
  };
}