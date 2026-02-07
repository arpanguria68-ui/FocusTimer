import React, { useState } from 'react';
import { FocusTimer } from './FocusTimer';
import { EnhancedQuotesDashboard } from './EnhancedQuotesDashboard';
import { SessionAnalytics } from './SessionAnalytics';
import { AiAssistant } from './AiAssistant';
import { UserProfile } from './UserProfile';
import { Settings } from './Settings';
import { DashboardAnalyticsGate, DashboardAIGate, DashboardAdvancedGate } from './DashboardFeatureGate';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useConvexQueries';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Timer,
  Quote,
  BarChart3,
  Bot,
  User,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut
} from 'lucide-react';

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('timer');
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open for better UX

  // Get user data and session statistics
  const { user, signOut } = useAuth();
  const { data: sessions = [] } = useSessions(200);

  // Calculate user level and stats
  const getUserStats = () => {
    const completedSessions = sessions.filter(s => s.completed && s.session_type === 'focus').length;
    const level = Math.floor(Math.sqrt(completedSessions / 10)) + 1; // Level based on completed sessions
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Focus Master';

    return {
      name: userName,
      level,
      sessions: completedSessions
    };
  };

  const userStats = getUserStats();

  const tabs = [
    { id: 'timer', label: 'Focus Timer', icon: Timer, component: FocusTimer },
    { id: 'quotes', label: 'Inspiration', icon: Quote, component: EnhancedQuotesDashboard },
    {
      id: 'analytics', label: 'Analytics', icon: BarChart3, component: () => (
        <DashboardAnalyticsGate><SessionAnalytics /></DashboardAnalyticsGate>
      )
    },
    {
      id: 'ai', label: 'AI Assistant', icon: Bot, component: () => (
        <DashboardAIGate><AiAssistant /></DashboardAIGate>
      )
    },
    { id: 'profile', label: 'Profile', icon: User, component: UserProfile },
    {
      id: 'settings', label: 'Settings', icon: SettingsIcon, component: () => (
        <DashboardAdvancedGate><Settings /></DashboardAdvancedGate>
      )
    },
  ];

  const activeTabConfig = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component || FocusTimer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border glass">
        <h1 className="text-xl font-semibold text-foreground">Focus Dashboard</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:static inset-y-0 left-0 z-50 w-64 
          glass border-r border-border/50 
          transition-transform duration-300 ease-in-out
          lg:transition-none
        `}>
          <div className="flex flex-col h-full p-4">
            {/* Logo/Brand */}
            <div className="hidden lg:block mb-8">
              <h1 className="text-2xl font-light text-foreground">
                Focus<span className="text-primary">Flow</span>
              </h1>
              <p className="text-sm text-muted-foreground">Productivity Reimagined</p>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex-1 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "timer" : "ghost"}
                    className="w-full justify-start h-12"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </nav>

            {/* Extension Download CTA */}
            <div className="px-4 py-2">
              <Button
                variant="outline"
                className="w-full justify-start text-xs border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all group"
                onClick={() => window.open('https://chrome.google.com/webstore/detail/your-extension-id', '_blank')}
              >
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                Get Extension
              </Button>
            </div>

            {/* User Info */}
            <div className="mt-auto pt-4 border-t border-border/50">
              <div className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate" title={userStats.name}>
                    {user ? userStats.name : 'Guest User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user
                      ? `Level ${userStats.level} • ${userStats.sessions} sessions`
                      : 'Login to track progress'
                    }
                  </p>
                </div>
                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={signOut}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <main className="h-screen overflow-auto">
            <div className="p-4 lg:p-8">
              {/* Page Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-light text-foreground">
                      {activeTabConfig?.label}
                    </h2>
                    <p className="text-muted-foreground">
                      {getTabDescription(activeTab)}
                    </p>
                  </div>
                  <div className="lg:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <Menu className="h-4 w-4 mr-2" />
                      Menu
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="transition-all duration-300 ease-in-out">
                <ActiveComponent />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function getTabDescription(tabId: string): string {
  const descriptions = {
    timer: 'Stay focused with the Pomodoro Technique and track your productivity',
    quotes: 'Get inspired with AI-generated quotes and build your motivation library',
    analytics: 'Analyze your productivity patterns and celebrate your achievements',
    ai: 'Chat with your AI productivity coach for personalized advice',
    profile: 'Track your progress and customize your focus journey',
    settings: 'Personalize your focus experience and manage preferences',
  };
  return descriptions[tabId as keyof typeof descriptions] || '';
}