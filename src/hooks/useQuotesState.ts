import { useCallback, useEffect } from 'react'
import { usePersistedState } from './usePersistedState'
import { useQuotes, useRandomQuote, useUserCustomQuotes, useCreateQuote, useUpdateQuote, useDeleteQuote, useFavorites, useToggleFavorite, useSyncFavorites, usePlaylists, useCreatePlaylist, useDeletePlaylist, useAddToPlaylist, useRemoveFromPlaylist, useUpdatePlaylist } from './useConvexQueries'
import { useAuth } from './useAuth'

import { generateGeminiResponse } from '@/lib/gemini'
import { useGeminiSettings } from '@/hooks/useGeminiSettings'

import { Id } from "../../convex/_generated/dataModel";

export interface LocalQuote {
  id: string
  content: string
  author: string | null
  category: string | null
  is_custom: boolean
  isFavorite?: boolean
  isAiGenerated?: boolean
  created_at: string
  isLocal?: boolean // Flag for offline-created quotes
}

export interface Playlist {
  id: string
  name: string
  quoteIds: string[]
  createdAt: string
}

interface QuotesState {
  localQuotes: LocalQuote[]
  selectedCategory: string
  searchTerm: string
  favorites: string[]
  sortBy: 'newest' | 'oldest' | 'author' | 'custom'
  customOrder: string[]
  // Playlist features
  playlists: Playlist[]
  activePlaylistId: string | null
  playlistProgress: Record<string, number> // Maps playlistId -> last shown index
  cachedPlaylistQuotes: LocalQuote[] // Cache for popup instant access
}

const DEFAULT_QUOTES_STATE: QuotesState = {
  localQuotes: [],
  selectedCategory: 'all',
  searchTerm: '',
  favorites: [],
  sortBy: 'custom',
  customOrder: [],
  playlists: [],
  activePlaylistId: null,
  cachedPlaylistQuotes: [], // Default empty cache
  playlistProgress: {}
}

/**
 * SaaS-compliant quotes state management
 * - Offline-first approach
 * - Optimistic updates
 * - Automatic sync with database
 * - AI quote generation
 * - Favorites management
 */
