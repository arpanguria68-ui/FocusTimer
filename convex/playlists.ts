import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get User Playlists
export const getPlaylists = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("playlists")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .collect();
    },
});

// Create Playlist
export const createPlaylist = mutation({
    args: {
        user_id: v.string(),
        name: v.string(),
        quote_ids: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("playlists", {
            ...args,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        return id;
    },
});

// Update Playlist
export const updatePlaylist = mutation({
    args: {
        id: v.id("playlists"),
        name: v.optional(v.string()),
        quote_ids: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updated_at: new Date().toISOString(),
        });
    },
});

// Delete Playlist
export const deletePlaylist = mutation({
    args: { id: v.id("playlists") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Add Quote to Playlist
export const addQuoteToPlaylist = mutation({
    args: {
        playlist_id: v.id("playlists"),
        quote_id: v.string(),
    },
    handler: async (ctx, args) => {
        const playlist = await ctx.db.get(args.playlist_id);
        if (!playlist) throw new Error("Playlist not found");

        if (!playlist.quote_ids.includes(args.quote_id)) {
            await ctx.db.patch(args.playlist_id, {
                quote_ids: [...playlist.quote_ids, args.quote_id],
                updated_at: new Date().toISOString(),
            });
        }
    },
});

// Remove Quote from Playlist
export const removeQuoteFromPlaylist = mutation({
    args: {
        playlist_id: v.id("playlists"),
        quote_id: v.string(),
    },
    handler: async (ctx, args) => {
        const playlist = await ctx.db.get(args.playlist_id);
        if (!playlist) throw new Error("Playlist not found");

        await ctx.db.patch(args.playlist_id, {
            quote_ids: playlist.quote_ids.filter((id) => id !== args.quote_id),
            updated_at: new Date().toISOString(),
        });
    },
});
