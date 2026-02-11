import React, { useState, useEffect } from 'react';
import { useOfflineTimerState } from '@/hooks/useOfflineTimerState';
import { useTaskState } from '@/hooks/useTaskState';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useSmilePopupSettings } from '@/hooks/useChromeStorage';
import SmilePopup from '@/components/SmilePopup';
import { useToast } from '@/hooks/use-toast';

export function GlassTimer() {
    const {
        currentTime,
        isRunning,
        sessionType,
        currentSession,
        totalSessions,
        startTimer,
        pauseTimer,
        resetTimer,
        switchSessionType,
        taskId,
        category,
        isLoading
    } = useOfflineTimerState();

    const { activeTasks } = useTaskState();
    const { user, getToken } = useAuth();
    const { toast } = useToast();
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [showSmilePopup, setShowSmilePopup] = useState(false);

    // Get smile popup settings
    const { value: smilePopupSettings } = useSmilePopupSettings();

    const [timerSettings, setTimerSettings] = useState({
        focusTime: 25,
        breakTime: 5,
        longBreakTime: 15
    });

    useEffect(() => {
        const saved = localStorage.getItem('timer_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setTimerSettings({
                    focusTime: parsed.focusTime || 25,
                    breakTime: parsed.breakTime || 5,
                    longBreakTime: parsed.longBreakTime || 15
                });
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
    }, []);

    const openExternalSmilePopup = () => {
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const params = new URLSearchParams({
            sessionType,
            sessionCount: totalSessions.toString(),
        });

        // Add task info if available
        if (taskId) {
            const task = activeTasks.find(t => t.id === taskId);
            if (task) {
                params.append('taskTitle', task.title);
                params.append('category', task.category);
            }
        } else if (category) {
            params.append('category', category);
        }

        if (typeof chrome !== 'undefined' && chrome.windows) {
            const url = chrome.runtime.getURL(`smile-popup.html?${params.toString()}`);
            chrome.windows.create({
                url,
                type: 'popup',
                width,
                height,
                left: Math.round(left),
                top: Math.round(top),
                focused: true,
            });
        } else {
            // For web/development, use internal popup mostly, but can simulate external
            setShowSmilePopup(true);
        }
    };

    const handleStartBreak = () => {
        toast({
            title: "🎉 Focus session completed!",
            description: `Great work! Time for a ${sessionType === 'long_break' ? 'long' : 'short'} break.`,
        });
    };

    const handleSkipBreak = () => {
        switchSessionType('focus');
        toast({
            title: "🔥 Break skipped!",
            description: "Ready to focus again? Let's get productive!",
        });
    };

    // Handle timer completion
    useEffect(() => {
        if (currentTime === 0 && !isRunning) {
            if (smilePopupSettings.enabled && smilePopupSettings.showAsExternalWindow) {
                openExternalSmilePopup();
            } else {
                setShowSmilePopup(true);
            }

            if (sessionType === 'focus') {
                handleStartBreak();
            }
        }
    }, [currentTime, isRunning, sessionType]);

    const saveSettings = () => {
        localStorage.setItem('timer_settings', JSON.stringify(timerSettings));
        setShowSettings(false);
        // Force reload/update logic if needed, or rely on timer reset
        window.dispatchEvent(new CustomEvent('timerSettingsChanged', { detail: timerSettings }));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return {
            mins: mins.toString().padStart(2, '0'),
            secs: secs.toString().padStart(2, '0')
        };
    };

    const { mins, secs } = formatTime(currentTime);

    const handleToggleTimer = () => {
        if (isRunning) {
            pauseTimer();
        } else {
            if (activeTask) {
                startTimer(activeTask.id, activeTask.category);
            } else {
                startTimer();
            }
        }
    };

    const activeTask = activeTasks.length > 0 ? activeTasks[currentTaskIndex] : null;

    const handleNextTask = () => {
        if (activeTasks.length > 0) {
            setCurrentTaskIndex((prev) => (prev + 1) % activeTasks.length);
        }
    };

    const openDashboard = (path: string = '') => {
        // For Chrome extension
        if (typeof window !== 'undefined' && (window as any).chrome?.tabs) {
            const url = (window as any).chrome.runtime.getURL(`dashboard.html#${path}`);
            (window as any).chrome.tabs.create({ url });
        } else {
            // For web development
            window.location.href = `/dashboard#${path}`;
        }
    };

    return (
        <div className="bg-dark-bg text-slate-100 h-full w-full flex flex-col overflow-hidden font-sans relative">
            {/* Noise Filter SVG */}
            <svg className="hidden">
                <filter id="noiseFilter">
                    <feTurbulence baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" type="fractalNoise"></feTurbulence>
                </filter>
            </svg>

            <div className="ios-status-bar"></div>

            {/* Header */}
            <header className="px-8 py-6 flex justify-between items-center z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-primary flex items-center justify-center shadow-lg shadow-cyan-900/20">
                        <span className="material-symbols-outlined text-white text-xl !font-bold">timer</span>
                    </div>
                    <span className="font-semibold text-xl tracking-tight text-white/90">FocusFlow</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openDashboard('/dashboard')}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        title="Dashboard"
                    >
                        <span className="material-symbols-outlined text-white/70">grid_view</span>
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-white/70">settings</span>
                    </button>
                </div>
            </header>

            {/* Settings Modal Overlay */}
            {showSettings && (
                <div className="absolute inset-0 z-50 bg-dark-bg/90 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="w-full max-w-sm bg-[#161920] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-white">Timer Settings</h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Focus Duration (min)</label>
                                <input
                                    type="number"
                                    value={timerSettings.focusTime}
                                    onChange={(e) => setTimerSettings({ ...timerSettings, focusTime: parseInt(e.target.value) || 25 })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Break Duration (min)</label>
                                <input
                                    type="number"
                                    value={timerSettings.breakTime}
                                    onChange={(e) => setTimerSettings({ ...timerSettings, breakTime: parseInt(e.target.value) || 5 })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Long Break (min)</label>
                                <input
                                    type="number"
                                    value={timerSettings.longBreakTime}
                                    onChange={(e) => setTimerSettings({ ...timerSettings, longBreakTime: parseInt(e.target.value) || 15 })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
                                />
                            </div>

                            <button
                                onClick={saveSettings}
                                className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
                {/* Background Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -z-10"></div>
                <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10"></div>

                {/* Glass Timer Card with Circular Progress */}
                <div className="glass-timer-card w-full max-w-sm aspect-square rounded-[3rem] flex flex-col items-center justify-center shadow-2xl relative z-10 glow-subtle border border-white/40">
                    {/* Circular Progress SVG */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-[85%] h-[85%] -rotate-90 transform" viewBox="0 0 100 100">
                            {/* Defs for Gradients */}
                            <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan-400 */}
                                    <stop offset="100%" stopColor="#a855f7" /> {/* Purple-500 */}
                                </linearGradient>
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Background Track */}
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.05)"
                                strokeWidth="3"
                            />

                            {/* Progress Indicator */}
                            {(() => {
                                const totalSeconds =
                                    sessionType === 'focus' ? timerSettings.focusTime * 60 :
                                        sessionType === 'short_break' ? timerSettings.breakTime * 60 :
                                            timerSettings.longBreakTime * 60;

                                const progress = totalSeconds > 0 ? ((totalSeconds - currentTime) / totalSeconds) * 100 : 0;
                                const radius = 45;
                                const circumference = 2 * Math.PI * radius;
                                const dashoffset = circumference - (progress / 100) * circumference;

                                return (
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        fill="none"
                                        stroke="url(#progressGradient)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={dashoffset}
                                        className="transition-all duration-1000 ease-linear"
                                        filter="url(#glow)"
                                    />
                                );
                            })()}
                        </svg>
                    </div>

                    <div className="text-center z-10 flex flex-col items-center">
                        <span className="text-black/40 text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
                            {sessionType === 'focus' ? 'Focus Phase' : sessionType === 'short_break' ? 'Short Break' : 'Long Break'}
                        </span>
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-8xl digital-font text-white drop-shadow-sm font-bold">{mins}</span>
                            <span className="text-8xl digital-font text-white/40 drop-shadow-sm font-bold">{secs}</span>
                        </div>
                        <div className="mt-6 px-4 py-1.5 rounded-full bg-white/30 backdrop-blur-sm border border-white/20 flex items-center gap-2">
                            <span className="material-symbols-outlined text-black/60 text-sm">auto_awesome</span>
                            <span className="text-black/60 text-[10px] font-bold uppercase tracking-widest">
                                {sessionType === 'focus' ? 'Deep Work' : 'Recharge'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Task Control Card */}
                <div className="w-full max-w-sm mt-12 bg-white/5 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/10 flex items-center justify-between">
                    <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Current Goal</span>
                        <h3 className="text-lg font-medium text-white/90 truncate max-w-[150px]">
                            {activeTask ? activeTask.title : "No Active Task"}
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleNextTask}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">skip_next</span>
                        </button>
                        <button
                            onClick={handleToggleTimer}
                            disabled={isLoading}
                            className={`w-14 h-14 rounded-[1.25rem] bg-white text-dark-bg flex items-center justify-center shadow-lg shadow-white/5 active:scale-95 transition-transform ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined !fill-current text-3xl">
                                    {isRunning ? 'pause' : 'play_arrow'}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8 w-full max-w-sm justify-between">
                    <button
                        onClick={resetTimer}
                        className="flex-1 px-8 py-4 rounded-2xl bg-white/5 text-white/50 border border-white/5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">refresh</span> Reset
                    </button>
                    <button
                        className="flex-1 px-8 py-4 rounded-2xl bg-white/5 text-white/50 border border-white/5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                        onClick={() => openDashboard('/tasks')}
                    >
                        <span className="material-symbols-outlined text-xl">list_alt</span> Tasks
                    </button>
                </div>

                {/* Debug Button */}
                <div className="mt-4 w-full max-w-sm flex justify-center">
                    <button
                        onClick={async () => {
                            try {
                                console.log("Debug: Fetching convex token...");
                                const token = await getToken({ template: 'convex' });
                                console.log("Debug: Token fetched:", token);
                                if (!token) {
                                    console.error("Debug: Token is empty!");
                                }
                            } catch (e) {
                                console.error("Debug: Token fetch failed", e);
                            }
                        }}
                        className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors"
                    >
                        Debug Token
                    </button>
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="px-8 pt-4 pb-10 bg-dark-bg/80 backdrop-blur-xl border-t border-white/5 flex justify-between items-center z-20 mt-auto">
                <button className="flex flex-col items-center gap-1.5 text-secondary">
                    <span className="material-symbols-outlined !fill-current text-2xl">timer</span>
                    <span className="text-[10px] font-semibold tracking-wide">Timer</span>
                </button>
                <button
                    onClick={() => openDashboard('/quotes')}
                    className="flex flex-col items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">format_quote</span>
                    <span className="text-[10px] font-semibold tracking-wide">Quotes</span>
                </button>
                <button
                    onClick={() => openDashboard('/stats')}
                    className="flex flex-col items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">bar_chart</span>
                    <span className="text-[10px] font-semibold tracking-wide">Stats</span>
                </button>
                <button
                    onClick={() => openDashboard('/coach')} // Or whatever the route is
                    className="flex flex-col items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">memory</span>
                    <span className="text-[10px] font-semibold tracking-wide">Coach</span>
                </button>
                <button
                    onClick={() => openDashboard('/profile')}
                    className="flex flex-col items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">account_circle</span>
                    <span className="text-[10px] font-semibold tracking-wide">Me</span>
                </button>
            </nav>
            <div className="flex justify-center pb-2 bg-dark-bg absolute bottom-0 w-full z-30">
                <div className="w-32 h-1 bg-white/10 rounded-full"></div>
            </div>
            {/* Smile Popup */}
            <SmilePopup
                isOpen={showSmilePopup}
                onClose={() => setShowSmilePopup(false)}
                onSkipBreak={handleSkipBreak}
                onStartBreak={handleStartBreak}
                sessionType={sessionType}
                sessionCount={totalSessions}
                customImage={smilePopupSettings.customImage}
                taskTitle={taskId ? activeTasks.find(t => t.id === taskId)?.title : undefined}
                category={category || undefined}
            />
        </div>
    );
}
