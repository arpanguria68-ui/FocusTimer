import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all quotes (Public + User's Custom)
export const getQuotes = query({
    args: {
        // userId: v.optional(v.string()), // REMOVED: Inferred from auth
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let quotes = [];

        // 1. Fetch Public Quotes (user_id is null) or is_custom is false (legacy schema might vary)
        // Schema says: is_custom: boolean
        // We trust is_custom=false are public system quotes
        const publicQuotes = await ctx.db
            .query("quotes")
            .withIndex("by_is_custom", (q) => q.eq("is_custom", false))
            .collect();

        quotes.push(...publicQuotes);

        // 2. Fetch User Custom Quotes (if authenticated)
        const identity = await ctx.auth.getUserIdentity();
        if (identity) {
            const userQuotes = await ctx.db
                .query("quotes")
                .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
                // .filter((q) => q.eq(q.field("is_custom"), true)) // Implicit by being by_user and created by user, but explicit check doesn't hurt
                .collect();
            quotes.push(...userQuotes);
        }

        // 3. Filter by Category (in-memory filter, as Convex doesn't support multi-field index queries easily yet)
        if (args.category && args.category !== "all") {
            quotes = quotes.filter((q) => q.category === args.category);
        }

        // 4. Sort by Created At (descending)
        return quotes.sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
});

// Create a new quote
export const createQuote = mutation({
    args: {
        // user_id: v.string(), // REMOVED
        content: v.string(),
        author: v.optional(v.string()),
        category: v.optional(v.string()),
        is_custom: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const quoteId = await ctx.db.insert("quotes", {
            ...args,
            user_id: identity.subject, // TRUSTED
            created_at: new Date().toISOString(),
        });
        return quoteId;
    },
});

// Delete a quote
export const deleteQuote = mutation({
    args: { id: v.id("quotes") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const quote = await ctx.db.get(args.id);
        if (!quote) throw new Error("Quote not found");

        // Only allow deleting own quotes
        if (quote.user_id !== identity.subject) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});

// Update a quote
export const updateQuote = mutation({
    args: {
        id: v.id("quotes"),
        content: v.optional(v.string()),
        author: v.optional(v.string()),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const quote = await ctx.db.get(args.id);
        if (!quote) throw new Error("Quote not found");

        if (quote.user_id !== identity.subject) {
            throw new Error("Unauthorized");
        }

        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
        return await ctx.db.get(id);
    },
});
