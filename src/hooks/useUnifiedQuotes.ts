import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Unified Quote and Playlist System
 * 
 * This hook provides a unified interface for quotes and playlists
 * that always uses Convex as the source of truth when user is logged in.
 * 
 * When user is NOT logged in, it prompts for login instead of showing
 * stale or empty data.
 */

// Get all quotes (public + user's custom)
export const useQuotes = (userId?: string) => {
  return useQuery(api.quotes.getQuotes, userId ? { userId } : "skip");
};

// Get user's playlists from Convex
export const useUserPlaylists = (userId?: string) => {
  return useQuery(api.playlists.getPlaylists, userId ? { userId } : "skip");
};

// Create a new quote
export const useCreateQuoteUnified = () => {
  const create = useMutation(api.quotes.createQuote);
  return {
    mutateAsync: create,
    isPending: false,
  };
};

// Create playlist
export const useCreatePlaylistUnified = () => {
  const create = useMutation(api.playlists.createPlaylist);
  return {
    mutateAsync: create,
    isPending: false,
  };
};

// Add quote to playlist
export const useAddQuoteToPlaylistUnified = () => {
  const add = useMutation(api.playlists.addQuoteToPlaylist);
  return {
    mutateAsync: add,
    isPending: false,
  };
};

// Create quote AND add to playlist in one operation
export const useCreateQuoteAndAddToPlaylist = () => {
  const createQuote = useMutation(api.quotes.createQuote);
  const addToPlaylist = useMutation(api.playlists.addQuoteToPlaylist);

  return {
    mutateAsync: async ({
      user_id,
      content,
      author,
      category,
      playlist_id,
    }: {
      user_id: string;
      content: string;
      author?: string;
      category?: string;
      playlist_id?: string;
    }) => {
      // Step 1: Create quote in Convex
      const quoteId = await createQuote({
        user_id,
        content,
        author,
        category,
        is_custom: true,
      });

      // Step 2: If playlist specified, add quote to playlist
      if (playlist_id) {
        await addToPlaylist({
          playlist_id,
          quote_id: quoteId,
        });
      }

      return { quoteId, playlistId: playlist_id };
    },
    isPending: false,
  };
};

// Get next quote from active playlist
export const useGetNextPlaylistQuote = () => {
  const playlists = useUserPlaylists();
  const quotes = useQuotes();

  return {
    getNextQuote: (activePlaylistId: string, currentIndex: number = 0) => {
      if (!playlists || !quotes) return null;

      const playlist = playlists.find((p: any) => p._id === activePlaylistId);
      if (!playlist || !playlist.quote_ids || playlist.quote_ids.length === 0) {
        return null;
      }

      const quoteId = playlist.quote_ids[currentIndex % playlist.quote_ids.length];
      const quote = quotes.find((q: any) => q._id === quoteId);

      if (!quote) return null;

      return {
        quote: {
          id: quote._id,
          content: quote.content,
          author: quote.author,
          category: quote.category,
        },
        nextIndex: (currentIndex + 1) % playlist.quote_ids.length,
        playlistName: playlist.name,
        totalQuotes: playlist.quote_ids.length,
        currentPosition: currentIndex + 1,
      };
    },
  };
};
