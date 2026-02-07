import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user favorites
export const getFavorites = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("favorites")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .collect();
    },
});

// Toggle Favorite
export const toggleFavorite = mutation({
    args: {
        user_id: v.string(),
        quote_id: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("favorites")
            .withIndex("by_user_quote", (q) =>
                q.eq("user_id", args.user_id).eq("quote_id", args.quote_id)
            )
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { action: "removed", id: existing._id };
        } else {
            const id = await ctx.db.insert("favorites", {
                user_id: args.user_id,
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
        user_id: v.string(),
        quote_ids: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const results = [];
        for (const quoteId of args.quote_ids) {
            const existing = await ctx.db
                .query("favorites")
                .withIndex("by_user_quote", (q) =>
                    q.eq("user_id", args.user_id).eq("quote_id", quoteId)
                )
                .first();

            if (!existing) {
                const id = await ctx.db.insert("favorites", {
                    user_id: args.user_id,
                    quote_id: quoteId,
                    created_at: new Date().toISOString(),
                });
                results.push(id);
            }
        }
        return results;
    },
});
