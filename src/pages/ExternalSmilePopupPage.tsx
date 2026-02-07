import React, { useEffect, useState } from 'react';
import { ExternalSmilePopup } from '@/components/ExternalSmilePopup';
import { useSmilePopupSettings } from '@/hooks/useChromeStorage';
import { useOfflineTimerState } from '@/hooks/useOfflineTimerState';
import { useTasks } from '@/hooks/useConvexQueries';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";

// Create a client for the popup window
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export function ExternalSmilePopupPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ExternalSmilePopupContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function ExternalSmilePopupContent() {
  const { value: smilePopupSettings, isLoading } = useSmilePopupSettings();
  const [popupData, setPopupData] = useState({
    sessionType: 'focus' as 'focus' | 'break' | 'longBreak',
    sessionCount: 1,
    taskTitle: '',
    category: 'signal' as 'signal' | 'noise',
  });

  // Fetch tasks to resolve title if needed
  const { data: tasks = [] } = useTasks();

  // Debug: Log the settings being loaded
  useEffect(() => {
    console.log('ExternalSmilePopupPage - Settings loaded:', {
      settings: smilePopupSettings,
      isLoading,
      autoClose: smilePopupSettings?.autoClose,
      closeDelay: smilePopupSettings?.closeDelay
    });
  }, [smilePopupSettings, isLoading]);

  useEffect(() => {
    // Get popup data from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let sessionType = urlParams.get('sessionType') as 'focus' | 'break' | 'longBreak';
    let sessionCount = parseInt(urlParams.get('sessionCount') || '0');
    let taskTitle = urlParams.get('taskTitle') || '';
    const taskId = urlParams.get('taskId');
    let category = (urlParams.get('category') as 'signal' | 'noise');

    // Fallback to localStorage if params are missing (e.g. opened from background)
    if (!sessionType || !sessionCount) {
      try {
        const savedState = localStorage.getItem('focus-timer-state');
        if (savedState) {
          const state = JSON.parse(savedState);
          if (!sessionType) sessionType = state.sessionType || 'focus';
          if (!sessionCount) sessionCount = state.totalSessions || 1;
          // Note: state.totalSessions might be the *next* session count if it updated already.
          // But for display, "Session X completed" implies current.
          // If TimerState updated to next session, we might want state.totalSessions. 
          // Let's assume state.totalSessions is accurate enough.

          if (!taskTitle && state.taskId) {
            // We might need to look up task title from another storage logic, 
            // but 'focus-timer-state' only has taskId.
            // For now, leave empty or try to find it? 
            // Tasks are in 'tasks-storage'? Let's keep it simple for now.
          }
        }
      } catch (e) {
        console.error("Failed to load state from local storage", e);
      }
    }

    // If we have taskId but no title, try to find it in tasks
    if (!taskTitle && taskId && tasks.length > 0) {
      const task = tasks.find((t: any) => t.id === taskId);
      if (task) {
        taskTitle = task.title;
        // Also update category if available and not set
        if (!category && task.category) category = task.category;
      }
    }

    setPopupData({
      sessionType: sessionType || 'focus',
      sessionCount: sessionCount || 1,
      taskTitle: taskTitle || '',
      category: category || 'signal',
    });

    // Set window title based on session type
    document.title = `Focus Timer - ${sessionType === 'focus' ? 'Focus' : 'Break'} Complete!`;

    // Add auto-close info to title if enabled
    if (smilePopupSettings.autoClose) {
      document.title += ` (Auto-closing in ${smilePopupSettings.closeDelay}s)`;
    }
  }, [smilePopupSettings.autoClose, smilePopupSettings.closeDelay, tasks]);

  // Integrate Timer State to handle transitions
  const {
    startTimer,
    switchSessionType,
    completeCurrentSession,
    currentTime,
    sessionType: currentSessionTypeState
  } = useOfflineTimerState();

  // Auto-process session completion if we're opening this and the timer is technically "done"
  // This ensures that valid state transitions (incrementing session count, changing type) happen
  // even if the main extension popup is closed.
  useEffect(() => {
    // If we are in the popup, and time is 0 (or just computed as 0), ensure completion logic runs.
    // useOfflineTimerState's internal interval handles this if running, but we might be paused/compueted.
    // Actually, useOfflineTimerState auto-completes if running. 
    // If we are opening this page, the background might have stopped it? 
    // Let's rely on user interaction for now, OR the hook's natural behavior.
    // If the user clicks "Start", we want to ensure we start the *next* phase.
  }, []);

  const handleStartBreak = () => {
    // The state should have naturally advanced to 'break' (or we force it)
    // If current state is still 'focus' (meaning completeSession didn't run), run it?
    // Simpler: If the URL param says we finished 'focus', we want to start 'break'.

    // If the underlying state already switched to break (via auto-complete), just start.
    if (currentSessionTypeState === 'short_break' || currentSessionTypeState === 'long_break') {
      startTimer();
    } else {
      // Force switch if needed (shouldn't be if logic works, but safe fallback)
      if (popupData.sessionType === 'focus') {
        // We finished focus, want break
        switchSessionType('short_break'); // Or compute long break.. tricky without the logic.
        // Actually, useOfflineTimerState's completeCurrentSession does the logic.
        // Let's assume completeCurrentSession ran or will run.
        // If we just want to "Proceed", maybe just Close?
        // The user wants to "Start Break". That means Start the timer.
        startTimer();
      } else {
        // Completed break, want focus
        switchSessionType('focus');
        startTimer();
      }
    }
    setTimeout(() => window.close(), 100);
  };

  const handleSkipBreak = () => {
    // User wants to skip break -> Go to Focus
    switchSessionType('focus');
    // And maybe start it? Or just prep it? Usually "Skip" implies "I want to work now".
    // Let's just switch. User can click start in dashboard/popup if they want, 
    // or maybe valid use case is "Skip break and start working".
    startTimer();
    setTimeout(() => window.close(), 100);
  };

  // Show loading state until settings are loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-lg">Loading celebration...</div>
      </div>
    );
  }

  return (
    <ExternalSmilePopup
      sessionType={popupData.sessionType}
      sessionCount={popupData.sessionCount}
      customImage={smilePopupSettings.customImage || ''}
      showQuotes={smilePopupSettings.showQuotes ?? true}
      showCelebration={smilePopupSettings.showCelebration ?? true}
      autoClose={smilePopupSettings.autoClose ?? false}
      closeDelay={smilePopupSettings.closeDelay ?? 5}
      taskTitle={popupData.taskTitle}
      category={popupData.category}
      enableSound={smilePopupSettings.enableSound}
      customSound={smilePopupSettings.customSound}
      // Pass handlers
      onStartBreak={handleStartBreak}
      onSkipBreak={handleSkipBreak}
    />
  );
}