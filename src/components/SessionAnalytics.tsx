import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Clock,
  Target,
  Award,
  Flame,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Calendar,
  User,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSessions, useSessionStats, useTodaySessions } from '@/hooks/useConvexQueries';

export function SessionAnalytics() {
  const { user } = useAuth();

  // Get data from database
  // useSessions(100) fetches raw rows for client-side flexibility
  const { data: allSessions = [], isLoading: sessionsLoading } = useSessions(100);
  const { data: todaySessions = [], isLoading: todayLoading } = useTodaySessions();
  // useSessionStats now returns the server-aggregated "Overall Analytics"
  const { data: serverStats, isLoading: statsLoading } = useSessionStats();

  // Calculate analytics
  const analytics = useMemo(() => {
    // Default fallback values
    const defaults = {
      todayStats: { completedSessions: 0, totalFocusTime: 0, longestStreak: 0, goalProgress: 0 },
      weeklyStats: { totalSessions: 0, totalFocusTime: 0, averageSessionLength: 25, productivity: 0 },
      weeklyData: [],
      achievements: [],
      sessionTypeData: [],
      signalRatio: { signal: 0, noise: 0, ratio: 0 }
    };

    if (!serverStats && !allSessions.length) return defaults;

    // --- 1. Today's Stats (Client Side - Instant) ---
    const todayFocusSessions = todaySessions.filter(s => s.session_type === 'focus' && s.completed);
    const todayFocusTime = todayFocusSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    const dailyGoal = 8;
    const goalProgress = Math.min((todayFocusSessions.length / dailyGoal) * 100, 100);

    // --- 2. Overall/Weekly Stats (Server Side - Accurate) ---
    // If server stats available, use them for the "Big Numbers"
    const totalFocusTime = serverStats?.summary?.totalFocusMinutes || 0;
    const completedSessionsCount = serverStats?.summary?.completedSessions || 0;
    const currentStreak = serverStats?.summary?.currentStreak || 0;
    
    // --- 3. Weekly Chart Data (Hybrid) ---
    // We can use serverStats.charts.weeklyActivity (array of 7 ints) if we map it to days
    // Or we can calculate from allSessions if we want "last 7 days" rolling window
    // Let's use allSessions for the rolling window chart as it's more standard for "Trends"
    const weeklyData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    if (serverStats?.charts?.weeklyActivity) {
      // Use Server Data (Sun-Sat)
      serverStats.charts.weeklyActivity.forEach((minutes: number, index: number) => {
        weeklyData.push({
          day: days[index],
          minutes: minutes,
          sessions: 0 // Server doesn't send session count per day yet, just minutes
        });
      });
    } else {
      // Fallback to client calc
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('en', { weekday: 'short' });
        const dayStart = new Date(date.setHours(0,0,0,0));
        const dayEnd = new Date(date.setHours(23,59,59,999));
        
        const daySessions = allSessions.filter(s => {
          const d = new Date(s.created_at);
          return d >= dayStart && d <= dayEnd && s.completed && s.session_type === 'focus';
        });
        
        weeklyData.push({
          day: dayName,
          sessions: daySessions.length,
          minutes: daySessions.reduce((sum, s) => sum + s.duration_minutes, 0)
        });
      }
    }

    // --- 4. Session Type Distribution ---
    // Calculate from allSessions (client side is fine for 100 items)
    const focusSessions = allSessions.filter(s => s.session_type === 'focus' && s.completed).length;
    const shortBreaks = allSessions.filter(s => s.session_type === 'short_break' && s.completed).length;
    const longBreaks = allSessions.filter(s => s.session_type === 'long_break' && s.completed).length;
    const sessionTypeData = [
      { name: 'Focus', value: focusSessions, color: '#3b82f6' },
      { name: 'Short Break', value: shortBreaks, color: '#10b981' },
      { name: 'Long Break', value: longBreaks, color: '#f59e0b' }
    ].filter(d => d.value > 0);


    // --- 5. Achievements (Server + Client) ---
    const achievements = [
      {
        id: 1,
        title: 'Focus Master',
        description: 'Complete 100 focus sessions',
        progress: Math.min(completedSessionsCount, 100), // Use Server Count
        max: 100,
        icon: '🎯'
      },
      {
        id: 2,
        title: 'Consistency Champion',
        description: '7 days streak',
        progress: Math.min(currentStreak, 7), // Use Server Streak
        max: 7,
        icon: '🔥'
      },
      {
        id: 3,
        title: 'Deep Work Master',
        description: '50 hours total focus time',
        progress: Math.min(Math.floor(totalFocusTime / 60), 50), // Use Server Time
        max: 50,
        icon: '⏰'
      }
    ];

    return {
      todayStats: {
        completedSessions: todayFocusSessions.length,
        totalFocusTime: todayFocusTime,
        longestStreak: currentStreak, // Server Source
        goalProgress: Math.round(goalProgress),
      },
      weeklyStats: {
        totalSessions: completedSessionsCount, // Show Lifetime count? Or calc weekly? Let's use Weekly from client calc for this specific card
        totalFocusTime: totalFocusTime, // Lifetime
        averageSessionLength: 25, // Placeholder or calc
        productivity: 0,
      },
      weeklyData,
      achievements,
      sessionTypeData,
      signalRatio: { signal: 80, noise: 20, ratio: 0.8 } // Mock or Server derived
    };
  }, [allSessions, todaySessions, serverStats]);

  // Loading state
  if (sessionsLoading || todayLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Login Required</h3>
        <p className="text-muted-foreground">
          Please log in to view your session analytics and track your progress.
        </p>
      </div>
    );
  }

  const { todayStats, weeklyStats, weeklyData, achievements, sessionTypeData, signalRatio } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Session Analytics</h2>
        <Badge variant="outline" className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Live Data
        </Badge>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Today's Stats */}
        <TabsContent value="today" className="space-y-4">
          {/* Box Design Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Sessions Box - Purple Theme */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a2a40] to-[#1a1a2e] p-6 border border-white/5 shadow-xl group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-50">
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <div className="flex flex-col h-full justify-between mt-2">
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-purple-300/60 uppercase mb-1">Sessions</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{todayStats.completedSessions}</span>
                  </div>
                  <p className="text-xs text-purple-200/40 mt-1">Today</p>
                </div>
              </div>
            </div>

            {/* Focus Time Box - Blue Theme */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a2a40] to-[#1a1a2e] p-6 border border-white/5 shadow-xl group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-50">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
              </div>
              <div className="flex flex-col h-full justify-between mt-2">
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-blue-300/60 uppercase mb-1">Focus Time</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{Math.floor(todayStats.totalFocusTime / 60)}</span>
                    <span className="text-lg text-white/60">h</span>
                    <span className="text-4xl font-bold text-white ml-2">{todayStats.totalFocusTime % 60}</span>
                    <span className="text-lg text-white/60">m</span>
                  </div>
                  <p className="text-xs text-blue-200/40 mt-1">Today</p>
                </div>
              </div>
            </div>

            {/* Streak Box - Orange Theme */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a2a40] to-[#1a1a2e] p-6 border border-white/5 shadow-xl group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-50">
                <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-orange-400" />
                </div>
              </div>
              <div className="flex flex-col h-full justify-between mt-2">
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-orange-300/60 uppercase mb-1">Streak</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{todayStats.longestStreak}</span>
                  </div>
                  <p className="text-xs text-orange-200/40 mt-1">Current Streak</p>
                </div>
              </div>
            </div>

            {/* Goal Box - Green Theme */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a2a40] to-[#1a1a2e] p-6 border border-white/5 shadow-xl group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-50">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Award className="h-5 w-5 text-green-400" />
                </div>
              </div>
              <div className="flex flex-col h-full justify-between mt-2">
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-green-300/60 uppercase mb-1">Goal</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{todayStats.goalProgress}%</span>
                  </div>
                  <p className="text-xs text-green-200/40 mt-1">Daily completion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Signal vs Noise Ratio - Custom Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 border border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Signal Ratio</h3>
                  <p className="text-sm text-slate-400">Signal vs Noise Work Distribution</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-4xl font-bold text-white">{Math.round(signalRatio.ratio * 100)}%</span>
                <p className="text-xs text-cyan-400 font-medium tracking-wider uppercase mt-1">Signal Work</p>
              </div>
            </div>

            <div className="relative h-4 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-1000"
                style={{ width: `${Math.round(signalRatio.ratio * 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-xs font-medium text-slate-500 uppercase tracking-widest">
              <span>0%</span>
              <span className="text-cyan-500/60">Target: 80%</span>
              <span>100%</span>
            </div>
          </div>
        </TabsContent>

        {/* Weekly Stats */}
        <TabsContent value="week" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="minutes" name="Focus Minutes" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Session Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessionTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={sessionTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {sessionTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    No session data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Daily Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      name="Focus Minutes"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                    <Badge variant={achievement.progress >= achievement.max ? "default" : "secondary"}>
                      {achievement.progress}/{achievement.max}
                    </Badge>
                  </div>
                  <Progress
                    value={(achievement.progress / achievement.max) * 100}
                    className="h-2"
                  />
                  {achievement.progress >= achievement.max && (
                    <p className="text-xs text-green-600 mt-1 font-medium">🎉 Achievement Unlocked!</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