export function useQuotesState() {
  const { user } = useAuth()
  const { settings: geminiSettings } = useGeminiSettings()

  // Database queries
  const { data: remoteQuotes = [], isLoading } = useQuotes(user?.id)
  const { data: userCustomQuotes = [] } = useUserCustomQuotes()
  const createQuote = useCreateQuote()
  const updateQuote = useUpdateQuote()
  const deleteQuote = useDeleteQuote()

  // Favorites & Playlists (Convex)
  const { data: remoteFavorites = [] } = useFavorites()
  const { data: remotePlaylists = [] } = usePlaylists()

  const toggleFavoriteMutation = useToggleFavorite()
  const syncFavoritesMutation = useSyncFavorites()
  const createPlaylistMutation = useCreatePlaylist()
  const deletePlaylistMutation = useDeletePlaylist()
  const addToPlaylistMutation = useAddToPlaylist()
  const removeFromPlaylistMutation = useRemoveFromPlaylist()

  // Local state that persists across sessions
  const [quotesState, setQuotesState] = usePersistedState<QuotesState>(
    'quotes-state',
    DEFAULT_QUOTES_STATE,
    {
      syncToDatabase: true,
      storageType: 'localStorage'
    }
  )

  // AUTO-ACTIVATE REMOVED to allow manual deactivation
  // We only auto-activate on creation now (see createPlaylist)

  // Merge local and remote quotes, prioritizing remote for conflicts
  // Merge local, remote, and cached quotes, prioritizing remote for conflicts
  const allQuotes = useCallback(() => {
    const localQuotes = quotesState.localQuotes || [];
    // favorites declared below
    const customOrder = quotesState.customOrder || [];
    const remote = remoteQuotes || [];
    const cached = quotesState.cachedPlaylistQuotes || [];

    // Merge remote favorites if logged in, otherwise use local
    const mergedFavorites = user ? remoteFavorites : (quotesState.favorites || []);

    // Use remote quotes if available, otherwise fall back to cached quotes
    // This ensures popup can access quotes even when logged out
    const sourceQuotes = remote.length > 0 ? remote : cached;

    console.log('[allQuotes] Data sources:', {
      remoteCount: remote.length,
      cachedCount: cached.length,
      localCount: localQuotes.length,
      finalSource: remote.length > 0 ? 'remote' : (cached.length > 0 ? 'cached' : 'local'),
      userLoggedIn: !!user
    });

    const sourceQuoteIds = new Set(sourceQuotes.map((q: any) => q.id || q._id));
    const localOnlyQuotes = localQuotes.filter(q => !sourceQuoteIds.has(q.id));

    // Convert source quotes to LocalQuote format
    const formattedSourceQuotes: LocalQuote[] = sourceQuotes.map((q: any) => ({
      id: q.id || q._id,
      content: q.content,
      author: q.author,
      category: q.category,
      is_custom: q.is_custom,
      isFavorite: mergedFavorites.includes(q.id || q._id),
      isAiGenerated: q.category === 'AI Generated',
      created_at: q.created_at,
      isLocal: false
    }));

    return [...formattedSourceQuotes, ...localOnlyQuotes].sort((a, b) => {
      const indexA = customOrder.indexOf(a.id);
      const indexB = customOrder.indexOf(b.id);

      switch (quotesState.sortBy) {
        case 'custom':
          // If both have order, sort by index
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          // If only one, put it first
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          // Fallback to created date
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'author':
          return (a.author || '').localeCompare(b.author || '');
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    })
  }, [remoteQuotes, quotesState.localQuotes, quotesState.cachedPlaylistQuotes, quotesState.favorites, quotesState.sortBy, quotesState.customOrder, user])

  // Get random quote
  const getRandomQuote = useCallback(() => {
    const quotes = allQuotes()
    if (!quotes || quotes.length === 0) return null

    const randomIndex = Math.floor(Math.random() * quotes.length)
    return quotes[randomIndex]
  }, [allQuotes])



  // Sync local quotes to database (for offline-created quotes)
  const syncLocalQuotes = useCallback(async () => {
    if (!user) return

    // 1. Sync Quotes
    const localQuotes = (quotesState.localQuotes || []).filter(q => q.isLocal)

    for (const localQuote of localQuotes) {
      try {
        await createQuote.mutateAsync({
          user_id: user.id,
          content: localQuote.content,
          author: localQuote.author,
          category: localQuote.category,
          is_custom: true
        })

        // Remove from local quotes after successful sync
        setQuotesState(prev => ({
          ...prev,
          localQuotes: (prev.localQuotes || []).filter(q => q.id !== localQuote.id)
        }))
      } catch (error) {
        console.error('Failed to sync local quote:', error)
      }
    }

    // 2. Sync Favorites
    const localFavorites = quotesState.favorites || [];
    if (localFavorites.length > 0) {
      try {
        await syncFavoritesMutation.mutateAsync({ user_id: user.id, quote_ids: localFavorites });
        // Clear local favorites as we now rely on remote
        setQuotesState(prev => ({ ...prev, favorites: [] }));
      } catch (error) {
        console.error("Failed to sync favorites:", error);
      }
    }
  }, [user, quotesState.localQuotes, quotesState.favorites, createQuote, setQuotesState, syncFavoritesMutation])

  // Actions
  const setSearchTerm = useCallback((term: string) => {
    setQuotesState(prev => ({ ...prev, searchTerm: term }))
  }, [setQuotesState])

  const setSelectedCategory = useCallback((category: string) => {
    setQuotesState(prev => ({ ...prev, selectedCategory: category }))
  }, [setQuotesState])

  const setSortBy = useCallback((sortBy: QuotesState['sortBy']) => {
    setQuotesState(prev => ({ ...prev, sortBy }))
  }, [setQuotesState])

  const reorderQuotes = useCallback((newOrder: string[]) => {
    setQuotesState(prev => ({ ...prev, customOrder: newOrder }))
  }, [setQuotesState])

  const toggleFavorite = useCallback(async (id: string) => {
    // Optimistic Update
    setQuotesState(prev => {
      const favorites = prev.favorites || [];
      const isFav = favorites.includes(id)
      return {
        ...prev,
        favorites: isFav
          ? favorites.filter(fid => fid !== id)
          : [...favorites, id]
      }
    })

    if (user) {
      try {
        await toggleFavoriteMutation.mutateAsync({ quoteId: id, userId: user.id });
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        // Revert handled by refetch usually, but simplistic for now
      }
    }
  }, [setQuotesState, user, toggleFavoriteMutation])

  const createQuoteOptimistic = useCallback(async ({ content, author, category }: { content: string; author: string; category: string }) => {
    const tempId = crypto.randomUUID()
    const newQuote: LocalQuote = {
      id: tempId,
      content,
      author,
      category,
      is_custom: true,
      created_at: new Date().toISOString(),
      isLocal: true,
      isFavorite: false
    }

    // Update local state immediately
    setQuotesState(prev => ({
      ...prev,
      localQuotes: [newQuote, ...(prev.localQuotes || [])]
    }))

    // Sync to backend if user is logged in
    if (user) {
      try {
        console.log('[createQuote] Creating quote with tempId:', tempId);
        const realId = await createQuote.mutateAsync({
          user_id: user.id,
          content,
          author,
          category,
          is_custom: true
        })

        // CRITICAL FIX: Update local quote ID to match Convex ID
        console.log('[createQuote] Quote created in Convex, updating ID:', tempId, '->', realId);

        setQuotesState(prev => {
          // Update the quote ID from temp to real
          const updatedLocalQuotes = prev.localQuotes.map(q =>
            q.id === tempId ? { ...q, id: realId, isLocal: false } : q
          )

          // Also update any playlists that reference this tempId
          const updatedPlaylists = prev.playlists.map(p => ({
            ...p,
            quoteIds: p.quoteIds?.map(id => id === tempId ? realId : id) || []
          }))

          return {
            ...prev,
            localQuotes: updatedLocalQuotes,
            playlists: updatedPlaylists
          }
        })

        console.log('[createQuote] ID updated successfully');
      } catch (error) {
        console.error('[createQuote] Failed to create quote:', error);
        // Remove the optimistic quote on error
        setQuotesState(prev => ({
          ...prev,
          localQuotes: prev.localQuotes.filter(q => q.id !== tempId)
        }));
      }
    }
  }, [user, createQuote, setQuotesState])

  const updateQuoteOptimistic = useCallback(async (id: string, updates: Partial<LocalQuote>) => {
    // Update local state
    setQuotesState(prev => ({
      ...prev,
      localQuotes: (prev.localQuotes || []).map(q => q.id === id ? { ...q, ...updates } : q)
    }))

    if (user) {
      // Find if it's a remote quote
      const isRemote = (remoteQuotes || []).some(q => q.id === id)
      if (isRemote) {
        try {
          // Cast string to Id<"quotes"> - we know it's a remote quote ID
          await updateQuote.mutateAsync({ id: id as any, ...updates })
        } catch (error) {
          console.error('Failed to update quote:', error)
        }
      }
    }
  }, [user, remoteQuotes, updateQuote, setQuotesState])

  const deleteQuoteOptimistic = useCallback(async (id: string) => {
    // Update local state
    setQuotesState(prev => ({
      ...prev,
      localQuotes: (prev.localQuotes || []).filter(q => q.id !== id),
      favorites: (prev.favorites || []).filter(fid => fid !== id)
    }))

    if (user) {
      try {
        await deleteQuote.mutateAsync(id as Id<"quotes">)
      } catch (error) {
        console.error('Failed to delete quote:', error)
      }
    }
  }, [user, deleteQuote, setQuotesState])

  const generateAIQuote = useCallback(async (mood?: string, topic?: string) => {
    if (!geminiSettings.apiKey) {
      throw new Error('Gemini API key not configured')
    }

    try {
      const prompt = `Generate a short, inspiring quote${mood ? ` for a ${mood} mood` : ''}${topic ? ` about ${topic}` : ''}. Return ONLY a JSON object with "content", "author", and "category" fields.`

      const response = await generateGeminiResponse(geminiSettings.apiKey, prompt, geminiSettings.model || 'gemini-pro')
      // Parse response... ensuring it's valid JSON
      try {
        // Clean up markdown code blocks if present
        const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim()
        const data = JSON.parse(jsonStr)

        await createQuoteOptimistic({
          content: data.content,
          author: data.author || 'AI Wisdom',
          category: 'AI Generated'
        })
      } catch (e) {
        console.error('Failed to parse AI response', e)
        // Fallback or error handling
      }
    } catch (error) {
      console.error('AI Generation failed:', error)
      throw error
    }
  }, [geminiSettings.apiKey, createQuoteOptimistic])

  const autoTagQuote = useCallback(async (content: string, author: string) => {
    if (!geminiSettings.apiKey) {
      // toast.error('Configure Gemini API to use Auto-Tag');
      return null;
    }
    const prompt = `Categorize this quote into a single short word (e.g. Motivation, Discipline, Life, Love, Success). Return ONLY the word. Quote: "${content}" by ${author}`;
    try {
      const response = await generateGeminiResponse(geminiSettings.apiKey, prompt, geminiSettings.model || 'gemini-pro');
      const tag = response.trim().replace(/^"|"$/g, '').replace(/\.$/, '');
      return tag;
    } catch (e) {
      console.error("Auto-tag failed", e);
      return null;
    }
  }, [geminiSettings.apiKey]);

  // --- Playlist Logic ---

  // --- Playlist Logic ---

  // Merge local playlists with remote if logged in
  const mergedPlaylists = user ? remotePlaylists : (quotesState.playlists || []);

  const createPlaylist = useCallback(async (name: string) => {
    const tempId = crypto.randomUUID();

    // LOGGED IN: Create in Convex first, use Convex ID
    if (user) {
      try {
        console.log('[createPlaylist] Creating in Convex for user:', user.id);
        const convexId = await createPlaylistMutation.mutateAsync({ name, quote_ids: [] });

        // Convex returns the real ID - use it for activePlaylistId
        const realId = String(convexId);
        console.log('[createPlaylist] Created with Convex ID:', realId);

        // Update activePlaylistId with the REAL Convex ID
        setQuotesState(prev => ({
          ...prev,
          activePlaylistId: prev.activePlaylistId ? prev.activePlaylistId : realId
        }));

        return realId;
      } catch (error) {
        console.error("[createPlaylist] Failed to create playlist:", error);
        throw error;
      }
    }

    // LOGGED OUT: Use localStorage with temp ID
    const newPlaylist: Playlist = {
      id: tempId,
      name,
      quoteIds: [],
      createdAt: new Date().toISOString()
    };

    setQuotesState(prev => ({
      ...prev,
      playlists: [...(prev.playlists || []), newPlaylist],
      activePlaylistId: prev.activePlaylistId ? prev.activePlaylistId : tempId
    }));

    return tempId;
  }, [setQuotesState, user, createPlaylistMutation])

  const deletePlaylist = useCallback(async (id: string) => {
    // Optimistic
    setQuotesState(prev => ({
      ...prev,
      playlists: (prev.playlists || []).filter(p => p.id !== id),
      activePlaylistId: prev.activePlaylistId === id ? null : prev.activePlaylistId
    }))

    if (user) {
      try {
        await deletePlaylistMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete playlist:", error);
      }
    }
  }, [setQuotesState, user, deletePlaylistMutation])

  const addToPlaylist = useCallback(async (playlistId: string, quoteId: string) => {
    console.log('[addToPlaylist] Adding quote to playlist:', { playlistId, quoteId, isLoggedIn: !!user });

    // LOGGED IN: Use Convex first, it's the source of truth
    if (user) {
      try {
        await addToPlaylistMutation.mutateAsync({ playlistId, quoteId });
        console.log('[addToPlaylist] Successfully added to Convex playlist');

        // CRITICAL FIX: Also update localStorage immediately
        // This ensures the popup has the latest data without waiting for subscription
        setQuotesState(prev => ({
          ...prev,
          playlists: (prev.playlists || []).map(p =>
            p.id === playlistId && !(p.quoteIds || []).includes(quoteId)
              ? { ...p, quoteIds: [...(p.quoteIds || []), quoteId] }
              : p
          )
        }));

        console.log('[addToPlaylist] Updated localStorage playlist');
      } catch (error) {
        console.error("[addToPlaylist] Failed to add to Convex playlist:", error);
        throw error;
      }
      return;
    }

    // LOGGED OUT: Update localStorage
    setQuotesState(prev => ({
      ...prev,
      playlists: (prev.playlists || []).map(p =>
        p.id === playlistId && !(p.quoteIds || []).includes(quoteId)
          ? { ...p, quoteIds: [...(p.quoteIds || []), quoteId] }
          : p
      )
    }));
  }, [setQuotesState, user, addToPlaylistMutation])

  const removeFromPlaylist = useCallback(async (playlistId: string, quoteId: string) => {
    console.log('[removeFromPlaylist] Removing quote from playlist:', { playlistId, quoteId, isLoggedIn: !!user });

    // LOGGED IN: Use Convex first
    if (user) {
      try {
        await removeFromPlaylistMutation.mutateAsync({ playlistId, quoteId });
        console.log('[removeFromPlaylist] Successfully removed from Convex playlist');

        // CRITICAL FIX: Also update localStorage immediately
        setQuotesState(prev => ({
          ...prev,
          playlists: (prev.playlists || []).map(p =>
            p.id === playlistId
              ? { ...p, quoteIds: (p.quoteIds || []).filter(id => id !== quoteId) }
              : p
          )
        }));

        console.log('[removeFromPlaylist] Updated localStorage playlist');
      } catch (error) {
        console.error("[removeFromPlaylist] Failed to remove from Convex playlist:", error);
        throw error;
      }
      return;
    }

    // LOGGED OUT: Update localStorage
    setQuotesState(prev => ({
      ...prev,
      playlists: (prev.playlists || []).map(p =>
        p.id === playlistId
          ? { ...p, quoteIds: (p.quoteIds || []).filter(id => id !== quoteId) }
          : p
      )
    }));
  }, [setQuotesState, user, removeFromPlaylistMutation])

  const toggleActivePlaylist = useCallback((id: string | null) => {
    setQuotesState(prev => ({ ...prev, activePlaylistId: id }))
  }, [setQuotesState])

  const getNextQuote = useCallback(() => {
    const state = quotesState;
    const all = allQuotes(); // all is guarded to return [] at worst

    // Use merged playlists (remote when logged in, cached/local otherwise)
    // Try remote first, then cached playlists from localStorage
    const remote = remotePlaylists || [];
    const cached = state.playlists || [];
    const playlistsToUse: any[] = remote.length > 0 ? remote : cached;

    console.log('[getNextQuote] Playlist sources:', {
      remoteCount: remote.length,
      cachedCount: cached.length,
      finalSource: remote.length > 0 ? 'remote' : (cached.length > 0 ? 'cached' : 'none'),
      userLoggedIn: !!user
    });

    console.log('[getNextQuote] Called with state:', {
      activePlaylistId: state.activePlaylistId,
      playlistCount: playlistsToUse.length,
      totalQuotes: all.length,
      isLoggedIn: !!user,
      playlists: playlistsToUse.map((p: any) => ({
        id: p.id,
        name: p.name,
        quoteCount: (p.quoteIds || p.quote_ids || []).length
      }))
    });

    // 1. Check if a playlist is active
    if (state.activePlaylistId) {
      const playlist = playlistsToUse.find((p: any) => p.id === state.activePlaylistId);
      console.log('[getNextQuote] Active playlist found:', playlist);

      // Safe check for quoteIds existence and length (handle both quoteIds and quote_ids)
      const playlistQuoteIds = playlist?.quoteIds || playlist?.quote_ids || [];
      if (playlist && Array.isArray(playlistQuoteIds) && playlistQuoteIds.length > 0) {
        // Get current index for this playlist (default 0)
        const progress = state.playlistProgress || {};
        const currentIndex = progress[playlist.id] || 0;

        console.log('[getNextQuote] Playlist progress:', { playlistId: playlist.id, currentIndex, totalInPlaylist: playlistQuoteIds.length });

        // Get the quote ID at this index
        const quoteId = playlistQuoteIds[currentIndex % playlistQuoteIds.length];
        const quote = all.find(q => q.id === quoteId);

        console.log('[getNextQuote] Looking for quoteId:', quoteId, 'Found:', !!quote);

        // Advance the index for next time (strictly sequential)
        const nextIndex = (currentIndex + 1) % playlistQuoteIds.length;

        // Update state in background
        setQuotesState(prev => ({
          ...prev,
          playlistProgress: {
            ...(prev.playlistProgress || {}),
            [playlist.id]: nextIndex
          }
        }));

        if (quote) {
          console.log('[getNextQuote] Returning playlist quote:', quote.content.substring(0, 50) + '...');
          return { quote, source: 'playlist' as const, playlistName: playlist.name };
        } else {
          console.warn('[getNextQuote] Quote ID in playlist not found in allQuotes!');
          console.warn('[getNextQuote] Looking for quoteId:', quoteId);
          console.warn('[getNextQuote] Available quote IDs:', all.map(q => ({
            id: q.id,
            content: q.content.substring(0, 30),
            isLocal: q.isLocal
          })));
          console.warn('[getNextQuote] Playlist quoteIds:', playlistQuoteIds);
        }
      }
    }

    // 2. Fallback to random if no playlist or empty playlist
    if (!all || all.length === 0) {
      console.warn('[getNextQuote] No quotes available! Returning null.');
      return null;
    }

    const randomIndex = Math.floor(Math.random() * all.length);
    console.log('[getNextQuote] Returning random quote at index:', randomIndex);
    return { quote: all[randomIndex], source: 'random' as const };
  }, [quotesState, allQuotes, setQuotesState, user, remotePlaylists, remoteQuotes])

  // --- CACHE CONVEX QUOTES EFFECT ---
  // When user is logged in and has quotes in Convex, cache them in localStorage
  // This allows the popup to access quotes even when logged out
  useEffect(() => {
    if (user && remoteQuotes && remoteQuotes.length > 0) {
      // Convert Convex quotes to LocalQuote format and cache
      const quotesToCache: LocalQuote[] = remoteQuotes.map((q: any) => ({
        id: q._id || q.id, // Handle both _id (Convex) and id (local)
        content: q.content,
        author: q.author || null,
        category: q.category || null,
        is_custom: q.is_custom,
        created_at: q.created_at,
        isLocal: false, // These are from Convex
        isFavorite: (remoteFavorites || []).includes(q._id || q.id)
      }));

      console.log('[useQuotesState] Caching', quotesToCache.length, 'quotes from Convex for offline access');

      setQuotesState(prev => {
        // Only update if cache is different
        const currentCacheIds = new Set(prev.cachedPlaylistQuotes.map(q => q.id));
        const newCacheIds = new Set(quotesToCache.map(q => q.id));

        // Check if they're the same
        const same = quotesToCache.every(q => currentCacheIds.has(q.id)) &&
          prev.cachedPlaylistQuotes.every(q => newCacheIds.has(q.id));

        if (same) return prev; // No change needed

        return {
          ...prev,
          cachedPlaylistQuotes: quotesToCache
        };
      });
    }
  }, [user, remoteQuotes, remoteFavorites, setQuotesState]);

  // --- CACHE CONVEX PLAYLISTS EFFECT ---
  // When user is logged in and has playlists in Convex, cache them in localStorage
  // This allows the popup to access playlists even when logged out
  useEffect(() => {
    if (user && remotePlaylists && remotePlaylists.length > 0) {
      console.log('[useQuotesState] Caching', remotePlaylists.length, 'playlists from Convex for offline access');

      // Convert Convex playlists to local Playlist format and cache
      const playlistsToCache: Playlist[] = remotePlaylists.map((p: any) => ({
        id: p._id || p.id,
        name: p.name,
        quoteIds: p.quote_ids || [],
        createdAt: p.created_at
      }));

      setQuotesState(prev => {
        // Deep comparison: check both playlist IDs and quoteIds
        const currentPlaylistMap = new Map(prev.playlists.map(p => [p.id, p]));

        // Check if they're the same (same IDs, same quote counts)
        let same = true;

        // Check if all cached playlists exist in current
        for (const cached of playlistsToCache) {
          const current = currentPlaylistMap.get(cached.id);
          if (!current) {
            same = false;
            break;
          }
          // Check if quoteIds are the same
          const currentQuoteIds = new Set(current.quoteIds || []);
          const cachedQuoteIds = new Set(cached.quoteIds || []);
          if (currentQuoteIds.size !== cachedQuoteIds.size) {
            same = false;
            break;
          }
          for (const id of cachedQuoteIds) {
            if (!currentQuoteIds.has(id)) {
              same = false;
              break;
            }
          }
          if (!same) break;
        }

        // Also check if current playlists exist in cache
        const cachedIds = new Set(playlistsToCache.map(p => p.id));
        if (same && prev.playlists.some(p => !cachedIds.has(p.id))) {
          same = false;
        }

        if (same) {
          console.log('[useQuotesState] Playlists unchanged, skipping cache update');
          return prev;
        }

        console.log('[useQuotesState] Updating playlist cache:',
          playlistsToCache.map(p => ({ name: p.name, quoteCount: p.quoteIds.length })));

        return {
          ...prev,
          playlists: playlistsToCache
        };
      });
    }
  }, [user, remotePlaylists, setQuotesState]);

  // --- SELF-HEALING CACHE EFFECT ---
  // If we have an active playlist but NO cached quotes (legacy state), hydrate the cache immediately.
  useEffect(() => {
    if (quotesState.activePlaylistId && (!quotesState.cachedPlaylistQuotes || quotesState.cachedPlaylistQuotes.length === 0)) {
      const all = allQuotes();
      if (all.length > 0) {
        console.log('[useQuotesState] Self-healing cache for playlist:', quotesState.activePlaylistId); // Log cache repair
        // We can't call toggleActivePlaylist here because it might cause loop or dependency cycle if not careful.
        // Instead, directly update state to populate cache.

        setQuotesState(prev => {
          const playlist = (prev.playlists || []).find(p => p.id === prev.activePlaylistId);
          if (!playlist) return prev;

          const nextCache = (playlist.quoteIds || [])
            .map(qId => all.find(q => q.id === qId))
            .filter((q): q is LocalQuote => !!q);

          return {
            ...prev,
            cachedPlaylistQuotes: nextCache
          };
        });
      }
    }
  }, [quotesState.activePlaylistId, quotesState.cachedPlaylistQuotes, allQuotes, setQuotesState]);

  // Filtering Logic
  const filteredQuotes = useCallback(() => {
    let result = allQuotes()

    if (quotesState.selectedCategory !== 'all') {
      result = result.filter(q => q.category === quotesState.selectedCategory)
    }

    if (quotesState.searchTerm) {
      const term = quotesState.searchTerm.toLowerCase()
      result = result.filter(q =>
        q.content.toLowerCase().includes(term) ||
        (q.author && q.author.toLowerCase().includes(term))
      )
    }

    return result
  }, [allQuotes, quotesState.selectedCategory, quotesState.searchTerm])

  const categories = useCallback(() => {
    const quotes = allQuotes() || [];
    const uniqueCategories = new Set(quotes.map(q => q.category).filter(Boolean) as string[])
    return ['all', ...Array.from(uniqueCategories).sort()]
  }, [allQuotes])

  // Migration: Ensure new state properties exist
  useEffect(() => {
    // 1. Structure Migration
    if (!quotesState.playlists || !quotesState.playlistProgress) {
      console.log('Migrating quotes state to include playlists...');
      setQuotesState(prev => ({
        ...prev,
        playlists: prev.playlists || [],
        activePlaylistId: prev.activePlaylistId || null,
        playlistProgress: prev.playlistProgress || {}
      }))
    }

    // AUTO-ACTIVATE REMOVED from migration to prevent override
    // 2. Legacy Data Import (stored_quotes)
    const legacyQuotesStr = localStorage.getItem('stored_quotes');
    if (legacyQuotesStr) {
      try {
        const legacyQuotes = JSON.parse(legacyQuotesStr);
        if (Array.isArray(legacyQuotes) && legacyQuotes.length > 0) {
          console.log('Found legacy quotes, importing...');
          setQuotesState(prev => {
            const existingIds = new Set((prev.localQuotes || []).map(q => q.id));

            // Map legacy to LocalQuote
            const newLocalQuotes: LocalQuote[] = legacyQuotes
              .filter((lq: any) => lq.id && lq.text && !existingIds.has(lq.id))
              .map((lq: any) => ({
                id: lq.id,
                content: lq.text, // stored_quotes uses 'text', LocalQuote uses 'content'
                author: lq.author || 'Unknown',
                category: 'Legacy',
                is_custom: true,
                created_at: new Date().toISOString(),
                isLocal: true,
                isFavorite: false
              }));

            if (newLocalQuotes.length > 0) {
              // Clear legacy storage to prevent re-import
              localStorage.removeItem('stored_quotes');
              return {
                ...prev,
                localQuotes: [...newLocalQuotes, ...(prev.localQuotes || [])]
              };
            }
            return prev;
          });
        }
      } catch (e) {
        console.error('Failed to import legacy quotes', e);
      }
    }
  }, [quotesState.playlists, quotesState.playlistProgress, setQuotesState])

  return {
    // State
    quotes: filteredQuotes(),
    allQuotes: allQuotes(),
    categories: categories(),
    searchTerm: quotesState.searchTerm,
    selectedCategory: quotesState.selectedCategory,
    localQuoteCount: (quotesState.localQuotes || []).filter(q => q.isLocal).length,
    sortBy: quotesState.sortBy,

    // Computed
    favoriteQuotes: allQuotes().filter(q => q.isFavorite),
    customQuotes: allQuotes().filter(q => q.is_custom),
    aiQuotes: allQuotes().filter(q => q.isAiGenerated),

    // Actions
    createQuote: createQuoteOptimistic,
    updateQuote: updateQuoteOptimistic,
    deleteQuote: deleteQuoteOptimistic,
    toggleFavorite,
    setSearchTerm,
    setSelectedCategory,
    generateAIQuote,
    getRandomQuote,
    syncLocalQuotes,
    setSortBy,
    reorderQuotes,

    // Status
    isLoading,
    isSyncing: false, // Convex mutations don't expose isPending easily yet
    isAIConfigured: geminiSettings.isConfigured,

    // Playlist Exports (Safe Fallbacks)
    playlists: mergedPlaylists,
    activePlaylistId: quotesState.activePlaylistId || null,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    toggleActivePlaylist,
    getNextQuote,

    // AI Extras
    autoTagQuote
  }
}