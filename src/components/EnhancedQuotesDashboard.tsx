import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, Sparkles, Download, Share, Trash2, Search, Filter, Edit3, Plus, Bot, Wand2, Loader2, Wifi, WifiOff, AlertCircle, Music, List, Play, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useQuotesState } from '@/hooks/useQuotesState';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function EnhancedQuotesDashboard() {
  const { user } = useAuth();
  const {
    quotes,
    allQuotes,
    categories,
    searchTerm,
    selectedCategory,
    localQuoteCount,
    favoriteQuotes,
    customQuotes,
    aiQuotes,
    isLoading,
    isSyncing,
    isAIConfigured,
    createQuote,
    updateQuote,
    deleteQuote,
    toggleFavorite,
    setSearchTerm,
    setSelectedCategory,
    generateAIQuote,
    syncLocalQuotes,
    reorderQuotes,
    sortBy,
    setSortBy,
    playlists,
    activePlaylistId,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    toggleActivePlaylist,
    autoTagQuote
  } = useQuotesState();

  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [newQuoteCategory, setNewQuoteCategory] = useState('');
  const [isAutoTagging, setIsAutoTagging] = useState(false);

  const [editingQuote, setEditingQuote] = useState<{
    id: string;
    content: string;
    author: string;
    category: string;
  } | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleAutoTag = async () => {
    if (!newQuoteText.trim()) return;
    if (!isAIConfigured) {
      toast.error("Configure AI in settings first!");
      return;
    }

    setIsAutoTagging(true);
    const tag = await autoTagQuote(newQuoteText, newQuoteAuthor);
    setIsAutoTagging(false);

    if (tag) {
      setNewQuoteCategory(tag);
      toast.success(`Auto-tagged as "${tag}"`);
    } else {
      toast.error("Could not auto-tag");
    }
  };

  const addQuote = async () => {
    if (!newQuoteText.trim() || !newQuoteAuthor.trim()) return;

    try {
      await createQuote({
        content: newQuoteText.trim(),
        author: newQuoteAuthor.trim(),
        category: newQuoteCategory || 'Custom'
      });

      setNewQuoteText('');
      setNewQuoteAuthor('');
      setNewQuoteCategory('');

      toast.success('Quote added successfully!');
    } catch (error) {
      toast.error('Failed to add quote');
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    try {
      await deleteQuote(quoteId);
      toast.success('Quote deleted successfully');
    } catch (error) {
      toast.error('Failed to delete quote');
    }
  };

  const handleToggleFavorite = (quoteId: string) => {
    toggleFavorite(quoteId);
    const quote = allQuotes.find(q => q.id === quoteId);
    if (quote) {
      toast.success(quote.isFavorite ? 'Removed from favorites' : 'Added to favorites');
    }
  };

  const generateCustomQuote = async () => {
    if (!customPrompt.trim()) {
      toast.error('Please enter a prompt for quote generation.');
      return;
    }

    if (!isAIConfigured) {
      toast.error('Please configure your Gemini API key and select a model in Settings first.');
      return;
    }

    setIsGenerating(true);

    try {
      await generateAIQuote(customPrompt);
      setCustomPrompt('');
      toast.success('Quote generated successfully! ✨');
    } catch (error) {
      console.error('Error generating quote:', error);
      toast.error(`Failed to generate quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQuickQuote = async () => {
    if (!isAIConfigured) {
      toast.error('Please configure your Gemini API key first.');
      return;
    }

    const vibes = [
      'Epic Motivation', 'Deep Stoic Wisdom', 'Coding Flow', 'Creative Spark',
      'Calmness', 'Relentless Discipline', 'Joy of Learning', 'Overcoming Failure'
    ];
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];

    setCustomPrompt(`Surprise me with a quote about ${randomVibe}`);
    setIsGenerating(true); // Manually set loading since we are calling directly

    try {
      await generateAIQuote(randomVibe); // Generate based on mood/topic
      setCustomPrompt(''); // Clear prompt after
      toast.success(`Generated a ${randomVibe} quote! ✨`);
    } catch (error) {
      toast.error('Failed to generate. Check settings.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ... (Render changes for Auto-tag button in TabsContent value="create")

  // ... replace the Category input section ...


  const handleSyncLocal = async () => {
    try {
      await syncLocalQuotes();
      toast.success('Local quotes synced to database');
    } catch (error) {
      toast.error('Failed to sync local quotes');
    }
  };

  return (
    <div className="space-y-8 p-1 min-h-[80vh] bg-[#0B121E] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 to-[#0B121E] rounded-[2rem] overflow-hidden relative font-sans">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header with Status */}
      <div className="flex items-center justify-between px-4 sm:px-6 relative z-10 pt-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-[2px] uppercase bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">Inspiration Library</h2>
          <p className="text-white/60 text-sm mt-1 font-light tracking-wide">
            {user ? 'YOUR PERSONAL COLLECTION SYNCED ACROSS DEVICES' : 'SIGN IN TO SAVE AND SYNC QUOTES'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Status Indicator */}
          <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 backdrop-blur-md">
            {isSyncing ? (
              <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
            ) : user ? (
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-slate-500"></div>
            )}
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
              {isSyncing ? 'Syncing' : user ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Local Quotes Badge */}
          {localQuoteCount > 0 && (
            <Badge variant="secondary" className="glass bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs hover:bg-yellow-500/20">
              {localQuoteCount} LOCAL
            </Badge>
          )}

          {/* Sync Button */}
          {localQuoteCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSyncLocal}
              disabled={!user || isSyncing}
              className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-full"
            >
              <Wifi className="w-3 h-3 mr-1" />
              SYNC
            </Button>
          )}
        </div>
      </div>

      {/* Statistics - Tier A: Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-6">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[1.5rem] p-6 text-center group transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <div className="text-5xl font-bold text-white mb-1 tracking-tight">{allQuotes.length}</div>
            <div className="text-xs font-bold text-white/70 uppercase tracking-[1.5px]">Total Quotes</div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-[1.5rem] p-6 text-center group transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <div className="text-5xl font-bold text-white mb-1 tracking-tight">{favoriteQuotes.length}</div>
            <div className="text-xs font-bold text-white/70 uppercase tracking-[1.5px]">Favorites</div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[1.5rem] p-6 text-center group transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(52,211,153,0.3)]">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <div className="text-5xl font-bold text-white mb-1 tracking-tight">{customQuotes.length}</div>
            <div className="text-xs font-bold text-white/70 uppercase tracking-[1.5px]">Custom</div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 to-violet-700 rounded-[1.5rem] p-6 text-center group transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <div className="text-5xl font-bold text-white mb-1 tracking-tight">{aiQuotes.length}</div>
            <div className="text-xs font-bold text-white/70 uppercase tracking-[1.5px]">AI Gems</div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="w-full px-4 sm:px-6">
        <TabsList className="bg-black/30 backdrop-blur-xl border border-white/5 rounded-full p-1.5 h-auto grid w-full max-w-xl mx-auto grid-cols-4 mb-8">
          <TabsTrigger value="browse" className="rounded-full text-xs font-medium py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/50 transition-all">BROWSE</TabsTrigger>
          <TabsTrigger value="create" className="rounded-full text-xs font-medium py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/50 transition-all">CREATE</TabsTrigger>
          <TabsTrigger value="ai" className="rounded-full text-xs font-medium py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/50 transition-all flex items-center justify-center gap-1.5"><Sparkles className="w-3 h-3" /> AI GENERATOR</TabsTrigger>
          <TabsTrigger value="playlists" className="rounded-full text-xs font-medium py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/50 transition-all flex items-center justify-center gap-1.5"><List className="w-3 h-3" /> LISTS</TabsTrigger>
        </TabsList>

        {/* Browse Quotes Tab */}
        <TabsContent value="browse" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
              <Input
                placeholder={user ? "Search your collection..." : "Sign in to search"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 bg-black/20 border-white/5 rounded-full text-white placeholder:text-white/20 focus:bg-black/40 focus:border-cyan-500/50 focus:ring-0 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all h-12"
                disabled={isSyncing}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 bg-black/20 border-white/5 rounded-full text-white/80 h-12 px-6 hover:bg-white/5 focus:ring-0">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-white/40" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#0B121E]/95 backdrop-blur-xl border-white/10 text-white">
                {categories.map(category => (
                  <SelectItem key={category} value={category} className="focus:bg-white/10 focus:text-cyan-400 cursor-pointer">
                    {category === 'all' ? 'All Categories' :
                      category === 'favorites' ? 'Favorites' :
                        category === 'custom' ? 'Custom Quotes' :
                          category === 'ai' ? 'AI Generated' :
                            category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort and Count */}
          <div className="flex justify-between items-center mb-6 px-2">
            <div className="text-xs font-bold text-white/40 uppercase tracking-widest">
              {quotes.length} QUOTES FOUND
            </div>

            {/* Sort By Selector */}
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="w-[140px] bg-transparent border-0 text-white/50 hover:text-white h-auto p-0 gap-1 text-xs uppercase font-bold tracking-wider hover:bg-transparent focus:ring-0">
                <span className="mr-1">SORT BY:</span> <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#0B121E]/95 backdrop-blur-xl border-white/10 text-white min-w-[160px]">
                <SelectItem value="custom" className="focus:bg-white/10 focus:text-cyan-400 cursor-pointer text-xs uppercase tracking-wide">My Order</SelectItem>
                <SelectItem value="newest" className="focus:bg-white/10 focus:text-cyan-400 cursor-pointer text-xs uppercase tracking-wide">Newest First</SelectItem>
                <SelectItem value="oldest" className="focus:bg-white/10 focus:text-cyan-400 cursor-pointer text-xs uppercase tracking-wide">Oldest First</SelectItem>
                <SelectItem value="author" className="focus:bg-white/10 focus:text-cyan-400 cursor-pointer text-xs uppercase tracking-wide">Author (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-cyan-500" />
              <p className="text-white/40 tracking-wider text-sm animate-pulse">LOADING LIBRARY...</p>
            </div>
          ) : (
            <div
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              onDragOver={(e) => e.preventDefault()}
            >
              {quotes.map((quote, index) => {
                const isDraggable = !searchTerm && selectedCategory === 'all';

                return (
                  <Card
                    key={quote.id}
                    draggable={isDraggable}
                    onDragStart={(e) => {
                      if (!isDraggable) {
                        e.preventDefault();
                        return;
                      }
                      e.dataTransfer.setData('text/plain', index.toString());
                      (e.target as HTMLElement).style.opacity = '0.5';
                    }}
                    onDragEnd={(e) => {
                      (e.target as HTMLElement).style.opacity = '1';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!isDraggable) return;

                      (e.target as HTMLElement).style.opacity = '1';
                      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                      const toIndex = index;

                      if (fromIndex === toIndex || isNaN(fromIndex)) return;

                      const newQuotes = [...quotes];
                      const [movedItem] = newQuotes.splice(fromIndex, 1);
                      newQuotes.splice(toIndex, 0, movedItem);

                      // Update order in state and switch mode
                      reorderQuotes(newQuotes.map(q => q.id));
                      if (sortBy !== 'custom') {
                        setSortBy('custom');
                        toast.info('Switched to Custom Order');
                      }
                    }}
                    // Tier B: The Quote Library Grid (Functional Glass)
                    className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:border-white/30 relative group
                    ${isDraggable ? 'cursor-move' : ''}
                    ${quote.isLocal ? 'border-l-2 border-l-yellow-500/50' : ''}
                    ${sortBy === 'custom' && isDraggable ? 'border-dashed border-white/10' : ''}
                  `}
                  >
                    {/* Drag Handle Indicator */}
                    {isDraggable && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white cursor-grab active:cursor-grabbing" title="Drag to reorder">
                          <div className="flex gap-[3px]">
                            <div className="w-1 h-1 bg-current rounded-full"></div>
                            <div className="w-1 h-1 bg-current rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-5 h-full flex flex-col">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={quote.isAiGenerated ? "secondary" : "outline"} className={`text-[10px] uppercase tracking-wider py-1 px-2 border-0 ${quote.isAiGenerated ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/10 text-cyan-300'}`}>
                            {quote.isAiGenerated ? (
                              <><Bot className="mr-1 h-3 w-3" /> AI GEM</>
                            ) : (
                              quote.category || 'GENERAL'
                            )}
                          </Badge>
                          {quote.isLocal && (
                            <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-500 uppercase tracking-wider">
                              Local
                            </Badge>
                          )}
                        </div>
                      </div>

                      <blockquote className="text-[17px] font-medium text-white/90 leading-relaxed font-sans flex-1">
                        "{quote.content}"
                      </blockquote>

                      <div>
                        <div className="flex items-center justify-between text-xs text-white/40 font-mono mb-4 pt-4 border-t border-white/5">
                          <span className="uppercase tracking-wide">— {quote.author || 'UNKNOWN'}</span>
                          <span>{new Date(quote.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="flex gap-2 justify-end opacity-60 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(quote.id);
                            }}
                            className={`h-8 w-8 rounded-full hover:bg-white/10 ${quote.isFavorite ? 'text-red-500 hover:text-red-400' : 'text-white/40 hover:text-white'}`}
                            disabled={isSyncing}
                          >
                            <Heart className={`h-4 w-4 ${quote.isFavorite ? 'fill-current' : ''}`} />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/40 hover:text-cyan-400 hover:bg-white/10" onClick={(e) => e.stopPropagation()}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#0B121E] border-white/10 text-white w-48" onCloseAutoFocus={(e) => e.preventDefault()}>
                              <DropdownMenuLabel>Add to Playlist</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/10" />
                              {playlists.length === 0 ? (
                                <div className="px-2 py-2 text-xs text-white/40">No playlists created</div>
                              ) : (
                                playlists.map(p => {
                                  const isInPlaylist = p.quoteIds.includes(quote.id);
                                  return (
                                    <DropdownMenuItem
                                      key={p.id}
                                      className="focus:bg-white/10 cursor-pointer text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isInPlaylist) {
                                          removeFromPlaylist(p.id, quote.id);
                                          toast.success(`Removed from ${p.name}`);
                                        } else {
                                          addToPlaylist(p.id, quote.id);
                                          toast.success(`Added to ${p.name}`);
                                        }
                                      }}
                                    >
                                      <div className="flex items-center w-full">
                                        {isInPlaylist ? <CheckCircle2 className="w-3 h-3 mr-2 text-green-400" /> : <div className="w-3 h-3 mr-2" />}
                                        <span className="truncate">{p.name}</span>
                                      </div>
                                    </DropdownMenuItem>
                                  );
                                })
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingQuote(quote);
                                }}
                                className="h-8 w-8 rounded-full text-white/40 hover:text-cyan-400 hover:bg-white/10"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent onMouseDown={(e) => e.stopPropagation()} className="bg-[#0B121E]/95 backdrop-blur-2xl border-white/10 text-white sm:rounded-[1.5rem] p-6">
                              <DialogHeader>
                                <DialogTitle className="text-xl font-bold tracking-wide">EDIT QUOTE</DialogTitle>
                              </DialogHeader>
                              {editingQuote && (
                                <div className="space-y-4 mt-4">
                                  <Textarea
                                    value={editingQuote.content}
                                    onChange={(e) => setEditingQuote(prev =>
                                      prev ? { ...prev, content: e.target.value } : null
                                    )}
                                    className="min-h-32 bg-black/30 border-white/10 focus:border-cyan-500/50 rounded-xl text-base p-4"
                                  />
                                  <div className="grid grid-cols-2 gap-4">
                                    <Input
                                      value={editingQuote.author}
                                      onChange={(e) => setEditingQuote(prev =>
                                        prev ? { ...prev, author: e.target.value } : null
                                      )}
                                      placeholder="Author"
                                      className="bg-black/30 border-white/10 focus:border-cyan-500/50 rounded-xl h-11"
                                    />
                                    <Input
                                      value={editingQuote.category}
                                      onChange={(e) => setEditingQuote(prev =>
                                        prev ? { ...prev, category: e.target.value } : null
                                      )}
                                      placeholder="Category"
                                      className="bg-black/30 border-white/10 focus:border-cyan-500/50 rounded-xl h-11"
                                    />
                                  </div>
                                  <Button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (editingQuote) {
                                        try {
                                          await updateQuote(editingQuote.id, {
                                            content: editingQuote.content,
                                            author: editingQuote.author,
                                            category: editingQuote.category
                                          });
                                          setEditingQuote(null);
                                          toast.success('Quote updated successfully');
                                        } catch (error) {
                                          toast.error('Failed to update quote');
                                        }
                                      }
                                    }}
                                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-11 rounded-xl mt-2"
                                  >
                                    SAVE CHANGES
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/40 hover:text-red-500 hover:bg-white/10" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onMouseDown={(e) => e.stopPropagation()} className="bg-[#0B121E]/95 backdrop-blur-2xl border-white/10 text-white sm:rounded-[1.5rem]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="tracking-wide">DELETE QUOTE?</AlertDialogTitle>
                                <AlertDialogDescription className="text-white/60">
                                  Are you sure you want to delete this quote? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 rounded-full px-6">CANCEL</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteQuote(quote.id);
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 border-0"
                                >
                                  DELETE
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {!isLoading && quotes.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
              <div className="text-6xl mb-6 opacity-20">✨</div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-wide">YOUR LIBRARY IS EMPTY</h3>
              <p className="text-white/40 max-w-sm mx-auto">
                {selectedCategory === 'all'
                  ? "Start building your personal collection of wisdom and inspiration."
                  : `No ${selectedCategory} quotes found.`}
              </p>
            </div>
          )}
        </TabsContent>


        {/* Playlists Tab */}
        <TabsContent value="playlists" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-gradient-to-br from-indigo-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-wide">YOUR MIXES</h3>
                <p className="text-white/50 text-sm mt-1">Curate collections for every mood. Activate a playlist to cycle through it in the timer popup.</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Input
                  placeholder="New Playlist Name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="bg-black/30 border-white/10 focus:border-indigo-500/50 rounded-xl text-white placeholder:text-white/20"
                />
                <Button
                  onClick={() => {
                    if (newPlaylistName.trim()) {
                      createPlaylist(newPlaylistName.trim());
                      setNewPlaylistName('');
                      toast.success('Playlist created!');
                    }
                  }}
                  disabled={!newPlaylistName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" /> CREATE
                </Button>
              </div>
            </div>

            {playlists.length === 0 ? (
              <div className="text-center py-12 border border-white/5 border-dashed rounded-2xl">
                <List className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40">No playlists yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {playlists.map(playlist => {
                  const isActive = activePlaylistId === playlist.id;
                  const quoteCount = playlist.quoteIds.length;

                  return (
                    <Card key={playlist.id} className={`bg-white/5 border ${isActive ? 'border-green-500/50 bg-green-500/5' : 'border-white/10'} rounded-2xl p-5 transition-all`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-bold text-white">{playlist.name}</h4>
                            {isActive && <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px]">ACTIVE</Badge>}
                          </div>
                          <p className="text-xs text-white/40">{quoteCount} quotes • Created {new Date(playlist.createdAt).toLocaleDateString()}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white rounded-full">
                              <List className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#0B121E] border-white/10 text-white w-56">
                            <DropdownMenuLabel>Manage Playlist</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={() => toggleActivePlaylist(isActive ? null : playlist.id)}>
                              {isActive ? <><X className="w-4 h-4 mr-2" /> Deactivate</> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Set as Active</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-red-900/20 focus:text-red-400 cursor-pointer text-red-400" onClick={() => {
                              deletePlaylist(playlist.id);
                              toast.success('Playlist deleted');
                            }}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={isActive ? "default" : "outline"}
                          className={`flex-1 h-9 text-xs font-bold rounded-lg ${isActive ? 'bg-green-600 hover:bg-green-500 text-white' : 'border-white/10 text-white/60 hover:text-white hover:bg-white/5'}`}
                          onClick={() => toggleActivePlaylist(isActive ? null : playlist.id)}
                        >
                          {isActive ? <><Play className="w-3 h-3 mr-2 fill-current" /> PLAYING</> : "ACTIVATE"}
                        </Button>
                      </div>

                      {/* Preview of items */}
                      {quoteCount > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {playlist.quoteIds.map(qid => {
                            const q = allQuotes.find(iq => iq.id === qid);
                            if (!q) return null;
                            return (
                              <div key={qid} className="flex justify-between items-center group/item text-xs text-white/60 bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                                <span className="truncate flex-1 mr-2">"{q.content}"</span>
                                <button
                                  onClick={() => removeFromPlaylist(playlist.id, qid)}
                                  className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-red-400 transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-3 tracking-wide">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Plus className="h-5 w-5" />
              </div>
              ADD NEW QUOTE
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Quote Content</label>
                <Textarea
                  placeholder="Enter the quote text..."
                  value={newQuoteText}
                  onChange={(e) => setNewQuoteText(e.target.value)}
                  className="bg-black/30 border-white/10 focus:border-cyan-500/50 rounded-2xl min-h-32 text-lg p-4 text-white placeholder:text-white/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Author</label>
                  <Input
                    placeholder="Author name"
                    value={newQuoteAuthor}
                    onChange={(e) => setNewQuoteAuthor(e.target.value)}
                    className="bg-black/30 border-white/10 focus:border-cyan-500/50 rounded-xl h-12 text-white placeholder:text-white/20"
                  />
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Category</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Motivation (Optional)"
                      value={newQuoteCategory}
                      onChange={(e) => setNewQuoteCategory(e.target.value)}
                      className="bg-black/30 border-white/10 focus:border-cyan-500/50 rounded-xl h-12 text-white placeholder:text-white/20 flex-1"
                    />
                    <Button
                      onClick={handleAutoTag}
                      disabled={isAutoTagging || !newQuoteText}
                      variant="outline"
                      className="h-12 border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                      title="Auto-Tag with AI"
                    >
                      {isAutoTagging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                onClick={addQuote}
                disabled={!newQuoteText.trim() || !newQuoteAuthor.trim() || isSyncing}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-cyan-500/20 tracking-wide mt-4"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ADDING TO LIBRARY...
                  </>
                ) : (
                  <>
                    ADD TO COLLECTION
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* AI Generator Tab */}
        <TabsContent value="ai" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-gradient-to-br from-purple-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 space-y-8">
              <div className="text-center space-y-4 max-w-xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-2">
                  <Sparkles className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-wide">AI QUOTE CRAFTER</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Generate inspirational quotes tailored to your specific needs using advanced AI.
                  Describe the theme, mood, or context, and let the magic happen.
                </p>
              </div>

              {/* Custom Prompt Section */}
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-purple-300/70 uppercase tracking-wider ml-1">Describe your quote</label>
                  <Textarea
                    placeholder="e.g. 'A stoic quote about staying calm under pressure' or 'Motivation for finishing a difficult coding project'..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="bg-black/40 border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-500/50 rounded-2xl min-h-24 text-lg p-5 text-white placeholder:text-white/20"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={generateCustomQuote}
                    disabled={isGenerating || !customPrompt.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-purple-500/20"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                        CRAFTING...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-5 w-5" />
                        GENERATE QUOTE
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={generateQuickQuote}
                    disabled={isGenerating}
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 text-white h-12 rounded-xl px-6"
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />
                    Surprise Me
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent AI Generated Quotes */}
          {aiQuotes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2 px-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Recently Generated</h4>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {aiQuotes.slice(0, 3).map(quote => (
                  <Card key={quote.id} className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6 relative group hover:bg-purple-500/10 transition-colors">
                    <blockquote className="text-sm font-medium text-white/90 italic leading-relaxed mb-4">
                      "{quote.content}"
                    </blockquote>
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                      <span className="text-xs text-purple-300/60 font-mono">{quote.author}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFavorite(quote.id)}
                          className="h-7 w-7 rounded-full hover:bg-white/10 text-white/40 hover:text-red-400"
                          disabled={isSyncing}
                        >
                          <Heart className={`h-3.5 w-3.5 ${quote.isFavorite ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-white/10 text-white/40 hover:text-red-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#0B121E] border-white/10 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                              <AlertDialogDescription className="text-white/60">Permanently remove this AI generated quote?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteQuote(quote.id)} className="bg-red-500 hover:bg-red-600 border-0">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}