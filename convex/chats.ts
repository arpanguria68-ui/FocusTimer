
import { v } from "convex/values";
import { authMutation, authQuery } from "./lib/procedures";

// --- Queries ---

export const getConversations = authQuery({
    args: {},
    handler: async (ctx) => {
        const conversations = await ctx.db
            .query("chat_conversations")
            .withIndex("by_user_updated", (q) => q.eq("user_id", ctx.user.id))
            .order("desc")
            .collect();

        return conversations;
    },
});

export const getActiveConversation = authQuery({
    args: { conversationId: v.optional(v.id("chat_conversations")) },
    handler: async (ctx, args) => {
        if (args.conversationId) {
            const conv = await ctx.db.get(args.conversationId);
            if (conv?.user_id !== ctx.user.id) return null;
            return conv;
        }

        // Return most recent if no ID provided
        const recent = await ctx.db
            .query("chat_conversations")
            .withIndex("by_user_updated", (q) => q.eq("user_id", ctx.user.id))
            .order("desc")
            .first();

        return recent;
    },
});

export const getMessages = authQuery({
    args: { conversationId: v.optional(v.id("chat_conversations")) },
    handler: async (ctx, args) => {
        if (!args.conversationId) return [];

        // Validate access
        const conv = await ctx.db.get(args.conversationId);
        if (!conv || conv.user_id !== ctx.user.id) return [];

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversationId!))
            .collect();

        return messages;
    },
});


// --- Mutations ---

export const createConversation = authMutation({
    args: {
        title: v.optional(v.string()),
        agent_mode: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("chat_conversations", {
            user_id: ctx.user.id,
            title: args.title || "New Chat",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_archived: false,
            agent_mode: args.agent_mode || "pareto", // Default to Essentialist
        });

        return await ctx.db.get(id);
    },
});

export const addMessage = authMutation({
    args: {
        conversation_id: v.id("chat_conversations"),
        user_id: v.string(), // Ignored for auth, but kept for strictness if needed
        content: v.string(),
        sender: v.union(v.literal("user"), v.literal("ai")),
        message_type: v.optional(v.string()),
        response_time_ms: v.optional(v.number()),
        tokens_used: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Verify ownership
        const conversation = await ctx.db.get(args.conversation_id);
        if (!conversation || conversation.user_id !== ctx.user.id) {
            throw new Error("Conversation not found or access denied");
        }

        const messageId = await ctx.db.insert("messages", {
            conversation_id: args.conversation_id,
            role: args.sender === "user" ? "user" : "assistant",
            content: args.content,
            created_at: new Date().toISOString(),
        });

        // Update conversation properties
        await ctx.db.patch(args.conversation_id, {
            updated_at: new Date().toISOString(),
            last_message: args.content.substring(0, 100) + (args.content.length > 100 ? "..." : ""),
        });

        return messageId;
    },
});

export const deleteConversation = authMutation({
    args: { conversationId: v.id("chat_conversations") },
    handler: async (ctx, args) => {
        const conv = await ctx.db.get(args.conversationId);
        if (!conv || conv.user_id !== ctx.user.id) return;

        await ctx.db.delete(args.conversationId);

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversationId))
            .collect();

        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }
    },
});

export const archiveConversation = authMutation({
    args: { conversationId: v.id("chat_conversations") },
    handler: async (ctx, args) => {
        const conv = await ctx.db.get(args.conversationId);
        if (!conv || conv.user_id !== ctx.user.id) return;

        await ctx.db.patch(args.conversationId, {
            is_archived: true,
            updated_at: new Date().toISOString()
        });
    }
});

// Stats query
export const getChatStats = authQuery({
    args: {},
    handler: async (ctx) => {
        const conversations = await ctx.db
            .query("chat_conversations")
            .withIndex("by_user", q => q.eq("user_id", ctx.user.id))
            .collect();

        return {
            totalConversations: conversations.length,
            totalMessages: 0 // Implement properly if needed
        };
    }
});
