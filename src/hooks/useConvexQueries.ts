import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";
import { adaptConvexTask, adaptConvexQuote } from "../lib/adapters";

// --- Session Hooks ---
export const useSessions = (limit = 50) => {
  const { user } = useAuth();
  const sessions = useQuery(api.sessions.getUserSessions, user ? { limit } : "skip");
  // Sessions don't need adapters yet as they are simple, but good practice to add later if needed.
  return { data: sessions, isLoading: !sessions, refetch: () => { } };
};

// --- Analytics & Stats ---
export const useOverallAnalytics = () => {
  const { user } = useAuth();
  const analytics = useQuery(api.user_service.getOverallAnalytics, user ? {} : "skip");
  return {
    data: analytics || null,
    isLoading: analytics === undefined
  };
};

export const useSessionStats = (dateFrom?: string, dateTo?: string) => {
  // Use the new powerful analytics endpoint instead of legacy one
  const { data: analytics, isLoading } = useOverallAnalytics();

  // Adapt to old interface if needed, or better yet, return the new rich data
  // The old interface expected: { signalToNoiseRatio: ... }
  // We can derive this from the new data if needed

  return {
    data: analytics, // Now returns full { summary, charts, goals, recentSessions }
    isLoading,
    refetch: () => { }
  };
};

export const useTodaySessions = () => {
  const { user } = useAuth();
  // We can reuse getUserSessions and filter locally if strictly needed, or use the dedicated endpoint
  // Using getUserSessions (limit 100) and filtering in client for now to match exactly
  const sessions = useQuery(api.sessions.getUserSessions, user ? { limit: 100 } : "skip");

  // Client-side filter for "today"
  const today = new Date().toISOString().split('T')[0];
  const todayData = sessions?.filter(s => s.created_at.startsWith(today)) || [];

  return { data: todayData, isLoading: !sessions, refetch: () => { } };
};

export const useCreateSession = () => {
  const create = useMutation(api.sessions.createSession);
  return {
    mutate: (data: any) => create(data),
    mutateAsync: (data: any) => create(data), // Convex mutations are async by default
    isPending: false
  };
};

export const useCompleteSession = () => {
  const complete = useMutation(api.sessions.completeSession);
  return {
    mutate: (data: any) => {
      console.log('useCompleteSession mutate:', data);
      let id = data;
      if (typeof data === 'object' && data !== null) {
        id = data.sessionId || data.id || data._id;
      }
      if (!id) console.error("useCompleteSession: Missing ID from data", data);
      return complete({ id });
    },
    mutateAsync: (data: any) => {
      console.log('useCompleteSession mutateAsync:', data);
      let id = data;
      if (typeof data === 'object' && data !== null) {
        id = data.sessionId || data.id || data._id;
      }
      if (!id) console.error("useCompleteSession: Missing ID from data", data);
      return complete({ id });
    },
    isPending: false
  };
};

// --- Task Hooks ---
export const useTasks = (completed?: boolean) => {
  const { user } = useAuth();
  const tasks = useQuery(api.tasks.getTasks, user ? { completed } : "skip");
  return { data: tasks?.map(adaptConvexTask) || [], isLoading: !tasks, refetch: () => { } };
};

export const useTasksDueToday = () => {
  const { user } = useAuth();
  const tasks = useQuery(api.tasks.getTasks, user ? { completed: false } : "skip");
  const today = new Date().toISOString().split('T')[0];
  const dueToday = tasks?.filter(t => t.due_date === today) || [];
  return { data: dueToday, isLoading: !tasks };
};

export const useOverdueTasks = () => {
  const { user } = useAuth();
  const tasks = useQuery(api.tasks.getTasks, user ? { completed: false } : "skip");
  const today = new Date().toISOString().split('T')[0];
  const overdue = tasks?.filter(t => t.due_date && t.due_date < today) || [];
  return { data: overdue, isLoading: !tasks };
};

export const useCreateTask = () => {
  const create = useMutation(api.tasks.createTask);
  return { mutateAsync: create, isPending: false };
};

export const useUpdateTask = () => {
  const update = useMutation(api.tasks.updateTask);
  return { mutateAsync: update, isPending: false };
};

export const useToggleTask = () => {
  const toggle = useMutation(api.tasks.toggleTask);
  return {
    mutateAsync: (data: { taskId: any; completed: boolean }) =>
      toggle({ id: data.taskId, completed: data.completed }),
    isPending: false
  };
};

