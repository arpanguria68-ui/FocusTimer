import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const ensureUser = mutation({
    args: {
        id: v.string(), // External ID
        email: v.string(),
        full_name: v.optional(v.string()),
        avatar_url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if user exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_external_id", (q) => q.eq("id", args.id))
            .unique();

        if (existingUser) {
            // Update if needed
            await ctx.db.patch(existingUser._id, {
                email: args.email,
                full_name: args.full_name,
                avatar_url: args.avatar_url,
                updated_at: new Date().toISOString(),
            });
            return existingUser._id;
        } else {
            // Create new
            const newId = await ctx.db.insert("users", {
                id: args.id,
                email: args.email,
                full_name: args.full_name,
                avatar_url: args.avatar_url,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            return newId;
        }
    },
});

export const getUser = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_external_id", (q) => q.eq("id", args.id))
            .unique();
    },
});
