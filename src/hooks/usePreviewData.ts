import { useState, useEffect } from 'react';
import { usePreviewMode } from '@/components/PreviewMode';
import PreviewDataService, { 
  PreviewTask, 
  PreviewSession, 
  PreviewGoal, 
  PreviewQuote 
} from '@/services/previewDataService';

// Hook for preview tasks
export const usePreviewTasks = () => {
  const { isPreviewMode } = usePreviewMode();
  const [tasks, setTasks] = useState<PreviewTask[]>([]);
  const previewService = PreviewDataService.getInstance();

  useEffect(() => {
    if (isPreviewMode) {
      setTasks(previewService.getTasks());
    }
  }, [isPreviewMode]);

  const addTask = (task: Omit<PreviewTask, 'id' | 'createdAt'>) => {
    if (!isPreviewMode) return null;
    const newTask = previewService.addTask(task);
    setTasks(previewService.getTasks());
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<PreviewTask>) => {
    if (!isPreviewMode) return null;
    const updatedTask = previewService.updateTask(id, updates);
    setTasks(previewService.getTasks());
    return updatedTask;
  };

  const deleteTask = (id: string) => {
    if (!isPreviewMode) return false;
    const success = previewService.deleteTask(id);
    setTasks(previewService.getTasks());
    return success;
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    
    return updateTask(id, { 
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : undefined
    });
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    isLoading: false,
    error: null
  };
};

// Hook for preview sessions
export const usePreviewSessions = () => {
  const { isPreviewMode } = usePreviewMode();
  const [sessions, setSessions] = useState<PreviewSession[]>([]);
  const previewService = PreviewDataService.getInstance();

  useEffect(() => {
    if (isPreviewMode) {
      setSessions(previewService.getSessions());
    }
  }, [isPreviewMode]);

  const addSession = (session: Omit<PreviewSession, 'id'>) => {
    if (!isPreviewMode) return null;
    const newSession = previewService.addSession(session);
    setSessions(previewService.getSessions());
    return newSession;
  };

  return {
    sessions,
    addSession,
    isLoading: false,
    error: null
  };
};

// Hook for preview goals
export const usePreviewGoals = () => {
  const { isPreviewMode } = usePreviewMode();
  const [goals, setGoals] = useState<PreviewGoal[]>([]);
  const previewService = PreviewDataService.getInstance();

  useEffect(() => {
    if (isPreviewMode) {
      setGoals(previewService.getGoals());
    }
  }, [isPreviewMode]);

  const addGoal = (goal: Omit<PreviewGoal, 'id'>) => {
    if (!isPreviewMode) return null;
    const newGoal = previewService.addGoal(goal);
    setGoals(previewService.getGoals());
    return newGoal;
  };

  const updateGoal = (id: string, updates: Partial<PreviewGoal>) => {
    if (!isPreviewMode) return null;
    const updatedGoal = previewService.updateGoal(id, updates);
    setGoals(previewService.getGoals());
    return updatedGoal;
  };

  const deleteGoal = (id: string) => {
    if (!isPreviewMode) return false;
    const success = previewService.deleteGoal(id);
    setGoals(previewService.getGoals());
    return success;
  };

  return {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    isLoading: false,
    error: null
  };
};

// Hook for preview quotes
export const usePreviewQuotes = () => {
  const { isPreviewMode } = usePreviewMode();
  const [quotes, setQuotes] = useState<PreviewQuote[]>([]);
  const previewService = PreviewDataService.getInstance();

  useEffect(() => {
    if (isPreviewMode) {
      setQuotes(previewService.getQuotes());
    }
  }, [isPreviewMode]);

  const addQuote = (quote: Omit<PreviewQuote, 'id' | 'createdAt'>) => {
    if (!isPreviewMode) return null;
    const newQuote = previewService.addQuote(quote);
    setQuotes(previewService.getQuotes());
    return newQuote;
  };

  const updateQuote = (id: string, updates: Partial<PreviewQuote>) => {
    if (!isPreviewMode) return null;
    const updatedQuote = previewService.updateQuote(id, updates);
    setQuotes(previewService.getQuotes());
    return updatedQuote;
  };

  const deleteQuote = (id: string) => {
    if (!isPreviewMode) return false;
    const success = previewService.deleteQuote(id);
    setQuotes(previewService.getQuotes());
    return success;
  };

  const toggleFavorite = (id: string) => {
    const quote = quotes.find(q => q.id === id);
    if (!quote) return null;
    
    return updateQuote(id, { isFavorite: !quote.isFavorite });
  };

  return {
    quotes,
    addQuote,
    updateQuote,
    deleteQuote,
    toggleFavorite,
    isLoading: false,
    error: null
  };
};

// Hook for preview analytics
export const usePreviewAnalytics = () => {
  const { isPreviewMode } = usePreviewMode();
  const [stats, setStats] = useState<any>(null);
  const previewService = PreviewDataService.getInstance();

  useEffect(() => {
    if (isPreviewMode) {
      setStats(previewService.getProductivityStats());
    }
  }, [isPreviewMode]);

  const refreshStats = () => {
    if (isPreviewMode) {
      setStats(previewService.getProductivityStats());
    }
  };

  return {
    stats,
    refreshStats,
    isLoading: false,
    error: null
  };
};

// Hook for preview user profile
export const usePreviewProfile = () => {
  const { isPreviewMode, previewUser } = usePreviewMode();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (isPreviewMode) {
      setProfile({
        ...previewUser,
        preferences: {
          theme: 'light',
          notifications: true,
          soundEnabled: true,
          focusDuration: 25,
          shortBreak: 5,
          longBreak: 15,
          autoStartBreaks: false,
          autoStartPomodoros: false
        },
        stats: PreviewDataService.getInstance().getProductivityStats()
      });
    }
  }, [isPreviewMode, previewUser]);

  const updateProfile = (updates: any) => {
    if (!isPreviewMode) return null;
    setProfile((prev: any) => ({ ...prev, ...updates }));
    return profile;
  };

  return {
    profile,
    updateProfile,
    isLoading: false,
    error: null
  };
};