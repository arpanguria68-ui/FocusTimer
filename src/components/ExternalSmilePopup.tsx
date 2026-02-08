import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Coffee, SkipForward, Sparkles, X, Zap, Bell, ListMusic } from 'lucide-react';
import { useQuotesState } from '@/hooks/useQuotesState';
import { useAuth } from '@/hooks/useAuth';

// @ts-ignore
declare const chrome: any;

interface ExternalSmilePopupProps {
  sessionType?: 'focus' | 'break' | 'longBreak';
  sessionCount?: number;
  customImage?: string;
  showQuotes?: boolean;
  showCelebration?: boolean;
  autoClose?: boolean;
  closeDelay?: number;
  taskTitle?: string;
  category?: 'signal' | 'noise';
  enableSound?: boolean;
  customSound?: string;
  onStartBreak?: () => void;
  onSkipBreak?: () => void;
}

// Interface for display
interface DisplayQuote {
  id: string;
  content: string;
  author: string;
  source?: 'playlist' | 'random';
  playlistName?: string;
}

// Helper component for effects
const CelebrationEffects = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Floating sparkles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-bounce opacity-70"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        >
          <Sparkles className="h-6 w-6 text-yellow-300" />
        </div>
      ))}
    </div>
  );
};

export function ExternalSmilePopup({
  sessionType = 'focus',
  sessionCount = 1,
  customImage,
  showQuotes = true,
  showCelebration = true,
  autoClose = false,
  closeDelay = 5,
  taskTitle,
  category,
  enableSound = false,
  customSound,
  onStartBreak,
  onSkipBreak
}: ExternalSmilePopupProps) {

  const { getNextQuote, isLoading: quotesLoading, allQuotes, playlists, activePlaylistId, toggleActivePlaylist } = useQuotesState();
  const { user, session } = useAuth ? useAuth() : { user: null, session: null }; // Safe access just in case

  // Auto-activate first playlist if none is active
  useEffect(() => {
    console.log('[ExternalSmilePopup] Auto-activation check:', {
      hasPlaylists: !!playlists,
      playlistCount: playlists?.length,
      activePlaylistId,
      firstPlaylist: playlists?.[0]?.name
    });

    if (playlists && playlists.length > 0 && !activePlaylistId) {
      console.log('[ExternalSmilePopup] Auto-activating first playlist:', playlists[0].name, 'ID:', playlists[0].id);
      toggleActivePlaylist(playlists[0].id);
    } else if (playlists && playlists.length > 0 && activePlaylistId) {
      console.log('[ExternalSmilePopup] Playlist already active:', activePlaylistId);
    } else if (!playlists || playlists.length === 0) {
      console.log('[ExternalSmilePopup] No playlists available yet');
    }
  }, [playlists, activePlaylistId, toggleActivePlaylist]);

  useEffect(() => {
    console.log('[ExternalSmilePopup Debug] Mount State:', {
      hasUser: !!user,
      userId: user?.id,
      quotesLoading,
      quotesCount: allQuotes.length,
      storageKey: user ? `quotes-state_${user.id}` : 'quotes-state_anonymous',
      activePlaylistId,
      playlistCount: playlists?.length || 0,
      playlists: playlists?.map((p: any) => ({ id: p.id, name: p.name, quoteCount: (p.quoteIds || p.quote_ids || []).length })) || []
    });
  }, [user, quotesLoading, allQuotes.length, playlists, activePlaylistId]);

  // Handle audio playback
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;

    if (enableSound) {
      const soundSrc = customSound || 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'; // Default success chime

      audio = new Audio(soundSrc);
      audio.volume = 0.5;
      audio.loop = true;

      console.log('Attempting to play audio:', soundSrc);
      audio.play().catch(e => {
        console.warn("Audio autoplay blocked or failed:", e);
      });
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [enableSound, customSound]); // Re-run if sound settings change

  // Use the actual autoClose prop
  const safeAutoClose = autoClose;
  const safeCloseDelay = typeof closeDelay === 'number' && closeDelay > 0 ? closeDelay : 5;

  console.log('ExternalSmilePopup - Safe values:', {
    originalAutoClose: autoClose,
    safeAutoClose,
    originalCloseDelay: closeDelay,
    safeCloseDelay
  });

  const [quote, setQuote] = useState<DisplayQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    const initialTime = safeAutoClose ? safeCloseDelay : 0;
    return initialTime;
  });
  const [initialDelay] = useState(safeCloseDelay);

  // Debug: Log the props to see what's being passed
  useEffect(() => {
    console.log('ExternalSmilePopup mounted with props:', {
      originalAutoClose: autoClose,
      safeAutoClose,
      originalCloseDelay: closeDelay,
      safeCloseDelay,
      timeLeft,
      sessionType,
      sessionCount
    });

    // Add window beforeunload listener to debug unexpected closes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('Window is about to close/unload');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [safeAutoClose, safeCloseDelay, timeLeft, sessionType, sessionCount]);

  // Load Quote Effect
  const hasLoaded = React.useRef(false);

  useEffect(() => {
    if (showQuotes && !hasLoaded.current) {
      hasLoaded.current = true;
      setIsLoading(true);

      console.log('[ExternalSmilePopup] Starting quote load. ActivePlaylistId:', activePlaylistId);

      // Wait a bit for data to be ready
      setTimeout(() => {
        // Polling mechanism to wait for quotes
        let attempts = 0;
        const maxAttempts = 30; // 15 seconds total (30 * 500ms)

        const pollForQuotes = () => {
          attempts++;
          console.log(`[ExternalSmilePopup] Polling attempt ${attempts}/${maxAttempts}. ActivePlaylistId:`, activePlaylistId);

          try {
            // Try to get a quote - method now prioritized cache per our hook changes
            const result = getNextQuote();
            console.log('[ExternalSmilePopup] getNextQuote result:', result);

            if (result && result.quote) {
              console.log('[ExternalSmilePopup] Successfully got quote:', result.quote.content.substring(0, 50));
              setQuote({
                id: result.quote.id,
                content: result.quote.content,
                author: result.quote.author || 'Unknown',
                source: result.source,
                playlistName: result.playlistName
              });
              setIsLoading(false);
            } else {
              // If we're still polling, wait more unless max attempts reached
              if (attempts >= maxAttempts) {
                console.warn('[ExternalSmilePopup] Timed out waiting for quote after', maxAttempts, 'attempts');
                setQuote({
                  id: 'fallback',
                  content: "The only way to do great work is to love what you do.",
                  author: "Steve Jobs",
                  source: 'random'
                });
                setIsLoading(false);
              } else {
                setTimeout(pollForQuotes, 500);
              }
            }
          } catch (error) {
            console.error('[ExternalSmilePopup] Error getting quote:', error);
            if (attempts >= maxAttempts) setIsLoading(false);
            else setTimeout(pollForQuotes, 500);
          }
        };

        // Start polling
        pollForQuotes();
      }, 300); // Wait 300ms for data to be ready

      // Clean up if component unmounts (though for popup this is rare until close)
      return () => { };
    }
  }, [showQuotes, activePlaylistId, getNextQuote]);

  // REACTIVE FIX: Immediately try to load quote when dependencies change (user login, cache load, etc.)
  // ALSO: If we are currently showing the fallback quote, try again when data updates!
  useEffect(() => {
    const isFallback = quote?.id === 'fallback';

    if ((isLoading || isFallback) && showQuotes) {
      const result = getNextQuote();
      if (result && result.quote) {
        console.log('[ExternalSmilePopup] Reactive load success (overwriting fallback/loading):', result.quote.id);
        setQuote({
          id: result.quote.id,
          content: result.quote.content,
          author: result.quote.author || 'Unknown',
          source: result.source,
          playlistName: result.playlistName
        });
        setIsLoading(false);
      }
    }
  }, [isLoading, quote?.id, showQuotes, getNextQuote, allQuotes.length, activePlaylistId, user]);

  // Auto close timer
  useEffect(() => {
    console.log('Auto-close effect triggered:', {
      safeAutoClose,
      timeLeft,
      willClose: safeAutoClose && timeLeft === 0
    });

    if (!safeAutoClose) {
      console.log('Auto-close is disabled, popup will stay open indefinitely');
      return;
    }

    if (safeAutoClose && timeLeft > 0) {
      console.log(`Auto-close countdown: ${timeLeft} seconds remaining`);
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (safeAutoClose && timeLeft === 0) {
      console.log('Auto-close timer reached zero, closing window');
      window.close();
    }
  }, [safeAutoClose, timeLeft]);

  const handleAction = (type: 'continue' | 'skip') => {
    console.log('handleAction called with type:', type);
    // Send message back to extension
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'SMILE_POPUP_ACTION',
        action: type
      });
    }
    console.log('Closing window due to user action');
    window.close();
  };

  const handleClose = () => {
    console.log('handleClose called - user clicked close button');
    window.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4 relative">
      {/* Celebration Effects */}
      <CelebrationEffects isVisible={showCelebration} />

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Auto close indicator with progress */}
      {safeAutoClose && timeLeft > 0 && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg px-4 py-3 text-white text-sm font-medium border border-white/20 min-w-[180px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Auto-closing in {timeLeft}s
            </div>
            {/* Progress bar */}
            <div className="w-full bg-white/20 rounded-full h-1">
              <div
                className="bg-white rounded-full h-1 transition-all duration-1000 ease-linear"
                style={{
                  width: `${((initialDelay - timeLeft) / initialDelay) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <Card className="w-full max-w-md text-center shadow-2xl border-0 bg-white/95 backdrop-blur-sm animate-in zoom-in-95 duration-500 relative z-10">
        <CardHeader className="pb-6">
          {customImage && (
            <div className="mb-6">
              <img
                src={customImage}
                alt="Custom motivation"
                className="max-h-32 w-auto mx-auto rounded-xl shadow-lg"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-600 px-6 py-3 rounded-full text-lg font-bold shadow-lg animate-pulse border border-green-500/30">
                🎉 Session Complete!
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Great Work!
            </h1>
            <p className="text-gray-600 text-lg">
              Time to Smile and recharge!
            </p>

            {taskTitle && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">You just focused on</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-medium text-gray-800 truncate max-w-[200px]">
                    {taskTitle}
                  </span>
                  {category && (
                    <Badge
                      variant={category === 'signal' ? 'default' : 'secondary'}
                      className={`text-[10px] h-5 px-1.5 ${category === 'signal' ? 'bg-yellow-500 hover:bg-yellow-600' : ''
                        }`}
                    >
                      {category === 'signal' ? <Zap className="h-3 w-3 mr-1" /> : <Bell className="h-3 w-3 mr-1" />}
                      {category === 'signal' ? 'Signal ⚡' : 'Noise 🔔'}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {showQuotes && (
            <>
              {isLoading ? (
                <div className="space-y-4 py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                  </div>
                </div>
              ) : quote ? (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <blockquote className="text-lg leading-relaxed font-medium italic text-gray-800">
                    "{quote.content}"
                  </blockquote>
                  <cite className="block text-right mt-4 not-italic text-gray-600 font-medium flex flex-col items-end">
                    <span>— {quote.author}</span>
                    {quote.source === 'playlist' && (
                      <Badge variant="secondary" className="mt-2 text-[10px] bg-purple-100 text-purple-600 hover:bg-purple-200">
                        <ListMusic className="w-3 h-3 mr-1" />
                        {quote.playlistName || 'Playlist'}
                      </Badge>
                    )}
                  </cite>
                </div>
              ) : null}
            </>
          )}

          <div className="flex justify-center gap-4 pt-4">
            <Button
              onClick={() => {
                handleAction('skip');
                onSkipBreak?.();
              }}
              variant="outline"
              size="lg"
              className="gap-2 hover:scale-105 transition-all duration-200"
            >
              <SkipForward className="h-4 w-4" />
              Skip Break
            </Button>
            <Button
              onClick={() => {
                handleAction('continue');
                onStartBreak?.();
              }}
              size="lg"
              className="gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <Coffee className="h-4 w-4" />
              Start Break
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            Session {sessionCount} completed • Keep up the great work!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}