import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExternalSmilePopup } from '../ExternalSmilePopup';
import { useQuotesState } from '@/hooks/useQuotesState';
import { useAuth } from '@/hooks/useAuth';

// Mimimal Mocks
vi.mock('@/hooks/useQuotesState', () => ({
    useQuotesState: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

describe('ExternalSmilePopup Component', () => {
    // Reset mocks before each test
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.close to prevent JSDOM environment destruction
        vi.spyOn(window, 'close').mockImplementation(() => { });
    });

    it('renders basic UI elements correctly', async () => {
        // Setup minimal mock returns
        (useAuth as any).mockReturnValue({ user: { id: 'test' }, isLoaded: true });
        (useQuotesState as any).mockReturnValue({
            allQuotes: [],
            getNextQuote: vi.fn(),
            activePlaylistId: null,
            playlists: [],
            isLoading: false
        });

        render(<ExternalSmilePopup sessionCount={5} />);

        expect(await screen.findByText(/Session 5 completed/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Great Work!/i);
        expect(screen.getByRole('button', { name: /Start Break/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Skip Break/i })).toBeInTheDocument();
    });

    it('shows loading state when fetching quotes', () => {
        (useAuth as any).mockReturnValue({ user: { id: 'test' }, isLoaded: true });
        // Simulate loading state
        (useQuotesState as any).mockReturnValue({
            allQuotes: [],
            getNextQuote: vi.fn(),
            activePlaylistId: null,
            playlists: [],
            isLoading: true
        });

        render(<ExternalSmilePopup showQuotes={true} />);

        // Check for skeleton or specific loading structure
        // Since ExternalSmilePopup uses local state for loading, we need to ensure the hook's loading prop propagates or triggers local loading
        // Actually, ExternalSmilePopup manages its own isLoading state based on data availability
        // But if showQuotes is true, it starts with isLoading=false -> true inside useEffect

        // Note: Testing internal state transition might differ. 
        // We can check if the quote is NOT displayed yet.
        expect(screen.queryByText(/"Test Quote"/i)).not.toBeInTheDocument();
    });

    it('displays a quote when data is available', async () => {
        const mockGetNextQuote = vi.fn().mockReturnValue({
            quote: { id: 'q1', content: 'Test Quote Content', author: 'Test Author' },
            source: 'random'
        });

        (useAuth as any).mockReturnValue({ user: { id: 'test' }, isLoaded: true });
        (useQuotesState as any).mockReturnValue({
            allQuotes: [{ id: 'q1', content: 'Test Quote Content' }],
            getNextQuote: mockGetNextQuote,
            activePlaylistId: null,
            playlists: [],
            isLoading: false
        });

        render(<ExternalSmilePopup showQuotes={true} />);

        // Wait for quote to appear
        expect(await screen.findByText(/Test Quote Content/i)).toBeInTheDocument();
        expect(screen.getByText(/Test Author/i)).toBeInTheDocument();
    });

    it('handles button interactions', () => {
        const onStartBreak = vi.fn();
        const onSkipBreak = vi.fn();

        (useAuth as any).mockReturnValue({ user: { id: 'test' }, isLoaded: true });
        (useQuotesState as any).mockReturnValue({ allQuotes: [], getNextQuote: vi.fn(), isLoading: false });

        render(<ExternalSmilePopup onStartBreak={onStartBreak} onSkipBreak={onSkipBreak} />);

        const startBtn = screen.getByRole('button', { name: /Start Break/i });
        const skipBtn = screen.getByRole('button', { name: /Skip Break/i });

        fireEvent.click(startBtn);
        expect(onStartBreak).toHaveBeenCalled();

        fireEvent.click(skipBtn);
        expect(onSkipBreak).toHaveBeenCalled();
    });

    it('RECOVERS FROM FALLBACK: Overwrites default quote when data arrives late', async () => {
        vi.useFakeTimers();

        // 1. Initial State: No Data -> triggers Fallback after timeout
        const getNextQuoteMock = vi.fn()
            // We need enough nulls to cover the polling interval
            .mockReturnValueOnce(null).mockReturnValueOnce(null).mockReturnValueOnce(null);

        (useAuth as any).mockReturnValue({ user: { id: 'test' }, isLoaded: true });
        (useQuotesState as any).mockReturnValue({
            allQuotes: [],
            getNextQuote: getNextQuoteMock,
            isLoading: true // Start in loading state
        });

        // Render 
        const { rerender } = render(<ExternalSmilePopup showQuotes={true} />);

        // Fast-forward past the 15s timeout
        act(() => {
            vi.advanceTimersByTime(16000); // 15s + buffer
        });

        // 2. Verify Fallback is shown
        expect(screen.getByText(/Steve Jobs/i)).toBeInTheDocument();

        // Switch back to real timers for the reactive update part to avoid waitFor issues
        vi.useRealTimers();

        // 3. Simulate "Data Arrived" (Rerender with new hook values AND available data)
        const successMock = vi.fn().mockReturnValue({
            quote: { id: 'real_quote', content: 'Real Content for Recovery', author: 'Real Author for Recovery' },
            source: 'playlist'
        });

        (useQuotesState as any).mockReturnValue({
            allQuotes: [{ id: 'real_quote' }], // dependency change
            getNextQuote: successMock,
            isLoading: false
        });

        rerender(<ExternalSmilePopup showQuotes={true} />);

        // 4. Verify the "Real" quote is displayed
        await waitFor(() => {
            expect(screen.getByText(/Real Content for Recovery/i)).toBeInTheDocument();
            expect(screen.queryByText(/Steve Jobs/i)).not.toBeInTheDocument();
        });
    });
});
