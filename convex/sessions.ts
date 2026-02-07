import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get User Sessions
export const getUserSessions = query({
    args: {
        userId: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        const sessions = await ctx.db
            .query("focus_sessions")
            .withIndex("by_user_created", (q) => q.eq("user_id", args.userId))
            .order("desc")
            .take(limit);
        return sessions;
    },
});

// Create Session
export const createSession = mutation({
    args: {
        user_id: v.string(),
        session_type: v.union(v.literal('focus'), v.literal('short_break'), v.literal('long_break')),
        duration_minutes: v.number(),
        task_id: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const sessionId = await ctx.db.insert("focus_sessions", {
            ...args,
            completed: false, // Initially incomplete
            started_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
        });
        return sessionId;
    },
});

// Complete Session
export const completeSession = mutation({
    args: { id: v.id("focus_sessions") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            completed: true,
            completed_at: new Date().toISOString(),
        });
    },
});

// Get Today's Stats
export const getTodayStats = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const today = new Date().toISOString().split('T')[0];

        // Fetch recent sessions and filter in memory (Convex strict indexes make date-range regex hard)
        // We fetch last 100 sessions - usually enough for "today"
        const recentSessions = await ctx.db
            .query("focus_sessions")
            .withIndex("by_user_created", (q) => q.eq("user_id", args.userId))
            .order("desc")
            .take(100);

        const todaySessions = recentSessions.filter(s => s.created_at.startsWith(today));

        const totalMinutes = todaySessions.reduce((acc, s) => acc + s.duration_minutes, 0);
        const completedSessions = todaySessions.filter(s => s.completed).length;

        return {
            sessionsCount: completedSessions,
            totalFocusTime: totalMinutes,
        };
    },
});
