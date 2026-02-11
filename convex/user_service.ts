import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to calculate profile completion (simplified version)
function calculateProfileCompletion(args: any) {
    const fields = ['full_name', 'avatar_url']; // simplified fields
    const completedFields = fields.filter(field => args[field] && args[field].trim() !== '');
    return Math.round((completedFields.length / fields.length) * 100);
}

// ===== PROFILE MANAGEMENT =====

export const createUserProfile = mutation({
    args: {
        // id: v.string(), // REMOVED: Insecure
        email: v.string(),
        full_name: v.optional(v.string()),
        avatar_url: v.optional(v.string()),
        onboarding_completed: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const existing = await ctx.db
            .query("users")
            .withIndex("by_external_id", (q) => q.eq("id", identity.subject))
            .unique();

        if (existing) {
            // Update existing
            await ctx.db.patch(existing._id, {
                ...args,
                updated_at: new Date().toISOString(),
            });
            return existing;
        }

        const newId = await ctx.db.insert("users", {
            ...args,
            id: identity.subject, // TRUSTED: From auth context
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        return await ctx.db.get(newId);
    },
});

export const getUserProfile = query({
    args: {}, // No args needed, gets own profile
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null; // Or throw, but null is safer for initial load queries

        return await ctx.db
            .query("users")
            .withIndex("by_external_id", (q) => q.eq("id", identity.subject))
            .unique();
    },
});

// ===== PREFERENCES MANAGEMENT =====

export const updateUserPreferences = mutation({
    args: {
        // user_id: v.string(), // REMOVED
        preferred_session_length: v.optional(v.number()),
        preferred_break_length: v.optional(v.number()),
        preferred_long_break_length: v.optional(v.number()),
        sessions_before_long_break: v.optional(v.number()),
        email_notifications: v.optional(v.boolean()),
        push_notifications: v.optional(v.boolean()),
        theme: v.optional(v.union(v.literal('light'), v.literal('dark'), v.literal('system'))),
        daily_focus_goal: v.optional(v.number()),
        // Add other fields as needed
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const existing = await ctx.db
            .query("user_preferences")
            .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...args,
                updated_at: new Date().toISOString(),
            });
            return await ctx.db.get(existing._id);
        } else {
            const newId = await ctx.db.insert("user_preferences", {
                ...args,
                user_id: identity.subject, // TRUSTED
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            return await ctx.db.get(newId);
        }
    },
});

// Legacy support for user_settings (synced with preferences)
export const upsertUserSettings = mutation({
    args: {
        // user_id: v.string(), // REMOVED
        focus_duration: v.number(),
        short_break_duration: v.number(),
        long_break_duration: v.number(),
        sessions_until_long_break: v.number(),
        notifications_enabled: v.boolean(),
        sound_enabled: v.boolean(),
        theme: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const existing = await ctx.db
            .query("user_settings")
            .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...args,
                updated_at: new Date().toISOString(),
            });
            return await ctx.db.get(existing._id);
        } else {
            const newId = await ctx.db.insert("user_settings", {
                ...args,
                user_id: identity.subject, // TRUSTED
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            return await ctx.db.get(newId);
        }
    },
});


// ===== STATISTICS MANAGEMENT =====

export const updateUserStatistics = mutation({
    args: {
        // user_id: v.string(), // REMOVED
        total_sessions: v.optional(v.number()),
        completed_sessions: v.optional(v.number()),
        total_focus_time: v.optional(v.number()),
        current_level: v.optional(v.number()),
        experience_points: v.optional(v.number()),
        // Add others as needed
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const existing = await ctx.db
            .query("user_statistics")
            .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...args,
                updated_at: new Date().toISOString(),
            });
            return await ctx.db.get(existing._id);
        } else {
            const newId = await ctx.db.insert("user_statistics", {
                ...args,
                user_id: identity.subject, // TRUSTED
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            return await ctx.db.get(newId);
        }
    },
});

