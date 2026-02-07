import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    Camera, Mail, MapPin, Calendar, Globe, Linkedin, Twitter, Edit, Save,
    Loader2, LogOut, CheckCircle, Target, Clock, Flame, Star, TrendingUp, Trophy, Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateUserProfile } from '@/hooks/useConvexQueries';

interface UserOverviewProps {
    profile: any;
    statistics: any;
    preferences: any;
    achievements: any;
}

export function UserOverview({ profile, statistics, preferences, achievements }: UserOverviewProps) {
    const { user, signOut } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: '',
        bio: '',
        location: '',
        website: '',
        linkedin_url: '',
        twitter_handle: '',
        phone: '',
    });

    const updateProfile = useUpdateUserProfile();

    React.useEffect(() => {
        if (profile) {
            setEditForm({
                full_name: profile.full_name || '',
                bio: profile.bio || '',
                location: profile.location || '',
                website: profile.website || '',
                linkedin_url: profile.linkedin_url || '',
                twitter_handle: profile.twitter_handle || '',
                phone: profile.phone || '',
            });
        }
    }, [profile]);

    const handleSaveProfile = async () => {
        try {
            await updateProfile.mutateAsync(editForm);
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error('Failed to update profile');
        }
    };

    const calculateNextLevelXP = (currentLevel: number) => {
        return Math.pow(currentLevel, 2) * 100;
    };

    const getProfileCompletionTasks = () => {
        if (!profile) return [];

        return [
            { field: 'full_name', label: 'Add your name', completed: !!profile.full_name },
            { field: 'bio', label: 'Write a bio', completed: !!profile.bio },
            { field: 'location', label: 'Add your location', completed: !!profile.location },
            { field: 'avatar_url', label: 'Upload profile picture', completed: !!profile.avatar_url },
            { field: 'website', label: 'Add website', completed: !!profile.website },
        ];
    };

    return (
        <div className="space-y-6">
            {/* Profile Header Box */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 border border-white/5 shadow-xl">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                    <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-[#2a2a40] shadow-2xl">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || user?.email?.[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#2a2a40] border border-white/10 hover:bg-[#3a3a50] transition-colors"
                        >
                            <Camera className="h-4 w-4 text-white" />
                        </Button>
                    </div>

                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-3xl font-bold text-white tracking-tight">
                                {profile?.full_name || 'Anonymous User'}
                            </h2>
                            <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1">
                                Level {statistics?.current_level || 1}
                            </Badge>
                            {profile?.profile_completion_score === 100 && (
                                <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                </Badge>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <Mail className="h-4 w-4 text-slate-500" />
                                {user?.email}
                            </div>
                            {profile?.location && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-slate-500" />
                                    {profile.location}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                Joined {new Date(profile?.created_at || '').toLocaleDateString()}
                            </div>
                        </div>

                        {profile?.bio && (
                            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">{profile.bio}</p>
                        )}

                        {/* Social Links */}
                        <div className="flex gap-2 mt-3">
                            {profile?.website && (
                                <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer">
                                        <Globe className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                            {profile?.linkedin_url && (
                                <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
                                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                                        <Linkedin className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                            {profile?.twitter_handle && (
                                <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
                                    <a href={`https://twitter.com/${profile.twitter_handle}`} target="_blank" rel="noopener noreferrer">
                                        <Twitter className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Dialog open={isEditing} onOpenChange={setIsEditing}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-[#1a1a2e] border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle>Edit Profile</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {/* Copy existing form fields logic here if simpler, or assume unchanged structure mostly */}
                                    {/* For brevity in this large block replacement, I am keeping the form logic essentially same but checking styling */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name">Full Name</Label>
                                            <Input
                                                id="full_name"
                                                value={editForm.full_name}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                                                className="bg-black/20 border-white/10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Location</Label>
                                            <Input
                                                id="location"
                                                value={editForm.location}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                                className="bg-black/20 border-white/10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bio">Bio</Label>
                                        <Textarea
                                            id="bio"
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                            className="bg-black/20 border-white/10 min-h-20"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="website">Website</Label>
                                            <Input
                                                id="website"
                                                value={editForm.website}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                                                className="bg-black/20 border-white/10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                                className="bg-black/20 border-white/10"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                                            <Input
                                                id="linkedin_url"
                                                value={editForm.linkedin_url}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                                                className="bg-black/20 border-white/10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="twitter_handle">Twitter Handle</Label>
                                            <Input
                                                id="twitter_handle"
                                                value={editForm.twitter_handle}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, twitter_handle: e.target.value }))}
                                                className="bg-black/20 border-white/10"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                                            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="outline"
                            className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                            onClick={async () => {
                                try {
                                    await signOut();
                                    toast.success('Signed out successfully!');
                                } catch (error) {
                                    toast.error('Failed to sign out');
                                }
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>
                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* Profile Completion - Box Design */}
            {profile && profile.profile_completion_score < 100 && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 border border-white/5 shadow-xl">
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Complete Your Profile</h3>
                            <span className="text-cyan-400 font-mono">{profile.profile_completion_score}% Complete</span>
                        </div>
                        <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full transition-all duration-1000"
                                style={{ width: `${profile.profile_completion_score}%` }}
                            ></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            {getProfileCompletionTasks().map((task, index) => (
                                <div key={index} className="flex items-center gap-3 text-sm">
                                    {task.completed ? (
                                        <CheckCircle className="h-5 w-5 text-green-400" />
                                    ) : (
                                        <div className="h-5 w-5 rounded-full border-2 border-slate-600" />
                                    )}
                                    <span className={task.completed ? 'text-slate-500 line-through' : 'text-slate-300'}>
                                        {task.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Box Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Sessions - Purple */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a2a40] to-[#1a1a2e] p-6 border border-white/5 shadow-xl group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                            <Target className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{statistics?.total_sessions || 0}</p>
                            <p className="text-xs text-purple-300/60 uppercase tracking-wider font-medium">Total Sessions</p>
                        </div>
                    </div>
                </div>

                {/* Focus Time - Green/Cyan */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a2a40] to-[#1a1a2e] p-6 border border-white/5 shadow-xl group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{Math.round((statistics?.total_focus_time || 0) / 60)}<span className="text-lg text-slate-400">h</span></p>
                            <p className="text-xs text-green-300/60 uppercase tracking-wider font-medium">Focus Time</p>
                        </div>
                    </div>
                </div>

                {/* Streak - Orange */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a2a40] to-[#1a1a2e] p-6 border border-white/5 shadow-xl group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                            <Flame className="h-6 w-6 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{statistics?.current_streak || 0}</p>
                            <p className="text-xs text-orange-300/60 uppercase tracking-wider font-medium">Current Streak</p>
                        </div>
                    </div>
                </div>

                {/* Level - Pink */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a2a40] to-[#1a1a2e] p-6 border border-white/5 shadow-xl group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                            <Star className="h-6 w-6 text-pink-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{statistics?.current_level || 1}</p>
                            <p className="text-xs text-pink-300/60 uppercase tracking-wider font-medium">Level</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Experience Progress - Box Design */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 border border-white/5 shadow-xl">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Experience Progress</h3>
                        <span className="text-slate-400 font-mono text-sm">
                            {statistics?.experience_points || 0} / {calculateNextLevelXP(statistics?.current_level || 1)} XP
                        </span>
                    </div>
                    <div className="relative h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000"
                            style={{ width: `${((statistics?.experience_points || 0) / calculateNextLevelXP(statistics?.current_level || 1)) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-slate-500">
                        {calculateNextLevelXP(statistics?.current_level || 1) - (statistics?.experience_points || 0)} XP until Level {(statistics?.current_level || 1) + 1}
                    </p>
                </div>
            </div>

            {/* Quick Stats - Bottom Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 border border-white/5 shadow-xl">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            <span className="text-sm font-medium text-slate-300">Today's Focus</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{statistics?.today_focus_time || 0}<span className="text-sm text-slate-500 ml-1">m</span></p>
                        <p className="text-xs text-slate-500">
                            Goal: {preferences?.daily_focus_goal || 120}m
                        </p>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 border border-white/5 shadow-xl">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm font-medium text-slate-300">Achievements</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{statistics?.total_achievements || 0}</p>
                        <p className="text-xs text-slate-500">
                            {achievements?.filter((a: any) => a.progress >= a.max_progress).length || 0} unlocked
                        </p>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 border border-white/5 shadow-xl">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-medium text-slate-300">Best Streak</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{statistics?.longest_streak || 0}</p>
                        <p className="text-xs text-slate-500">days in a row</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