export const useDeleteTask = () => {
  const remove = useMutation(api.tasks.deleteTask);
  return { mutateAsync: (taskId: any) => remove({ id: taskId }), isPending: false };
};

// --- Quote Hooks ---
export const useQuotes = (userId?: string, category?: string) => {
  // userId arg is now ignored as backend uses auth context
  const quotes = useQuery(api.quotes.getQuotes, { category: category === 'all' ? undefined : category });
  return { data: quotes?.map(adaptConvexQuote) || [], isLoading: !quotes, refetch: () => { } };
};

export const useRandomQuote = (category?: string) => {
  // We don't have a random endpoint, we fetch all and pick one client side??
  // Or we fetch quotes and pick one.
  // Ideally we make a getRandomQuote query.
  // For now, reusing getQuotes and randomizing.
  const quotes = useQuery(api.quotes.getQuotes, { category });

  // Memoize or select random? 
  // This hook expects { data: Quote }.
  // We return a loading state until quotes are ready.
  if (!quotes) return { data: null, isLoading: true };
  const random = quotes.length > 0 ? quotes[Math.floor(Math.random() * quotes.length)] : null;
  return { data: random, isLoading: false };
};

export const useUserCustomQuotes = () => {
  const { user } = useAuth();
  // Fetch quotes (backend now handles "my custom quotes" via auth context)
  // However, getQuotes returns public + my custom.
  // We want ONLY custom?
  // The backend implementation of getQuotes returns public + custom if logged in.
  // We might need to filter client-side if we strictly want only custom.
  // Schema: is_custom is true for custom quotes.
  const quotes = useQuery(api.quotes.getQuotes, user ? {} : "skip");

  const customOnly = quotes?.filter((q: any) => q.is_custom) || [];
  return { data: customOnly, isLoading: !quotes };
};

export const useCreateQuote = () => {
  const create = useMutation(api.quotes.createQuote);
  return { mutateAsync: create, isPending: false };
};

export const useDeleteQuote = () => {
  const remove = useMutation(api.quotes.deleteQuote);
  return { mutateAsync: (quoteId: any) => remove({ id: quoteId }), isPending: false };
};

export const useUpdateQuote = () => {
  const update = useMutation(api.quotes.updateQuote);
  return { mutateAsync: update, isPending: false };
};

// --- Favorites Hooks ---
export const useFavorites = () => {
  const { user } = useAuth();
  const favorites = useQuery(api.favorites.getFavorites, user ? {} : "skip");
  // Return array of quote IDs
  return { data: favorites?.map(f => f.quote_id) || [], isLoading: !favorites, refetch: () => { } };
};

export const useToggleFavorite = () => {
  const toggle = useMutation(api.favorites.toggleFavorite);
  return { mutateAsync: (data: { quoteId: string, userId: string }) => toggle({ quote_id: data.quoteId }), isPending: false }; // Adapter
};

export const useSyncFavorites = () => {
  const sync = useMutation(api.favorites.syncFavorites);
  return { mutateAsync: (data: { quote_ids: string[], user_id: string }) => sync({ quote_ids: data.quote_ids }), isPending: false };
};

// --- Playlist Hooks ---
export const usePlaylists = () => {
  const { user } = useAuth();
  const playlists = useQuery(api.playlists.getPlaylists, user ? {} : "skip");
  // Adapt to frontend Playlist interface
  const adaptedPlaylists = playlists?.map(p => ({
    id: p._id,
    name: p.name,
    quoteIds: p.quote_ids,
    createdAt: p.created_at
  })) || [];
  return { data: adaptedPlaylists, isLoading: !playlists, refetch: () => { } };
};

export const useCreatePlaylist = () => {
  const create = useMutation(api.playlists.createPlaylist);
  return { mutateAsync: create, isPending: false };
};

export const useDeletePlaylist = () => {
  const remove = useMutation(api.playlists.deletePlaylist);
  return { mutateAsync: (id: any) => remove({ id }), isPending: false };
};

export const useUpdatePlaylist = () => {
  const update = useMutation(api.playlists.updatePlaylist);
  return { mutateAsync: update, isPending: false };
};

export const useAddToPlaylist = () => {
  const add = useMutation(api.playlists.addQuoteToPlaylist);
  return { mutateAsync: (data: { playlistId: any, quoteId: string }) => add({ playlist_id: data.playlistId, quote_id: data.quoteId }), isPending: false };
};

