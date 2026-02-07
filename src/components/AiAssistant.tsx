import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Bot,
  Send,
  Sparkles,
  Lightbulb,
  Target,
  Clock,
  MessageCircle,
  History,
  Plus,
  Archive,
  Trash2,
  Loader2,
  RefreshCw,
  MoreVertical,
  Check,
  X
} from 'lucide-react';
import { generateGeminiResponse } from '@/lib/gemini';
import { useGeminiSettings } from '@/hooks/useGeminiSettings';
import { useAuth } from '@/hooks/useAuth';
import {
  useActiveConversation,
  useConversationMessages,
  useAddChatMessage,
  useChatConversations,
  useCreateConversation,
  useArchiveConversation,
  useDeleteConversation,
  useChatStats
} from '@/hooks/useConvexQueries';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'suggestion' | 'tip' | 'encouragement';
}

export function AiAssistant() {
  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('chat');

  const { settings: geminiSettings } = useGeminiSettings();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Data fetching hooks
  const { data: activeConversation, isLoading: conversationLoading } = useActiveConversation();
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useConversationMessages(currentConversationId || undefined);
  const { data: conversations = [] } = useChatConversations();
  const { data: chatStats } = useChatStats();

  // Mutation hooks
  const addMessage = useAddChatMessage();
  const createConversation = useCreateConversation();
  const archiveConversation = useArchiveConversation();
  const deleteConversation = useDeleteConversation();

  // Initialize current conversation
  useEffect(() => {
    if (activeConversation && !currentConversationId) {
      setCurrentConversationId(activeConversation.id);
    }
  }, [activeConversation]);

  // Convert database messages to component format
  const formattedMessages: Message[] = messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    sender: msg.sender,
    timestamp: new Date(msg.created_at),
    type: msg.message_type as 'suggestion' | 'tip' | 'encouragement'
  }));

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [formattedMessages, activeTab]);

  useEffect(() => {
    if (currentConversationId && messages.length === 0 && !messagesLoading && activeConversation?.id === currentConversationId) {
      const welcomeMessage = {
        conversation_id: currentConversationId,
        user_id: user!.id,
        content: 'Hello! I\'m your AI productivity coach. I can help you with focus techniques, productivity tips, and motivation. How can I assist you today?',
        sender: 'ai' as const,
        message_type: 'encouragement' as const,
      };

      addMessage.mutate(welcomeMessage);
    }
  }, [currentConversationId, messages.length, messagesLoading, activeConversation]);

  const quickSuggestions = [
    'How can I improve my focus?',
    'What\'s the best break strategy?',
    'I\'m feeling unmotivated',
    'Tips for deep work sessions',
    'Avoid digital distractions',
    'Create a motivational quote'
  ];

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversationId || !user) return;

    if (!geminiSettings.isConfigured) {
      toast.error('Please set your Gemini API key and select a model in Settings first.');
      return;
    }

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    const startTime = Date.now();

    try {
      await addMessage.mutateAsync({
        conversation_id: currentConversationId,
        user_id: user.id,
        content: messageContent,
        sender: 'user',
        message_type: 'text',
      });

      const aiResponseContent = await generateGeminiResponse(
        geminiSettings.apiKey!,
        messageContent,
        geminiSettings.model!
      );

      const responseTime = Date.now() - startTime;
      const messageType = determineMessageType(aiResponseContent);

      await addMessage.mutateAsync({
        conversation_id: currentConversationId,
        user_id: user.id,
        content: aiResponseContent,
        sender: 'ai',
        message_type: messageType,
        response_time_ms: responseTime,
        tokens_used: Math.ceil(aiResponseContent.length / 4),
      });

      toast.success('Response generated successfully!');
    } catch (error) {
      console.error('Error generating Gemini response:', error);

      await addMessage.mutateAsync({
        conversation_id: currentConversationId,
        user_id: user.id,
        content: 'Sorry, I could not generate a response. Please check your API key and model selection.',
        sender: 'ai',
        message_type: 'encouragement',
        response_time_ms: Date.now() - startTime,
      });

      toast.error('Failed to generate AI response. Please check your settings.');
    } finally {
      setIsTyping(false);
    }
  };

  const determineMessageType = (content: string): 'text' | 'suggestion' | 'tip' | 'encouragement' => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('try') || lowerContent.includes('consider') || lowerContent.includes('suggest')) return 'suggestion';
    if (lowerContent.includes('tip') || lowerContent.includes('technique') || lowerContent.includes('method')) return 'tip';
    if (lowerContent.includes('you can') || lowerContent.includes('believe') || lowerContent.includes('great')) return 'encouragement';
    return 'text';
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await createConversation.mutateAsync({ title: 'New Conversation' });
      setCurrentConversationId(newConv.id);
      setActiveTab('chat');
      toast.success('New conversation started!');
    } catch (error) {
      toast.error('Failed to create new conversation');
    }
  };

  const handleArchiveConversation = async () => {
    if (!currentConversationId) return;
    try {
      await archiveConversation.mutateAsync(currentConversationId);
      toast.success('Conversation archived');
    } catch (error) {
      toast.error('Failed to archive conversation');
    }
  };

  const handleResumeChat = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // Add a small delay/ensure state update? React state updates are batched.
    // Switching tab immediately is fine.
    setActiveTab('chat');
  }

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Prevent triggering resume
    if (window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      try {
        await deleteConversation.mutateAsync(conversationId);
        if (currentConversationId === conversationId) {
          // If deleted active one, try to fall back to another or null
          setCurrentConversationId(activeConversation?.id === conversationId ? null : activeConversation?.id || null);
        }
        toast.success('Conversation deleted');
      } catch (error) {
        toast.error('Failed to delete conversation');
      }
    }
  }

  const sendQuickMessage = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'tip': return <Target className="h-4 w-4 text-blue-500" />;
      case 'encouragement': return <Sparkles className="h-4 w-4 text-green-500" />;
      default: return <Bot className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="flex flex-col h-full relative font-sans selection:bg-cyan-500/30">
      {/* Background Glows matching design */}
      <div className="absolute top-10 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-20 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Header - Matching design 'AI Coach' */}
      <div className="px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-semibold text-xl tracking-tight text-white/90">AI Coach</span>
            <span className="text-[10px] font-medium tracking-wider text-cyan-400 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Online
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex items-center gap-2 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 transition-all mr-2"
            onClick={() => window.open('https://chrome.google.com/webstore/detail/your-extension-id', '_blank')}
          >
            <span className="material-symbols-outlined text-sm">extension</span>
            <span className="text-xs font-medium">Get Extension</span>
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/5" onClick={handleNewConversation}>
            <span className="material-symbols-outlined text-xl">add</span>
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/5">
            <span className="material-symbols-outlined text-xl">more_horiz</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col h-0 w-full relative z-0">
        <TabsContent value="chat" className="flex-1 flex flex-col h-0 m-0 data-[state=active]:flex">
          {/* Messages Area */}
          <ScrollArea className="flex-1 px-6">
            <div className="flex flex-col gap-6 py-4 pb-4">

              {/* Date Separator style */}
              <div className="flex justify-center mb-2">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm">
                  Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {formattedMessages.map((message) => (
                <div key={message.id} className={`flex flex-col gap-1 max-w-[85%] ${message.sender === 'user' ? 'items-end self-end' : 'items-start'}`}>
                  <div className={`${message.sender === 'user'
                    // User Bubble: Glass, Darker, White Text, Sharp TR corner
                    ? 'bg-white/5 backdrop-blur-md border border-white/10 text-white/90 rounded-[1.5rem] rounded-tr-sm p-4'
                    // AI Bubble: Bright Gradient, Dark Text, Sharp TL corner
                    : 'bg-gradient-to-br from-cyan-300/90 via-purple-400/80 to-white/95 text-slate-900 border border-white/40 shadow-lg shadow-purple-500/10 rounded-[1.5rem] rounded-tl-none p-5'
                    }`}>
                    <p className={`font-medium leading-relaxed text-[15px] whitespace-pre-wrap ${message.sender === 'user' ? 'font-light' : ''}`}>
                      {message.content}
                    </p>
                  </div>

                  {/* Labels */}
                  <span className={`text-[10px] font-bold text-white/30 tracking-wider uppercase ${message.sender === 'user' ? 'mr-1' : 'ml-1'}`}>
                    {message.sender === 'user' ? 'You' : 'FocusFlow AI'}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex flex-col items-start gap-1 max-w-[85%]">
                  <div className="bg-gradient-to-br from-cyan-300/90 via-purple-400/80 to-white/95 border border-white/40 shadow-lg shadow-purple-500/10 rounded-[1.5rem] rounded-tl-none p-5 relative">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-medium text-sm">Thinking</span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-slate-900/60 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-slate-900/60 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-slate-900/60 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area - 'input-glass-pill' style */}
          <div className="px-6 pb-6 pt-4 bg-gradient-to-t from-dark-bg via-dark-bg/90 to-transparent z-10 mt-auto">
            <div className="w-full h-[3.5rem] bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center p-1.5 gap-2 relative shadow-[0_0_30px_rgba(103,232,249,0.05)]">
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-all">
                <Plus className="w-5 h-5" />
              </Button>
              <input
                type="text"
                className="flex-1 bg-transparent border-none text-white text-sm placeholder:text-white/30 focus:ring-0 focus:outline-none p-0 font-light"
                placeholder="Type a message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="h-10 px-5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="material-symbols-outlined text-xl font-bold">arrow_upward</span>}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-auto px-6 py-4 data-[state=active]:block">
          {/* Reusing existing History logic but wrapping in simplified container if needed, keeping it clean */}
          <h2 className="text-lg font-semibold mb-4 text-white/90">History</h2>
          <div className="grid gap-3">
            {conversations.map((conversation) => (
              <div key={conversation.id} onClick={() => handleResumeChat(conversation.id)} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors cursor-pointer group relative">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-white/90 text-sm">{conversation.title || 'Conversation'}</h3>
                  <span className="text-[10px] text-white/40">{new Date(conversation.last_message_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-white/50">{conversation.message_count} messages</p>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8 text-white/20 hover:text-red-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={(e) => handleDeleteConversation(e, conversation.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="text-center py-10 text-white/30">
                <p>No history yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="flex-1 overflow-auto px-6 py-4 data-[state=active]:block">
          <h2 className="text-lg font-semibold mb-4 text-white/90">Insights</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white/90">Briefing</h3>
                  <p className="text-xs text-white/50">Daily Stats</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Total Chats</span>
                  <span className="font-mono text-white/90">{chatStats?.totalConversations || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Messages</span>
                  <span className="font-mono text-white/90">{chatStats?.totalMessages || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        {/* Navigation Tabs - Floating at bottom or integrate with Dashboard standard nav? 
            The design has a specific bottom nav. In the context of the Dashboard component, 
            navigation is handled by the Sidebar/Dashboard Layout. 
            So we should probably NOT include the bottom nav here to avoid duplication if it's already in Dashboard layout.
            However, we DO need the sub-tabs (Chat/History/Insights) switcher.
            Let's put the switcher in a visible place, maybe top right or bottom floating?
            The provided design code.html HAS a bottom nav, but it looks like the MAIN app nav.
            We need a way to switch between Chat/History within this component.
            Let's add a small switcher in the Header area or just keep the tabs logic but hidden triggers if we want a pure chat view?
            Actually, the user asked for "cosmetic changes only" ... "build on top".
            I will keep the Tabs functionality but maybe style the triggers differently or place them in the header.
        */}
        <div className="absolute top-20 right-6 z-20">
          <TabsList className="bg-black/20 backdrop-blur-md border border-white/5 rounded-full p-1 h-auto flex">
            <TabsTrigger value="chat" className="rounded-full text-xs py-1.5 px-4 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">Chat</TabsTrigger>
            <TabsTrigger value="history" className="rounded-full text-xs py-1.5 px-4 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">History</TabsTrigger>
            <TabsTrigger value="insights" className="rounded-full text-xs py-1.5 px-4 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">Insights</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}