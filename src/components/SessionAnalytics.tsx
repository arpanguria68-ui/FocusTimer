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
  const { data: allSessions = [], isLoading: sessionsLoading } = useSessions(100);
  const { data: todaySessions = [], isLoading: todayLoading } = useTodaySessions();
  const { data: sessionStats, isLoading: statsLoading } = useSessionStats();

  // Calculate analytics from real data
  const analytics = useMemo(() => {
    if (!allSessions.length) {
      return {
        todayStats: {
          completedSessions: 0,
          totalFocusTime: 0,
          longestStreak: 0,
          goalProgress: 0,
        },
        weeklyStats: {
          totalSessions: 0,
          totalFocusTime: 0,
          averageSessionLength: 25,
          productivity: 0,
        },
        weeklyData: [],
        achievements: [],
        sessionTypeData: [],
        signalRatio: { signal: 0, noise: 0, ratio: 0 }
      };
    }

    // Today's stats
    const todayFocusSessions = todaySessions.filter(s => s.session_type === 'focus' && s.completed);
    const todayFocusTime = todayFocusSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    const dailyGoal = 8; // 8 pomodoro sessions per day
    const goalProgress = Math.min((todayFocusSessions.length / dailyGoal) * 100, 100);

    // Weekly stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklySessions = allSessions.filter(s => new Date(s.created_at) >= weekAgo);
    const weeklyFocusSessions = weeklySessions.filter(s => s.session_type === 'focus' && s.completed);
    const weeklyFocusTime = weeklyFocusSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    const avgSessionLength = weeklyFocusSessions.length > 0
      ? weeklyFocusTime / weeklyFocusSessions.length
      : 25;

    // Calculate productivity (completed vs started sessions)
    const startedSessions = weeklySessions.length;
    const completedSessions = weeklySessions.filter(s => s.completed).length;
    const productivity = startedSessions > 0 ? (completedSessions / startedSessions) * 100 : 0;

    // Weekly data for chart
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en', { weekday: 'short' });

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const daySessions = allSessions.filter(s => {
        const sessionDate = new Date(s.created_at);
        return sessionDate >= dayStart && sessionDate <= dayEnd && s.completed && s.session_type === 'focus';
      });

      weeklyData.push({
        day: dayName,
        sessions: daySessions.length,
        minutes: daySessions.reduce((sum, s) => sum + s.duration_minutes, 0)
      });
    }

    // Session type distribution
    const focusSessions = allSessions.filter(s => s.session_type === 'focus' && s.completed).length;
    const shortBreaks = allSessions.filter(s => s.session_type === 'short_break' && s.completed).length;
    const longBreaks = allSessions.filter(s => s.session_type === 'long_break' && s.completed).length;

    const sessionTypeData = [
      { name: 'Focus', value: focusSessions, color: '#3b82f6' },
      { name: 'Short Break', value: shortBreaks, color: '#10b981' },
      { name: 'Long Break', value: longBreaks, color: '#f59e0b' }
    ];

    // Calculate streak
    const sortedSessions = [...allSessions]
      .filter(s => s.session_type === 'focus' && s.completed)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    let currentStreak = 0;
    let lastDate = null;

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.created_at);
      sessionDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        lastDate = sessionDate;
        currentStreak = 1;
      } else {
        const dayDiff = Math.floor((lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          currentStreak++;
          lastDate = sessionDate;
        } else if (dayDiff > 1) {
          break;
        }
      }
    }

    // Achievements based on real data
    const totalFocusSessions = allSessions.filter(s => s.session_type === 'focus' && s.completed).length;
    const totalFocusHours = allSessions
      .filter(s => s.session_type === 'focus' && s.completed)
      .reduce((sum, s) => sum + s.duration_minutes, 0) / 60;

    const achievements = [
      {
        id: 1,
        title: 'Focus Master',
        description: 'Complete 100 focus sessions',
        progress: Math.min(totalFocusSessions, 100),
        max: 100,
        icon: '🎯'
      },
      {
        id: 2,
        title: 'Consistency Champion',
        description: '7 days streak',
        progress: Math.min(currentStreak, 7),
        max: 7,
        icon: '🔥'
      },
      {
        id: 3,
        title: 'Deep Work Master',
        description: '50 hours total focus time',
        progress: Math.min(Math.floor(totalFocusHours), 50),
        max: 50,
        icon: '⏰'
      },
      {
        id: 4,
        title: 'Productivity Pro',
        description: '90% completion rate',
        progress: Math.min(Math.floor(productivity), 90),
        max: 90,
        icon: '📈'
      },
    ];

    return {
      todayStats: {
        completedSessions: todayFocusSessions.length,
        totalFocusTime: todayFocusTime,
        longestStreak: currentStreak,
        goalProgress: Math.round(goalProgress),
      },
      weeklyStats: {
        totalSessions: weeklyFocusSessions.length,
        totalFocusTime: weeklyFocusTime,
        averageSessionLength: Math.round(avgSessionLength),
        productivity: Math.round(productivity),
      },
      weeklyData,
      achievements,
      sessionTypeData: sessionTypeData.filter(d => d.value > 0),
      signalRatio: sessionStats?.signalToNoiseRatio || { signal: 0, noise: 0, ratio: 0 }
    };
  }, [allSessions, todaySessions, sessionStats]);

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
                  <p className="text-xs text-purple-200/40 mt-1">+2 from yesterday</p>
                </div>
              </div>
              {/* Decorative glow */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/30 transition-colors"></div>
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
                  <p className="text-xs text-blue-200/40 mt-1">Deep Work</p>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/30 transition-colors"></div>
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
                  <p className="text-xs text-orange-200/40 mt-1">Days active</p>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-600/30 transition-colors"></div>
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
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-green-600/30 transition-colors"></div>
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


          {/* Daily Goal Drop - Replaced/Merged with Goal Box above or kept as detailed view? 
                User said "focus only session analytics", "the tabs functionality should be as it is".
                The "Daily Goal Progress" was a separate card. I'll maintain it but style it.
            */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 border border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-md font-bold text-white">Daily Goal Progress</h3>
              </div>
              <span className="text-lg font-mono text-indigo-300">{todayStats.completedSessions}/8</span>
            </div>

            <Progress value={todayStats.goalProgress} className="h-3 bg-slate-800" indicatorClassName="bg-indigo-500" />
            <p className="text-xs text-slate-400 mt-4 text-center">
              {8 - todayStats.completedSessions > 0
                ? `${8 - todayStats.completedSessions} more sessions to reach your daily goal`
                : 'Daily goal achieved! 🎉'
              }
            </p>
          </div>
        </TabsContent>

        {/* Weekly Stats */}
        <TabsContent value="week" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStats.totalSessions}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Focus Hours</p>
                    <p className="text-2xl font-bold text-primary">{Math.round(weeklyStats.totalFocusTime / 60 * 10) / 10}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-primary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Length</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStats.averageSessionLength}m</p>
                  </div>
                  <PieChartIcon className="h-8 w-8 text-primary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="text-2xl font-bold text-green-500">{weeklyStats.productivity}%</p>
                  </div>
                  <Award className="h-8 w-8 text-green-500/60" />
                </div>
              </CardContent>
            </Card>
          </div>

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
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" />
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
                      dataKey="sessions"
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