export const useRemoveFromPlaylist = () => {
  const remove = useMutation(api.playlists.removeQuoteFromPlaylist);
  return { mutateAsync: (data: { playlistId: any, quoteId: string }) => remove({ playlist_id: data.playlistId, quote_id: data.quoteId }), isPending: false };
};


// --- User Profile ---
export const useUserProfile = () => {
  const { user } = useAuth();
  const profile = useQuery(api.user_service.getUserProfile, user ? {} : "skip");
  return { data: profile, isLoading: profile === undefined, refetch: () => { } };
};

export const useUpdateUserProfile = () => {
  // ensureUser handles updates
  const update = useMutation(api.user_service.createUserProfile);
  return { mutateAsync: update, isPending: false };
};

// ... Placeholders for other hooks to prevent build eerrors ...
// ... Placeholders for other hooks to prevent build eerrors ...
export const useUserPreferences = (...args: any[]) => ({ data: null, isLoading: false, refetch: () => { } });
export const useUpdateUserPreferences = () => ({ mutateAsync: async (...args: any[]) => { }, isPending: false });
export const useUserStatistics = (...args: any[]) => ({ data: null, isLoading: false, refetch: () => { } });
export const useUserAchievements = () => {
  const { user } = useAuth();
  const achievements = useQuery(api.user_service.getUserAchievements, user ? {} : "skip");
  return { data: achievements || [], isLoading: !achievements, refetch: () => { } };
};
export const useUnlockAchievement = () => ({ mutateAsync: async (...args: any[]) => { }, isPending: false });
export const useUserGoals = (showCompleted?: boolean) => {
  const { user } = useAuth();
  // If showCompleted is undefined, fetch all. If true, logic might differ but backend handles optional arg.
  // The backend arg is 'completed'. Front end arg is 'showCompleted'.
  // We assume showCompleted=true means ALL? Or just completed?
  // UseUserGoals is often used to show a list.
  // Let's pass undefined to see all by default.
  const goals = useQuery(api.user_service.getUserGoals, user ? {} : "skip");
  return { data: goals || [], isLoading: !goals, refetch: () => { } };
};
export const useCreateUserGoal = () => ({ mutateAsync: async (...args: any[]) => { return { id: "temp-goal-id" }; }, isPending: false });
export const useUpdateGoalProgress = () => ({ mutateAsync: async (...args: any[]) => { }, isPending: false });
export const useUserActivityLog = () => {
  const { user } = useAuth();
  const logs = useQuery(api.user_service.getUserActivityLog, user ? {} : "skip");
  return { data: logs || [], isLoading: !logs, refetch: () => { } };
};
// --- Chat Hooks ---
export const useChatConversations = () => {
  const { user } = useAuth();
  const conversations = useQuery(api.chats.getConversations, user ? {} : "skip");
  return { data: conversations || [], isLoading: !conversations };
};

export const useActiveConversation = (conversationId?: string) => {
  const { user } = useAuth();
  // If ID is provided, fetch it; else fetch most recent
  const conversation = useQuery(api.chats.getActiveConversation, user ? { conversationId } : "skip");
  return { data: conversation, isLoading: !conversation };
};

export const useConversationMessages = (conversationId?: string) => {
  const { user } = useAuth();
  const messages = useQuery(api.chats.getMessages, user && conversationId ? { conversationId } : "skip");
  return { data: messages || [], isLoading: !messages };
};

export const useAddChatMessage = () => {
  const mu = useMutation(api.chats.addMessage);
  return { mutateAsync: mu, mutate: mu, isPending: false };
};

export const useCreateConversation = () => {
  const mu = useMutation(api.chats.createConversation);
  return { mutateAsync: mu, isPending: false };
};

export const useArchiveConversation = () => {
  const mu = useMutation(api.chats.archiveConversation);
  return { mutateAsync: mu, isPending: false };
};

export const useDeleteConversation = () => {
  const mu = useMutation(api.chats.deleteConversation);
  return { mutateAsync: mu, isPending: false };
};

export const useChatStats = () => {
  const { user } = useAuth();
  const stats = useQuery(api.chats.getChatStats, user ? {} : "skip");
  return { data: stats || { totalConversations: 0, totalMessages: 0 }, isLoading: !stats };
}

export const useUserSettings = (...args: any[]) => ({ data: null, isLoading: false, refetch: () => { } });
export const useUpdateUserSettings = () => ({ mutateAsync: async (...args: any[]) => { }, isPending: false });
