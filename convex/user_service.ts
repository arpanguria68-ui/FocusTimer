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
        id: v.string(), // External ID
        email: v.string(),
        full_name: v.optional(v.string()),
        avatar_url: v.optional(v.string()),
        onboarding_completed: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_external_id", (q) => q.eq("id", args.id))
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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        return await ctx.db.get(newId);
    },
});

export const getUserProfile = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_external_id", (q) => q.eq("id", args.id))
            .unique();
    },
});

// ===== PREFERENCES MANAGEMENT =====

export const updateUserPreferences = mutation({
    args: {
        user_id: v.string(),
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
        const existing = await ctx.db
            .query("user_preferences")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
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
        user_id: v.string(),
        focus_duration: v.number(),
        short_break_duration: v.number(),
        long_break_duration: v.number(),
        sessions_until_long_break: v.number(),
        notifications_enabled: v.boolean(),
        sound_enabled: v.boolean(),
        theme: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("user_settings")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
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
        user_id: v.string(),
        total_sessions: v.optional(v.number()),
        completed_sessions: v.optional(v.number()),
        total_focus_time: v.optional(v.number()),
        current_level: v.optional(v.number()),
        experience_points: v.optional(v.number()),
        // Add others as needed
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("user_statistics")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
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
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            return await ctx.db.get(newId);
        }
    },
});

// ===== GOALS MANAGEMENT =====

export const createUserGoal = mutation({
    args: {
        user_id: v.string(),
        goal_type: v.union(v.literal('daily'), v.literal('weekly'), v.literal('monthly'), v.literal('custom')),
        goal_name: v.string(),
        goal_description: v.optional(v.string()),
        target_value: v.number(),
        unit: v.optional(v.string()),
        start_date: v.string(),
        is_active: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const newId = await ctx.db.insert("user_goals", {
            ...args,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        return await ctx.db.get(newId);
    },
});
