import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user favorites
export const getFavorites = query({
    args: {
        // userId: v.string() // REMOVED
    },
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("favorites")
            .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
            .collect();
    },
});

// Toggle Favorite
export const toggleFavorite = mutation({
    args: {
        // user_id: v.string(), // REMOVED
        quote_id: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const existing = await ctx.db
            .query("favorites")
            .withIndex("by_user_quote", (q) =>
                q.eq("user_id", identity.subject).eq("quote_id", args.quote_id)
            )
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { action: "removed", id: existing._id };
        } else {
            const id = await ctx.db.insert("favorites", {
                user_id: identity.subject, // TRUSTED
                quote_id: args.quote_id,
                created_at: new Date().toISOString(),
            });
            return { action: "added", id };
        }
    },
});

// Sync Favorites (Bulk Add) - For migrating local favorites
export const syncFavorites = mutation({
    args: {
        // user_id: v.string(), // REMOVED
        quote_ids: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const results = [];
        for (const quoteId of args.quote_ids) {
            const existing = await ctx.db
                .query("favorites")
                .withIndex("by_user_quote", (q) =>
                    q.eq("user_id", identity.subject).eq("quote_id", quoteId)
                )
                .first();

            if (!existing) {
                const id = await ctx.db.insert("favorites", {
                    user_id: identity.subject, // TRUSTED
                    quote_id: quoteId,
                    created_at: new Date().toISOString(),
                });
                results.push(id);
            }
        }
        return results;
    },
});