export const getOverallAnalytics = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null; // Gracefully handle unauthenticated state

        const userId = identity.subject;

        // 1. Fetch User Statistics (Pre-calculated if possible)
        const userStats = await ctx.db
            .query("user_statistics")
            .withIndex("by_user", (q) => q.eq("user_id", userId))
            .unique();

        // 2. Fetch Recent Focus Sessions (Last ~30 days or just last 100 for now)
        // Optimized: Only fetch necessary fields if possible (Convex doesn't support 'select' yet, but good for future)
        const recentSessions = await ctx.db
            .query("focus_sessions")
            .withIndex("by_user_created", (q) => q.eq("user_id", userId))
            .order("desc")
            .take(100);

        // 3. Process Data for Charts
        const dayOfWeekDistribution = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
        const hourOfDayDistribution = new Array(24).fill(0); // 0-23
        let totalFocusMinutes = 0;
        let completedSessionsCount = 0;

        recentSessions.forEach(session => {
            const date = new Date(session.created_at);

            // Weekly Distribution
            const day = date.getDay();
            dayOfWeekDistribution[day] += session.duration_minutes;

            // Hourly Distribution (Productivity Heatmap)
            const hour = date.getHours();
            hourOfDayDistribution[hour] += session.duration_minutes;

            if (session.completed) {
                completedSessionsCount++;
                totalFocusMinutes += session.duration_minutes;
            }
        });

        // 4. Fetch Active Goals
        const activeGoals = await ctx.db
            .query("user_goals")
            .withIndex("by_user", (q) => q.eq("user_id", userId))
            // Manual filter for is_active since we don't have a compound index on user_id + is_active yet
            .filter((q) => q.eq(q.field("is_active"), true))
            .collect();

        // 5. Construct Response
        return {
            summary: {
                totalFocusMinutes: userStats?.total_focus_time || totalFocusMinutes,
                completedSessions: userStats?.completed_sessions || completedSessionsCount,
                currentStreak: userStats?.current_streak || 0,
                level: userStats?.current_level || 1,
                xp: userStats?.experience_points || 0,
            },
            charts: {
                weeklyActivity: dayOfWeekDistribution, // [Sun, Mon, ..., Sat]
                hourlyActivity: hourOfDayDistribution, // [00:00, 01:00, ..., 23:00]
            },
            goals: activeGoals,
            recentSessions: recentSessions.slice(0, 5).map(s => ({
                id: s._id,
                type: s.session_type,
                duration: s.duration_minutes,
                completed: s.completed,
                date: s.created_at
            }))
        };
    },
});


// ===== GOALS MANAGEMENT =====

export const createUserGoal = mutation({
    args: {
        // user_id: v.string(), // REMOVED
        goal_type: v.union(v.literal('daily'), v.literal('weekly'), v.literal('monthly'), v.literal('custom')),
        goal_name: v.string(),
        goal_description: v.optional(v.string()),
        target_value: v.number(),
        unit: v.optional(v.string()),
        start_date: v.string(),
        is_active: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const newId = await ctx.db.insert("user_goals", {
            ...args,
            user_id: identity.subject, // TRUSTED
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        return await ctx.db.get(newId);
    },
});

export const getUserGoals = query({
    args: { completed: v.optional(v.boolean()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        let q = ctx.db
            .query("user_goals")
            .withIndex("by_user", (q) => q.eq("user_id", identity.subject));

        if (args.completed !== undefined) {
            // We don't have a compound index for completed yet, so filter in memory or add index
            // For now, filter in memory as goals list is small
            const allGoals = await q.collect();
            return allGoals.filter(g => !!g.is_completed === args.completed);
        }

        return await q.collect();
    },
});

export const getUserAchievements = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("user_achievements")
            .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
            .collect();
    },
});

export const getUserActivityLog = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("user_activity_log")
            .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
            .order("desc")
            .take(50);
    },
});

