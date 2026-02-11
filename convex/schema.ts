import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Users: Stores profile information synced from Clerk/Supabase logic
    users: defineTable({
        id: v.string(), // External ID (Clerk ID)
        email: v.string(),
        full_name: v.optional(v.string()),
        avatar_url: v.optional(v.string()),
        onboarding_completed: v.optional(v.boolean()),
        // Metadata for syncing
        created_at: v.string(),
        updated_at: v.string(),
    }).index("by_external_id", ["id"]),

    // Focus Sessions: Tracks Pomodoro sessions
    focus_sessions: defineTable({
        user_id: v.string(),
        session_type: v.union(v.literal('focus'), v.literal('short_break'), v.literal('long_break')),
        duration_minutes: v.number(),
        completed: v.boolean(),
        started_at: v.string(),
        completed_at: v.optional(v.string()),
        created_at: v.string(),
        task_id: v.optional(v.string()),
        category: v.optional(v.union(v.literal('signal'), v.literal('noise'))),
    })
        .index("by_user", ["user_id"])
        .index("by_user_created", ["user_id", "created_at"]), // For stats query

    // Tasks: Todo list items
    tasks: defineTable({
        user_id: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        completed: v.boolean(),
        priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
        due_date: v.optional(v.string()),
        created_at: v.string(),
        updated_at: v.string(),
        category: v.union(v.literal('signal'), v.literal('noise')),
    })
        .index("by_user", ["user_id"])
        .index("by_user_completed", ["user_id", "completed"]) // For filtering active/completed
        .index("by_user_due", ["user_id", "due_date"]), // For "Due Today"

    // Quotes: Public and User Custom quotes
    quotes: defineTable({
        user_id: v.optional(v.string()), // Null = System Quote, ID = Custom Quote
        content: v.string(),
        author: v.optional(v.string()),
        category: v.optional(v.string()),
        is_custom: v.boolean(),
        created_at: v.string(),
    })
        .index("by_user", ["user_id"]) // For fetching user's custom quotes
        .index("by_is_custom", ["is_custom"]), // For filtering system quotes (user_id is null)

    // User Settings: Preferences
    user_settings: defineTable({
        user_id: v.string(),
        focus_duration: v.number(),
        short_break_duration: v.number(),
        long_break_duration: v.number(),
        sessions_until_long_break: v.number(),
        notifications_enabled: v.boolean(),
        sound_enabled: v.boolean(),
        theme: v.string(),
        created_at: v.string(),
        updated_at: v.string(),
    })
        .index("by_user", ["user_id"]),

    // Chat Conversations
    chat_conversations: defineTable({
        user_id: v.string(),
        title: v.string(),
        created_at: v.string(),
        updated_at: v.string(),
        last_message: v.optional(v.string()),
        is_archived: v.optional(v.boolean()),
        agent_mode: v.optional(v.string()), // 'pareto', 'gtd', 'strategist', 'stoic', 'zen'
    })
        .index("by_user", ["user_id"])
        .index("by_user_updated", ["user_id", "updated_at"]),

    // Chat Messages
    messages: defineTable({
        conversation_id: v.id("chat_conversations"),
        role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
        content: v.string(),
        created_at: v.string(),
    })
        .index("by_conversation", ["conversation_id"]),

    // User Statistics
    user_statistics: defineTable({
        user_id: v.string(),
        total_sessions: v.optional(v.number()),
        completed_sessions: v.optional(v.number()),
        total_focus_time: v.optional(v.number()),
        total_break_time: v.optional(v.number()),
        average_session_length: v.optional(v.number()),
        current_streak: v.optional(v.number()),
        longest_streak: v.optional(v.number()),
        last_session_date: v.optional(v.string()),
        total_achievements: v.optional(v.number()),
        total_points: v.optional(v.number()),
        current_level: v.optional(v.number()),
        experience_points: v.optional(v.number()),
        today_focus_time: v.optional(v.number()),
        week_focus_time: v.optional(v.number()),
        month_focus_time: v.optional(v.number()),
        last_calculated_at: v.optional(v.string()),
        created_at: v.optional(v.string()), // Added for consistency
        updated_at: v.optional(v.string()),
    }).index("by_user", ["user_id"]),

    // User Goals
    user_goals: defineTable({
        user_id: v.string(),
        goal_type: v.union(v.literal('daily'), v.literal('weekly'), v.literal('monthly'), v.literal('custom')),
        goal_name: v.string(),
        goal_description: v.optional(v.string()),
        target_value: v.number(),
        current_value: v.optional(v.number()),
        unit: v.optional(v.string()),
        start_date: v.string(),
        end_date: v.optional(v.string()),
        is_active: v.optional(v.boolean()),
        is_completed: v.optional(v.boolean()),
        completed_at: v.optional(v.string()),
        created_at: v.string(),
        updated_at: v.string(),
    }).index("by_user", ["user_id"]),

    // User Achievements
    user_achievements: defineTable({
        user_id: v.string(),
        achievement_id: v.string(),
        achievement_name: v.string(),
        achievement_description: v.optional(v.string()),
        achievement_icon: v.optional(v.string()),
        achievement_category: v.optional(v.string()),
        unlocked_at: v.optional(v.string()),
        progress: v.optional(v.number()),
        max_progress: v.optional(v.number()),
        metadata: v.optional(v.any()), // Use specific structure if known, else any
        points_awarded: v.optional(v.number()),
        created_at: v.optional(v.string()),
        updated_at: v.optional(v.string()),
    })
        .index("by_user", ["user_id"])
        .index("by_user_achievement", ["user_id", "achievement_id"]),

    // User Activity Log
    user_activity_log: defineTable({
        user_id: v.string(),
        activity_type: v.string(),
        activity_description: v.optional(v.string()),
        activity_data: v.optional(v.any()),
        ip_address: v.optional(v.string()),
        user_agent: v.optional(v.string()),
        session_id: v.optional(v.string()),
        created_at: v.string(),
    }).index("by_user", ["user_id"]),

    // User Preferences (Detailed)
    user_preferences: defineTable({
        user_id: v.string(),
        preferred_session_length: v.optional(v.number()),
        preferred_break_length: v.optional(v.number()),
        preferred_long_break_length: v.optional(v.number()),
        sessions_before_long_break: v.optional(v.number()),
        auto_start_breaks: v.optional(v.boolean()),
        auto_start_sessions: v.optional(v.boolean()),
        email_notifications: v.optional(v.boolean()),
        push_notifications: v.optional(v.boolean()),
        session_reminders: v.optional(v.boolean()),
        achievement_notifications: v.optional(v.boolean()),
        weekly_reports: v.optional(v.boolean()),
        break_reminders: v.optional(v.boolean()),
        theme: v.optional(v.union(v.literal('light'), v.literal('dark'), v.literal('system'))),
        language: v.optional(v.string()),
        timezone: v.optional(v.string()),
        date_format: v.optional(v.string()),
        time_format: v.optional(v.union(v.literal('12h'), v.literal('24h'))),
        dashboard_layout: v.optional(v.any()),
        profile_public: v.optional(v.boolean()),
        show_activity: v.optional(v.boolean()),
        show_achievements: v.optional(v.boolean()),
        show_statistics: v.optional(v.boolean()),
        allow_friend_requests: v.optional(v.boolean()),
        daily_focus_goal: v.optional(v.number()),
        weekly_focus_goal: v.optional(v.number()),
        monthly_focus_goal: v.optional(v.number()),
        created_at: v.optional(v.string()),
        updated_at: v.optional(v.string()),
    }).index("by_user", ["user_id"]),

    // Playlists: User created collections of quotes
    playlists: defineTable({
        user_id: v.string(),
        name: v.string(),
        quote_ids: v.array(v.string()), // Array of Quote IDs
        created_at: v.string(),
        updated_at: v.string(),
    }).index("by_user", ["user_id"]),

    // Favorites: User's favorite quotes
    favorites: defineTable({
        user_id: v.string(),
        quote_id: v.string(),
        created_at: v.string(),
    })
        .index("by_user", ["user_id"])
        .index("by_user_quote", ["user_id", "quote_id"]), // For efficient lookup/toggling
});
