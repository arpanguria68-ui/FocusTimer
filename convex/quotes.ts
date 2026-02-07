import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all quotes (Public + User's Custom)
export const getQuotes = query({
    args: {
        userId: v.optional(v.string()), // Optional: if provided, fetch custom quotes too
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let quotes = [];

        // 1. Fetch Public Quotes (user_id is null)
        const publicQuotes = await ctx.db
            .query("quotes")
            .withIndex("by_is_custom", (q) => q.eq("is_custom", false))
            .collect();

        quotes.push(...publicQuotes);

        // 2. Fetch User Custom Quotes (if userId provided)
        if (args.userId) {
            const userQuotes = await ctx.db
                .query("quotes")
                .withIndex("by_user", (q) => q.eq("user_id", args.userId))
                .filter((q) => q.eq(q.field("is_custom"), true))
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
        user_id: v.string(),
        content: v.string(),
        author: v.optional(v.string()),
        category: v.optional(v.string()),
        is_custom: v.boolean(),
    },
    handler: async (ctx, args) => {
        const quoteId = await ctx.db.insert("quotes", {
            ...args,
            created_at: new Date().toISOString(),
        });
        return quoteId;
    },
});

// Delete a quote
export const deleteQuote = mutation({
    args: { id: v.id("quotes") },
    handler: async (ctx, args) => {
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
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
        return await ctx.db.get(id);
    },
});
