import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get User Sessions
export const getUserSessions = query({
    args: {
        // userId: v.string(), // REMOVED
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return []; // Return empty if not authenticated

        const limit = args.limit || 50;
        const sessions = await ctx.db
            .query("focus_sessions")
            .withIndex("by_user_created", (q) => q.eq("user_id", identity.subject))
            .order("desc")
            .take(limit);
        return sessions;
    },
});

// Create Session
export const createSession = mutation({
    args: {
        // user_id: v.string(), // REMOVED
        session_type: v.union(v.literal('focus'), v.literal('short_break'), v.literal('long_break')),
        duration_minutes: v.number(),
        task_id: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const sessionId = await ctx.db.insert("focus_sessions", {
            ...args,
            user_id: identity.subject, // TRUSTED
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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const session = await ctx.db.get(args.id);
        if (!session) throw new Error("Session not found");

        if (session.user_id !== identity.subject) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.id, {
            completed: true,
            completed_at: new Date().toISOString(),
        });
    },
});

// Get Today's Stats
export const getTodayStats = query({
    args: {
        // userId: v.string() // REMOVED
    },
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { sessionsCount: 0, totalFocusTime: 0 };

        const today = new Date().toISOString().split('T')[0];

        // Fetch recent sessions and filter in memory (Convex strict indexes make date-range regex hard)
        // We fetch last 100 sessions - usually enough for "today"
        const recentSessions = await ctx.db
            .query("focus_sessions")
            .withIndex("by_user_created", (q) => q.eq("user_id", identity.subject))
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
