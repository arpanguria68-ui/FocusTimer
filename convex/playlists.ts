import { authMutation, authQuery } from "./lib/procedures";
import { v } from "convex/values";

// Get User Playlists
export const getPlaylists = authQuery({
    args: {},
    handler: async (ctx) => {
        // Auth is already checked, ctx.user is available
        return await ctx.db
            .query("playlists")
            .withIndex("by_user", (q) => q.eq("user_id", ctx.user.id))
            .collect();
    },
});

// Create Playlist
export const createPlaylist = authMutation({
    args: {
        name: v.string(),
        quote_ids: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        // Auth is checked, user exists
        const id = await ctx.db.insert("playlists", {
            ...args,
            user_id: ctx.user.id, // Using consistent user ID from DB doc (matches Clerk ID)
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        return id;
    },
});

// Update Playlist
export const updatePlaylist = authMutation({
    args: {
        id: v.id("playlists"),
        name: v.optional(v.string()),
        quote_ids: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const playlist = await ctx.db.get(args.id);
        if (!playlist) throw new Error("Playlist not found");

        if (playlist.user_id !== ctx.user.id) {
            throw new Error("Unauthorized");
        }

        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updated_at: new Date().toISOString(),
        });
    },
});

// Delete Playlist
export const deletePlaylist = authMutation({
    args: { id: v.id("playlists") },
    handler: async (ctx, args) => {
        const playlist = await ctx.db.get(args.id);
        if (!playlist) throw new Error("Playlist not found");

        if (playlist.user_id !== ctx.user.id) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});

// Add Quote to Playlist
export const addQuoteToPlaylist = authMutation({
    args: {
        playlist_id: v.id("playlists"),
        quote_id: v.string(),
    },
    handler: async (ctx, args) => {
        const playlist = await ctx.db.get(args.playlist_id);
        if (!playlist) throw new Error("Playlist not found");

        if (playlist.user_id !== ctx.user.id) {
            throw new Error("Unauthorized");
        }

        if (!playlist.quote_ids.includes(args.quote_id)) {
            await ctx.db.patch(args.playlist_id, {
                quote_ids: [...playlist.quote_ids, args.quote_id],
                updated_at: new Date().toISOString(),
            });
        }
    },
});

// Remove Quote from Playlist
export const removeQuoteFromPlaylist = authMutation({
    args: {
        playlist_id: v.id("playlists"),
        quote_id: v.string(),
    },
    handler: async (ctx, args) => {
        const playlist = await ctx.db.get(args.playlist_id);
        if (!playlist) throw new Error("Playlist not found");

        if (playlist.user_id !== ctx.user.id) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.playlist_id, {
            quote_ids: playlist.quote_ids.filter((id) => id !== args.quote_id),
            updated_at: new Date().toISOString(),
        });
    },
});

