import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuotesState } from '../useQuotesState';
import * as useConvexQueries from '../useConvexQueries';
import { useAuthMock } from '../../test/setup';
import { useGeminiSettings } from '../useGeminiSettings';
import { useUser } from '@clerk/clerk-react';

// Mock the Convex queries hook
vi.mock('../useConvexQueries', () => ({
    useQuotes: vi.fn(),
    usePlaylists: vi.fn(),
    useFavorites: vi.fn(),
    useCreateQuote: vi.fn(),
    useUpdateQuote: vi.fn(),
    useDeleteQuote: vi.fn(),
    useUserCustomQuotes: vi.fn(),
    useToggleFavorite: vi.fn(),
    useSyncFavorites: vi.fn(),
    useCreatePlaylist: vi.fn(),
    useUpdatePlaylist: vi.fn(),
    useDeletePlaylist: vi.fn(),
    useAddToPlaylist: vi.fn(),
    useRemoveFromPlaylist: vi.fn(),
    useConvexQueries: vi.fn(),
}));

// Mock useGeminiSettings
vi.mock('../useGeminiSettings', () => ({
    useGeminiSettings: vi.fn(),
}));

// Mock useAuth is already in setup.ts

describe('useQuotesState', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        // Default mocks using the exported mock from setup
        useAuthMock.mockReturnValue({
            userId: 'test_user_id',
            sessionId: 'test_session_id',
            getToken: vi.fn(),
            isSignedIn: true,
            isLoaded: true,
            orgId: undefined,
            orgRole: undefined,
            orgSlug: undefined,
            has: vi.fn(),
            signOut: vi.fn(),
        } as any);

        // Mock useUser to ensure usePersistedState generates correct key
        vi.mocked(useUser).mockReturnValue({
            user: { id: 'test_user_id', fullName: 'Test User' } as any,
            isLoaded: true,
            isSignedIn: true
        });

        vi.mocked(useConvexQueries.useQuotes).mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() });
        vi.mocked(useConvexQueries.usePlaylists).mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() });
        vi.mocked(useConvexQueries.useFavorites).mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() });
        vi.mocked(useConvexQueries.useUserCustomQuotes).mockReturnValue({ data: [], isLoading: false });
        vi.mocked(useConvexQueries.useToggleFavorite).mockReturnValue({ mutateAsync: vi.fn() } as any);
        vi.mocked(useConvexQueries.useSyncFavorites).mockReturnValue({ mutateAsync: vi.fn() } as any);
        vi.mocked(useConvexQueries.useCreatePlaylist).mockReturnValue({ mutateAsync: vi.fn() } as any);
        vi.mocked(useConvexQueries.useUpdatePlaylist).mockReturnValue({ mutateAsync: vi.fn() } as any);
        vi.mocked(useConvexQueries.useDeletePlaylist).mockReturnValue({ mutateAsync: vi.fn() } as any);
        vi.mocked(useConvexQueries.useAddToPlaylist).mockReturnValue({ mutateAsync: vi.fn() } as any);
        vi.mocked(useConvexQueries.useRemoveFromPlaylist).mockReturnValue({ mutateAsync: vi.fn() } as any);

        // Mock settings
        vi.mocked(useGeminiSettings).mockReturnValue({
            settings: { apiKey: 'test-key', model: 'gemini-pro', isConfigured: true },
            isLoading: false,
            saveSettings: vi.fn(),
            clearSettings: vi.fn(),
            reload: vi.fn()
        });
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useQuotesState());

        expect(result.current.activePlaylistId).toBeNull();
        expect(result.current.allQuotes).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });

    it('merges remote quotes correctly', () => {
        const mockQuotes = [
            { id: 'q1', content: 'Test Quote 1', author: 'Author 1', category: 'signal', is_custom: false },
            { id: 'q2', content: 'Test Quote 2', author: 'Author 2', category: 'signal', is_custom: true }
        ];
        (useConvexQueries.useQuotes as any).mockReturnValue({ data: mockQuotes, isLoading: false });

        const { result } = renderHook(() => useQuotesState());

        expect(result.current.allQuotes).toHaveLength(2);
        expect(result.current.allQuotes[0].content).toBe('Test Quote 1');
    });

    it('uses active playlist for getNextQuote', () => {
        const mockQuotes = [
            { id: 'q1', content: 'Quote 1', author: 'A1' },
            { id: 'q2', content: 'Quote 2', author: 'A2' }
        ];
        const mockPlaylists = [
            { id: 'p1', name: 'Mix 1', quoteIds: ['q1', 'q2'] }
        ];

        (useConvexQueries.useQuotes as any).mockReturnValue({ data: mockQuotes, isLoading: false });
        (useConvexQueries.usePlaylists as any).mockReturnValue({ data: mockPlaylists, isLoading: false });

        const { result } = renderHook(() => useQuotesState());

        // Activate playlist
        act(() => {
            result.current.toggleActivePlaylist('p1');
        });

        expect(result.current.activePlaylistId).toBe('p1');

        // Get next quote - should be from playlist
        let quoteResult;
        act(() => {
            quoteResult = result.current.getNextQuote();
        });

        expect(quoteResult).toBeDefined();
        expect(quoteResult.source).toBe('playlist');
        expect(quoteResult.playlistName).toBe('Mix 1');
        // First in list logic 
        expect(quoteResult.quote.id).toBe('q1');
    });

    it('falls back to local storage cache when offline', async () => {
        // 1. Setup: Pre-seed localStorage to simulate a previously cached state
        // This isolates the "Offline Read" test from the "Online Write" test
        const cachedState = {
            localQuotes: [],
            playlists: [],
            favorites: [],
            cachedPlaylistQuotes: [{
                id: 'q1',
                content: 'Cached Quote',
                author: 'A1',
                category: 'General',
                is_custom: false,
                created_at: new Date().toISOString(),
                isLocal: false
            }],
            activePlaylistId: null,
            playlistProgress: {},
            sortBy: 'custom',
            customOrder: []
        };
        localStorage.setItem('quotes-state_test_user_id', JSON.stringify(cachedState));

        // 2. Setup: Offline (mock hooks return empty/loading)
        (useConvexQueries.useQuotes as any).mockReturnValue({ data: [], isLoading: true });

        const { result } = renderHook(() => useQuotesState());

        // It should load from cache immediately on mount
        await waitFor(() => {
            expect(result.current.allQuotes).toHaveLength(1);
            expect(result.current.allQuotes[0].content).toBe('Cached Quote');
        });
    });
});
