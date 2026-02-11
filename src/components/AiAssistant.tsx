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
  X,
  ChevronDown
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
import { AGENT_PERSONAS, AgentPersona, DEFAULT_AGENT } from '@/lib/agents';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const [selectedAgent, setSelectedAgent] = useState<AgentPersona>(DEFAULT_AGENT);

  const { settings: geminiSettings } = useGeminiSettings();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Data fetching hooks
  const { data: activeConversation, isLoading: conversationLoading } = useActiveConversation();
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(currentConversationId || undefined);
  const { data: conversations = [] } = useChatConversations();
  const { data: chatStats } = useChatStats();

  // Mutation hooks
  const addMessage = useAddChatMessage();
  const createConversation = useCreateConversation();
  const archiveConversation = useArchiveConversation();
  const deleteConversation = useDeleteConversation();

  // Initialize current conversation and sync agent mode
  useEffect(() => {
    if (activeConversation && !currentConversationId) {
      setCurrentConversationId(activeConversation._id);
    }

    // If active conversation has a stored agent mode, switch to it
    if (activeConversation && activeConversation.agent_mode) {
      const storedAgent = AGENT_PERSONAS[activeConversation.agent_mode];
      if (storedAgent) {
        setSelectedAgent(storedAgent);
      }
    }
  }, [activeConversation, currentConversationId]);

  // Convert database messages to component format
  const formattedMessages: Message[] = messages.map(msg => ({
    id: msg._id,
    content: msg.content,
    sender: msg.sender as 'user' | 'ai',
    timestamp: new Date(msg.created_at),
    type: msg.message_type as 'suggestion' | 'tip' | 'encouragement'
  }));

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [formattedMessages, activeTab]);

  useEffect(() => {
    // Check if we need to send a welcome message for a NEW conversation that is empty
    if (currentConversationId && messages.length === 0 && !messagesLoading && activeConversation?._id === currentConversationId) {
      // Logic for welcome message could be here, but let's rely on user starting usually.
      // Or if we want the agent to start:
      /*
      const welcomeMessage = {
        conversation_id: currentConversationId,
        user_id: user!.id, // User ID from auth is .id usually (Clerk)
        content: `Hello! I'm ${selectedAgent.name}. ${selectedAgent.systemPrompt.split('.')[1]}. How can I help you today?`,
        sender: 'ai' as const,
        message_type: 'encouragement' as const,
      };
      addMessage.mutate(welcomeMessage); 
      */
    }
  }, [currentConversationId, messages.length, messagesLoading, activeConversation, selectedAgent]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    if (!geminiSettings.isConfigured) {
      toast.error('Please set your Gemini API key and select a model in Settings first.');
      return;
    }

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    const startTime = Date.now();
    let effectiveConversationId = currentConversationId;

    try {
      // Auto-create conversation if none exists
      if (!effectiveConversationId) {
        const newConv = await createConversation.mutateAsync({
          title: `${selectedAgent.name} Chat`,
          agent_mode: selectedAgent.id // Agent ID is local string, not convex ID
        });
        effectiveConversationId = newConv._id;
        setCurrentConversationId(newConv._id);
      }

      await addMessage.mutateAsync({
        conversation_id: effectiveConversationId,
        user_id: user.id, // Clerk user ID
        content: messageContent,
        sender: 'user',
        message_type: 'text',
      });

      // Construct the prompt with the Agent's Persona
      const prompt = `${selectedAgent.systemPrompt}\n\nUser: ${messageContent}`;

      const aiResponseContent = await generateGeminiResponse(
        geminiSettings.apiKey!,
        prompt,
        geminiSettings.model!
      );

      const responseTime = Date.now() - startTime;
      const messageType = determineMessageType(aiResponseContent);

      await addMessage.mutateAsync({
        conversation_id: effectiveConversationId,
        user_id: user.id,
        content: aiResponseContent,
        sender: 'ai',
        message_type: messageType,
        response_time_ms: responseTime,
        tokens_used: Math.ceil(aiResponseContent.length / 4),
      });

    } catch (error: any) {
      console.error('Error generating Gemini response:', error);

      // Improve error message for user
      let errorMessage = 'Failed to generate AI response.';
      if (error.message?.includes('API Key')) errorMessage = 'Invalid Gemini API Key.';
      if (error.message?.includes('400')) errorMessage = 'Bad Request to AI Model.';
      if (error.message?.includes('429')) errorMessage = 'Rate limit exceeded.';

      toast.error(errorMessage);

      if (effectiveConversationId) {
        await addMessage.mutateAsync({
          conversation_id: effectiveConversationId,
          user_id: user.id,
          content: `Error: ${errorMessage}. Please check your settings.`,
          sender: 'ai',
          message_type: 'encouragement',
          response_time_ms: Date.now() - startTime,
        });
      }
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

  const handleNewConversation = async (agentId?: string) => {
    try {
      const agent = agentId ? AGENT_PERSONAS[agentId] : selectedAgent;
      if (agentId) setSelectedAgent(agent);

      const newConv = await createConversation.mutateAsync({
        title: `${agent.name} Chat`,
        agent_mode: agent.id
      });

      setCurrentConversationId(newConv._id);
      setActiveTab('chat');
      toast.success(`Started new chat with ${agent.name}`);
    } catch (error: any) {
      console.error('Failed to create new conversation:', error);
      toast.error(`Failed to create new conversation: ${error.message || 'Unknown error'}`);
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
    setActiveTab('chat');
  }

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Prevent triggering resume
    if (window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      try {
        await deleteConversation.mutateAsync(conversationId);
        if (currentConversationId === conversationId) {
          // Fix logic for resetting conversation
          setCurrentConversationId(null);
        }
        toast.success('Conversation deleted');
      } catch (error) {
        toast.error('Failed to delete conversation');
      }
    }
  }

  const AgentIcon = selectedAgent.icon;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full relative font-sans selection:bg-cyan-500/30">
      {/* Background Glows matching design */}
      <div className={`absolute top-10 left-0 w-[500px] h-[500px] rounded-full blur-[120px] -z-10 pointer-events-none opacity-20 bg-gradient-to-r ${selectedAgent.gradient}`}></div>
      <div className="absolute bottom-20 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Header - Agent Selector */}
      <div className="px-6 py-4 flex items-center justify-between z-10 border-b border-white/5 bg-black/20 backdrop-blur-sm sticky top-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedAgent.gradient} flex items-center justify-center text-white shadow-lg`}>
            <AgentIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 -ml-2 transition-colors outline-none group">
                  <span className="font-semibold text-lg tracking-tight text-white/90 group-hover:text-white transition-colors">{selectedAgent.name}</span>
                  <ChevronDown className="w-4 h-4 text-white/50 group-hover:text-white/80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white p-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Select Agent</div>
                {Object.values(AGENT_PERSONAS).map((agent) => (
                  <DropdownMenuItem
                    key={agent.id}
                    onClick={() => handleNewConversation(agent.id)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-white shadow-sm`}>
                      <agent.icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{agent.name}</span>
                      <span className="text-[10px] text-white/50">{agent.philosophy}</span>
                    </div>
                    {selectedAgent.id === agent.id && <Check className="w-4 h-4 ml-auto text-cyan-400" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className={`text-[10px] font-medium tracking-wider uppercase flex items-center gap-1 ${selectedAgent.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse bg-current`}></span>
              {selectedAgent.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/5" onClick={() => handleNewConversation()}>
            <Plus className="w-5 h-5" />
          </Button>
          <TabsList className="bg-black/20 backdrop-blur-md border border-white/5 rounded-full p-1 h-8 flex ml-2">
            <TabsTrigger value="chat" className="rounded-full text-[10px] h-6 px-3 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50" onClick={() => setActiveTab('chat')}>Chat</TabsTrigger>
            <TabsTrigger value="history" className="rounded-full text-[10px] h-6 px-3 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50" onClick={() => setActiveTab('history')}>History</TabsTrigger>
          </TabsList>
        </div>
      </div>

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
                  // User Bubble: Glass, Darker, White Text
                  ? 'bg-white/5 backdrop-blur-md border border-white/10 text-white/90 rounded-[1.5rem] rounded-tr-sm p-4'
                  // AI Bubble: Dynamic Gradient based on Agent
                  : `bg-gradient-to-br ${selectedAgent.gradient} text-white border border-white/20 shadow-lg shadow-purple-500/10 rounded-[1.5rem] rounded-tl-none p-5`
                  }`}>
                  <p className={`font-medium leading-relaxed text-[15px] whitespace-pre-wrap ${message.sender === 'user' ? 'font-light' : ''}`}>
                    {message.content}
                  </p>
                </div>

                {/* Labels */}
                <span className={`text-[10px] font-bold text-white/30 tracking-wider uppercase ${message.sender === 'user' ? 'mr-1' : 'ml-1'}`}>
                  {message.sender === 'user' ? 'You' : selectedAgent.name}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex flex-col items-start gap-1 max-w-[85%]">
                <div className={`bg-gradient-to-br ${selectedAgent.gradient} border border-white/20 shadow-lg rounded-[1.5rem] rounded-tl-none p-5 relative opacity-80`}>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">Thinking</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="px-6 pb-6 pt-4 bg-gradient-to-t from-dark-bg via-dark-bg/90 to-transparent z-10 mt-auto">
          <div className="w-full h-[3.5rem] bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center p-1.5 gap-2 relative shadow-[0_0_30px_rgba(103,232,249,0.05)]">
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-all">
              <Plus className="w-5 h-5" />
            </Button>
            <input
              type="text"
              className="flex-1 bg-transparent border-none text-white text-sm placeholder:text-white/30 focus:ring-0 focus:outline-none p-0 font-light"
              placeholder={`Message ${selectedAgent.name}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className={`h-10 px-5 rounded-full bg-gradient-to-r ${selectedAgent.gradient} text-white shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="material-symbols-outlined text-xl font-bold">arrow_upward</span>}
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="history" className="flex-1 overflow-auto px-6 py-4 data-[state=active]:block">
        {/* History content same as before, simplified */}
        <div className="grid gap-3">

          {conversations.map((conversation: any) => (
            <div key={conversation._id} onClick={() => handleResumeChat(conversation._id)} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors cursor-pointer group relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-white/90 text-sm truncate max-w-[70%]">{conversation.title || 'Conversation'}</h3>
                {/* Accessing agent icon via lookup if possible, or generic */}
                {conversation.agent_mode && AGENT_PERSONAS[conversation.agent_mode] && (
                  <Badge variant="outline" className="text-[10px] h-5 border-white/10 text-white/60">
                    {AGENT_PERSONAS[conversation.agent_mode].name}
                  </Badge>
                )}
              </div>
              <div className="flex justify-between items-end">
                <p className="text-xs text-white/50">{new Date(conversation.last_message_at || conversation.updated_at).toLocaleDateString()}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white/20 hover:text-red-400 -mr-2"
                  onClick={(e) => handleDeleteConversation(e, conversation._id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center py-10 text-white/30">
              <p>No history yet.</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}