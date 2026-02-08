import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";
import { adaptConvexTask, adaptConvexQuote } from "../lib/adapters";

// --- Session Hooks ---
export const useSessions = (limit = 50) => {
  const { user } = useAuth();
  const sessions = useQuery(api.sessions.getUserSessions, user ? { userId: user.id, limit } : "skip");
  // Sessions don't need adapters yet as they are simple, but good practice to add later if needed.
  return { data: sessions, isLoading: !sessions, refetch: () => { } };
};

export const useSessionStats = (dateFrom?: string, dateTo?: string) => {
  // Convex doesn't support complex date filtering in this first pass query easily
  // defaulting to "today" logic managed in the API or separate return
  // For now, returning null/loading as placeholder or implementing specific API if needed.
  // We implemented getTodayStats in sessions.ts
  const { user } = useAuth();
  const stats = useQuery(api.sessions.getTodayStats, user ? { userId: user.id } : "skip");
  // Polyfill signalToNoiseRatio for frontend compatibility
  const adaptedStats = stats ? { ...stats, signalToNoiseRatio: { signal: 0, noise: 0, ratio: 0 } } : null;
  return { data: adaptedStats, isLoading: !stats, refetch: () => { } }; // Adapter matching old shape roughly
};

export const useTodaySessions = () => {
  const { user } = useAuth();
  // We can reuse getUserSessions and filter locally if strictly needed, or use the dedicated endpoint
  // Using getUserSessions (limit 100) and filtering in client for now to match exactly
  const sessions = useQuery(api.sessions.getUserSessions, user ? { userId: user.id, limit: 100 } : "skip");

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
    mutate: (data: any) => complete({ id: data.sessionId }), // Adapter
    mutateAsync: (data: any) => complete({ id: data.sessionId }),
    isPending: false
  };
};

// --- Task Hooks ---
export const useTasks = (completed?: boolean) => {
  const { user } = useAuth();
  const tasks = useQuery(api.tasks.getTasks, user ? { userId: user.id, completed } : "skip");
  return { data: tasks?.map(adaptConvexTask) || [], isLoading: !tasks, refetch: () => { } };
};

export const useTasksDueToday = () => {
  const { user } = useAuth();
  const tasks = useQuery(api.tasks.getTasks, user ? { userId: user.id, completed: false } : "skip");
  const today = new Date().toISOString().split('T')[0];
  const dueToday = tasks?.filter(t => t.due_date === today) || [];
  return { data: dueToday, isLoading: !tasks };
};

export const useOverdueTasks = () => {
  const { user } = useAuth();
  const tasks = useQuery(api.tasks.getTasks, user ? { userId: user.id, completed: false } : "skip");
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
  // If userId is passed, we use it. If not, we might fall back to auth user?
  // Old logic: internal userId or passed userId.
  const quotes = useQuery(api.quotes.getQuotes, { userId, category: category === 'all' ? undefined : category });
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
  // Reusing getQuotes with userId forces custom quotes per our implementation
  const quotes = useQuery(api.quotes.getQuotes, user ? { userId: user.id } : "skip");
  return { data: quotes || [], isLoading: !quotes };
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
  const favorites = useQuery(api.favorites.getFavorites, user ? { userId: user.id } : "skip");
  // Return array of quote IDs
  return { data: favorites?.map(f => f.quote_id) || [], isLoading: !favorites, refetch: () => { } };
};

export const useToggleFavorite = () => {
  const toggle = useMutation(api.favorites.toggleFavorite);
  return { mutateAsync: (data: { quoteId: string, userId: string }) => toggle({ user_id: data.userId, quote_id: data.quoteId }), isPending: false }; // Adapter
};

export const useSyncFavorites = () => {
  const sync = useMutation(api.favorites.syncFavorites);
  return { mutateAsync: sync, isPending: false };
};

// --- Playlist Hooks ---
export const usePlaylists = () => {
  const { user } = useAuth();
  const playlists = useQuery(api.playlists.getPlaylists, user ? { userId: user.id } : "skip");
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
  const profile = useQuery(api.users.getUser, user ? { id: user.id } : "skip");
  return { data: profile, isLoading: !profile, refetch: () => { } };
};

export const useUpdateUserProfile = () => {
  // ensureUser handles updates
  const update = useMutation(api.users.ensureUser);
  return { mutateAsync: update, isPending: false };
};

// ... Placeholders for other hooks to prevent build eerrors ...
// ... Placeholders for other hooks to prevent build eerrors ...
export const useUserPreferences = (...args: any[]) => ({ data: null, isLoading: false, refetch: () => { } });
export const useUpdateUserPreferences = () => ({ mutateAsync: async (...args: any[]) => { }, isPending: false });
export const useUserStatistics = (...args: any[]) => ({ data: null, isLoading: false, refetch: () => { } });
export const useUserAchievements = (...args: any[]) => ({ data: [], isLoading: false, refetch: () => { } });
export const useUnlockAchievement = () => ({ mutateAsync: async (...args: any[]) => { }, isPending: false });
export const useUserGoals = (...args: any[]) => ({ data: [], isLoading: false, refetch: () => { } });
export const useCreateUserGoal = () => ({ mutateAsync: async (...args: any[]) => { return { id: "temp-goal-id" }; }, isPending: false });
export const useUpdateGoalProgress = () => ({ mutateAsync: async (...args: any[]) => { }, isPending: false });
export const useUserActivityLog = (...args: any[]) => ({ data: [], isLoading: false, refetch: () => { } });
export const useChatConversations = (...args: any[]) => ({ data: [], isLoading: false, refetch: () => { } });
export const useActiveConversation = (...args: any[]) => ({ data: null, isLoading: false, refetch: () => { } });
export const useConversationMessages = (...args: any[]) => ({ data: [], isLoading: false, refetch: () => { } });
export const useAddChatMessage = () => ({ mutateAsync: async (...args: any[]) => { }, isPending: false, mutate: (...args: any[]) => { } });
export const useCreateConversation = () => ({ mutateAsync: async (...args: any[]) => { return { id: "temp-conv-id" }; }, isPending: false });
export const useArchiveConversation = () => ({ mutateAsync: async (...args: any[]) => { }, isPending: false });
export const useDeleteConversation = () => ({ mutateAsync: async (...args: any[]) => { }, isPending: false });
export const useChatStats = (...args: any[]) => ({ data: null, isLoading: false, refetch: () => { } });
export const useUserSettings = (...args: any[]) => ({ data: null, isLoading: false, refetch: () => { } });
export const useUpdateUserSettings = () => ({ mutateAsync: async (...args: any[]) => { }, isPending: false });
