import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Coffee, SkipForward, Sparkles, X, Zap, Bell, ListMusic } from 'lucide-react';
import { useSmilePopupSettings } from '@/hooks/useChromeStorage';
import { useQuotesState } from '@/hooks/useQuotesState';

interface DisplayQuote {
  id: string;
  content: string;
  author: string;
  source?: 'playlist' | 'random';
  playlistName?: string;
}

interface SmilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSkipBreak: () => void;
  onStartBreak: () => void;
  sessionType: 'focus' | 'short_break' | 'long_break';
  sessionCount: number;
  customImage?: string;
  taskTitle?: string;
  category?: 'signal' | 'noise';
}

const CelebrationEffects = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
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

const SmilePopup: React.FC<SmilePopupProps> = ({
  isOpen,
  onClose,
  onSkipBreak,
  onStartBreak,
  sessionType,
  sessionCount,
  customImage,
  taskTitle,
  category
}) => {
  const { value: settings } = useSmilePopupSettings();
  const { getNextQuote } = useQuotesState();

  const [quote, setQuote] = useState<DisplayQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasLoaded = React.useRef(false);

  // Reset loaded state when closed so it re-fetches next time
  useEffect(() => {
    if (!isOpen) {
      hasLoaded.current = false;
      setQuote(null); // Clear previous quote
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && settings.showQuotes && !hasLoaded.current) {
      hasLoaded.current = true;
      setIsLoading(true);

      // Simulate loading for effect
      const timer = setTimeout(() => {
        try {
          const result = getNextQuote();
          if (result && result.quote) {
            setQuote({
              id: result.quote.id,
              content: result.quote.content,
              author: result.quote.author || 'Unknown',
              source: result.source,
              playlistName: result.playlistName
            });
          } else {
            // Fallback
            setQuote({
              id: 'fallback',
              content: "The only way to do great work is to love what you do.",
              author: "Steve Jobs",
              source: 'random'
            });
          }
        } catch (error) {
          console.error("Error fetching quote:", error);
          setQuote({
            id: 'fallback',
            content: "The only way to do great work is to love what you do.",
            author: "Steve Jobs",
            source: 'random'
          });
        } finally {
          setIsLoading(false);
        }
      }, 800);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, settings.showQuotes]); // Only depend on isOpen & settings, not getNextQuote

  // Handle audio playback
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;

    if (isOpen && settings.enableSound) {
      const soundSrc = settings.customSound || 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'; // Default success chime

      audio = new Audio(soundSrc);
      audio.volume = 0.5; // Reasonable default volume
      audio.loop = true; // User requested "smile loop" 30s-1min

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
  }, [isOpen, settings.enableSound, settings.customSound]);

  const handleAction = (action: 'skip' | 'smile') => {
    if (action === 'skip') {
      onSkipBreak();
    } else {
      onStartBreak();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-1">
          <CelebrationEffects isVisible={settings.showCelebration ?? true} />

          <Card className="border-0 bg-white/95 backdrop-blur-sm relative z-10">
            <CardHeader className="pb-6 text-center">
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
                          {category === 'signal' ? 'Signal ⚡' : 'Noise 🔔'}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {settings.showQuotes && (
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
                      <blockquote className="text-lg leading-relaxed font-medium italic text-gray-800 text-center">
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
                  onClick={() => handleAction('skip')}
                  variant="outline"
                  size="lg"
                  className="gap-2 hover:scale-105 transition-all duration-200"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip Break
                </Button>
                <Button
                  onClick={() => handleAction('smile')}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-white"
                >
                  <Coffee className="h-4 w-4" />
                  Start Break
                </Button>
              </div>

              <div className="text-sm text-gray-500 text-center">
                Session {sessionCount} completed • Keep up the great work!
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmilePopup;