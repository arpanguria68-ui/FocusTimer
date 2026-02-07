import { useCallback, useEffect } from 'react'
import { usePersistedState } from './usePersistedState'
import { useQuotes, useRandomQuote, useUserCustomQuotes, useCreateQuote, useUpdateQuote, useDeleteQuote, useFavorites, useToggleFavorite, useSyncFavorites, usePlaylists, useCreatePlaylist, useDeletePlaylist, useAddToPlaylist, useRemoveFromPlaylist } from './useConvexQueries'
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

  // Merge local and remote quotes, prioritizing remote for conflicts
  // Merge local and remote quotes, prioritizing remote for conflicts
  const allQuotes = useCallback(() => {
    const localQuotes = quotesState.localQuotes || [];
    // favorites declared below
    const customOrder = quotesState.customOrder || [];
    const remote = remoteQuotes || [];
    // Merge remote favorites if logged in, otherwise use local
    const mergedFavorites = user ? remoteFavorites : (quotesState.favorites || []);

    // Note: Playlists are handled separately unless we merge them into quotes? No, playlists are separate.

    const remoteQuoteIds = new Set(remote.map(q => q.id))
    const localOnlyQuotes = localQuotes.filter(q => !remoteQuoteIds.has(q.id))

    // Convert remote quotes to LocalQuote format
    const formattedRemoteQuotes: LocalQuote[] = remote.map(q => ({
      id: q.id,
      content: q.content,
      author: q.author,
      category: q.category,
      is_custom: q.is_custom,
      isFavorite: mergedFavorites.includes(q.id),
      isAiGenerated: q.category === 'AI Generated',
      created_at: q.created_at,
      isLocal: false
    }))

    return [...formattedRemoteQuotes, ...localOnlyQuotes].sort((a, b) => {
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
  }, [remoteQuotes, quotesState.localQuotes, quotesState.favorites, quotesState.sortBy, quotesState.customOrder])

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
        await createQuote.mutateAsync({
          user_id: user.id,
          content,
          author,
          category,
          is_custom: true
        })
        // Real sync happens via syncLocalQuotes or useQuotes invalidation
      } catch (error) {
        console.error('Failed to create quote:', error)
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
          await updateQuote.mutateAsync({ id: id as unknown as Id<"quotes">, ...updates })
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
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
      quoteIds: [],
      createdAt: new Date().toISOString()
    }

    // Optimistic
    setQuotesState(prev => ({
      ...prev,
      playlists: [...(prev.playlists || []), newPlaylist]
    }))

    if (user) {
      try {
        await createPlaylistMutation.mutateAsync({ user_id: user.id, name, quote_ids: [] });
      } catch (error) {
        console.error("Failed to create playlist:", error);
      }
    }

    return newPlaylist.id
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
    // Optimistic
    setQuotesState(prev => ({
      ...prev,
      playlists: (prev.playlists || []).map(p =>
        p.id === playlistId && !(p.quoteIds || []).includes(quoteId)
          ? { ...p, quoteIds: [...(p.quoteIds || []), quoteId] }
          : p
      )
    }))

    if (user) {
      try {
        await addToPlaylistMutation.mutateAsync({ playlistId, quoteId });
      } catch (error) {
        console.error("Failed to add to playlist:", error);
      }
    }
  }, [setQuotesState, user, addToPlaylistMutation])

  const removeFromPlaylist = useCallback(async (playlistId: string, quoteId: string) => {
    // Optimistic
    setQuotesState(prev => ({
      ...prev,
      playlists: (prev.playlists || []).map(p =>
        p.id === playlistId
          ? { ...p, quoteIds: (p.quoteIds || []).filter(id => id !== quoteId) }
          : p
      )
    }))

    if (user) {
      try {
        await removeFromPlaylistMutation.mutateAsync({ playlistId, quoteId });
      } catch (error) {
        console.error("Failed to remove from playlist:", error);
      }
    }
  }, [setQuotesState, user, removeFromPlaylistMutation])

  const toggleActivePlaylist = useCallback((id: string | null) => {
    setQuotesState(prev => ({ ...prev, activePlaylistId: id }))
  }, [setQuotesState])

  const getNextQuote = useCallback(() => {
    const state = quotesState;
    const all = allQuotes(); // all is guarded to return [] at worst

    console.log('[getNextQuote] Called with state:', {
      activePlaylistId: state.activePlaylistId,
      playlistCount: (state.playlists || []).length,
      totalQuotes: all.length,
      playlists: (state.playlists || []).map(p => ({
        id: p.id,
        name: p.name,
        quoteCount: p.quoteIds.length
      }))
    });

    // 1. Check if a playlist is active
    if (state.activePlaylistId) {
      const playlist = (state.playlists || []).find(p => p.id === state.activePlaylistId);
      console.log('[getNextQuote] Active playlist found:', playlist);

      // Safe check for quoteIds existence and length
      if (playlist && Array.isArray(playlist.quoteIds) && playlist.quoteIds.length > 0) {
        // Get current index for this playlist (default 0)
        const progress = state.playlistProgress || {};
        const currentIndex = progress[playlist.id] || 0;

        console.log('[getNextQuote] Playlist progress:', { playlistId: playlist.id, currentIndex, totalInPlaylist: playlist.quoteIds.length });

        // Get the quote ID at this index
        const quoteId = playlist.quoteIds[currentIndex % playlist.quoteIds.length];
        const quote = all.find(q => q.id === quoteId);

        console.log('[getNextQuote] Looking for quoteId:', quoteId, 'Found:', !!quote);

        // Advance the index for next time (strictly sequential)
        const nextIndex = (currentIndex + 1) % playlist.quoteIds.length;

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
          console.warn('[getNextQuote] Quote ID in playlist not found in allQuotes! QuoteId:', quoteId);
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
  }, [quotesState, allQuotes, setQuotesState])

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