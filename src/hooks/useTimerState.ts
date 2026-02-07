import { useCallback, useEffect } from 'react'
import { usePersistedState } from './usePersistedState'
import { useAuth } from './useAuth'
import { useCreateSession, useCompleteSession, useUserSettings } from './useConvexQueries'

export interface TimerState {
  currentTime: number
  isRunning: boolean
  sessionType: 'focus' | 'short_break' | 'long_break'
  currentSession: number
  totalSessions: number
  currentSessionId: string | null
  lastUpdated: number
}

const DEFAULT_TIMER_STATE: TimerState = {
  currentTime: 25 * 60, // 25 minutes in seconds
  isRunning: false,
  sessionType: 'focus',
  currentSession: 1,
  totalSessions: 0,
  currentSessionId: null,
  lastUpdated: Date.now()
}

/**
 * SaaS-compliant timer state management
 * - Persists across tab switches
 * - Syncs to database
 * - Handles offline/online scenarios
 * - Real-time state recovery
 */
export function useTimerState() {
  const { user } = useAuth()
  const createSession = useCreateSession()
  const completeSession = useCompleteSession()
  const { data: userSettings } = useUserSettings()

  // Persisted state that survives tab switches
  const [timerState, setTimerState] = usePersistedState<TimerState>(
    'focus-timer-state',
    DEFAULT_TIMER_STATE,
    {
      syncToDatabase: true,
      syncInterval: 10000, // Sync every 10 seconds
      storageType: 'localStorage'
    }
  )

  // Get duration based on session type and user settings
  const getSessionDuration = useCallback((sessionType: TimerState['sessionType']) => {
    if (!userSettings) {
      // Default durations
      switch (sessionType) {
        case 'focus': return 25 * 60
        case 'short_break': return 5 * 60
        case 'long_break': return 15 * 60
      }
    }

    switch (sessionType) {
      case 'focus': return userSettings.focus_duration * 60
      case 'short_break': return userSettings.short_break_duration * 60
      case 'long_break': return userSettings.long_break_duration * 60
    }
  }, [userSettings])

  // Start timer with database session creation
  const startTimer = useCallback(async () => {
    if (!user) return

    try {
      // Create session in database
      const sessionId = await createSession.mutateAsync({
        user_id: user.id,
        session_type: timerState.sessionType,
        duration_minutes: Math.floor(timerState.currentTime / 60),
        completed: false
      })

      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        currentSessionId: sessionId,
        lastUpdated: Date.now()
      }))
    } catch (error) {
      console.error('Failed to create session:', error)
      // Still allow local timer to start
      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        lastUpdated: Date.now()
      }))
    }
  }, [user, timerState.sessionType, timerState.currentTime, createSession, setTimerState])

  // Pause timer
  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      lastUpdated: Date.now()
    }))
  }, [setTimerState])

  // Complete session with database update
  const completeCurrentSession = useCallback(async () => {
    if (!user || !timerState.currentSessionId) return

    try {
      await completeSession.mutateAsync(timerState.currentSessionId)

      // Determine next session type
      const sessionsUntilLongBreak = userSettings?.sessions_until_long_break || 4
      const isLongBreakTime = timerState.currentSession % sessionsUntilLongBreak === 0

      let nextSessionType: TimerState['sessionType']
      if (timerState.sessionType === 'focus') {
        nextSessionType = isLongBreakTime ? 'long_break' : 'short_break'
      } else {
        nextSessionType = 'focus'
      }

      const nextDuration = getSessionDuration(nextSessionType)

      setTimerState(prev => ({
        ...prev,
        currentTime: nextDuration,
        isRunning: false,
        sessionType: nextSessionType,
        currentSession: timerState.sessionType === 'focus' ? prev.currentSession + 1 : prev.currentSession,
        totalSessions: timerState.sessionType === 'focus' ? prev.totalSessions + 1 : prev.totalSessions,
        currentSessionId: null,
        lastUpdated: Date.now()
      }))
    } catch (error) {
      console.error('Failed to complete session:', error)
    }
  }, [user, timerState, completeSession, userSettings, getSessionDuration, setTimerState])

  // Reset timer
  const resetTimer = useCallback(() => {
    const duration = getSessionDuration(timerState.sessionType)
    setTimerState(prev => ({
      ...prev,
      currentTime: duration,
      isRunning: false,
      currentSessionId: null,
      lastUpdated: Date.now()
    }))
  }, [timerState.sessionType, getSessionDuration, setTimerState])

  // Switch session type
  const switchSessionType = useCallback((newType: TimerState['sessionType']) => {
    const duration = getSessionDuration(newType)
    setTimerState(prev => ({
      ...prev,
      sessionType: newType,
      currentTime: duration,
      isRunning: false,
      currentSessionId: null,
      lastUpdated: Date.now()
    }))
  }, [getSessionDuration, setTimerState])

  // Timer tick effect - handles time recovery after tab switches
  useEffect(() => {
    if (!timerState.isRunning) return

    const interval = setInterval(() => {
      setTimerState(prev => {
        const now = Date.now()
        const timeSinceLastUpdate = Math.floor((now - prev.lastUpdated) / 1000)
        const newTime = Math.max(0, prev.currentTime - timeSinceLastUpdate)

        // Auto-complete session when time reaches 0
        if (newTime === 0 && prev.currentTime > 0) {
          completeCurrentSession()
          return prev // Don't update state here, completeCurrentSession will handle it
        }

        return {
          ...prev,
          currentTime: newTime,
          lastUpdated: now
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerState.isRunning, setTimerState, completeCurrentSession])

  // Recover state on component mount (handle tab switches)
  useEffect(() => {
    if (timerState.isRunning && timerState.lastUpdated) {
      const now = Date.now()
      const timeSinceLastUpdate = Math.floor((now - timerState.lastUpdated) / 1000)

      if (timeSinceLastUpdate > 0) {
        const newTime = Math.max(0, timerState.currentTime - timeSinceLastUpdate)

        setTimerState(prev => ({
          ...prev,
          currentTime: newTime,
          lastUpdated: now
        }))

        // If time expired while away, complete the session
        if (newTime === 0 && timerState.currentTime > 0) {
          completeCurrentSession()
        }
      }
    }
  }, []) // Only run on mount

  // Listen for settings changes and update timer duration if not running
  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent) => {
      const newSettings = event.detail;

      // Only update timer duration if timer is not currently running
      if (!timerState.isRunning) {
        const newDuration = getSessionDuration(timerState.sessionType);
        setTimerState(prev => ({
          ...prev,
          currentTime: newDuration,
          lastUpdated: Date.now()
        }));
      }
    };

    window.addEventListener('timerSettingsChanged', handleSettingsChange as EventListener);

    return () => {
      window.removeEventListener('timerSettingsChanged', handleSettingsChange as EventListener);
    };
  }, [timerState.isRunning, timerState.sessionType, getSessionDuration, setTimerState])

  // Update timer duration when user settings change (and timer is not running)
  useEffect(() => {
    if (userSettings && !timerState.isRunning) {
      const newDuration = getSessionDuration(timerState.sessionType);
      if (newDuration !== timerState.currentTime) {
        setTimerState(prev => ({
          ...prev,
          currentTime: newDuration,
          lastUpdated: Date.now()
        }));
      }
    }
  }, [userSettings, timerState.isRunning, timerState.sessionType, timerState.currentTime, getSessionDuration, setTimerState])

  return {
    // State
    ...timerState,

    // Actions
    startTimer,
    pauseTimer,
    resetTimer,
    switchSessionType,
    completeCurrentSession,

    // Computed values
    progress: timerState.currentTime > 0
      ? ((getSessionDuration(timerState.sessionType) - timerState.currentTime) / getSessionDuration(timerState.sessionType)) * 100
      : 100,

    // Status
    isLoading: createSession.isPending || completeSession.isPending
  }
}