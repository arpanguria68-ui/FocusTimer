import { mutation, query } from "../_generated/server";
import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { ConvexError, v } from "convex/values";

/**
 * Standard Authentication Check
 * Throws a consistent error if the user is not logged in.
 * Also fetches the User document from the database.
 */
async function checkAuth(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new ConvexError({ code: "UNAUTHENTICATED", message: "You must be logged in." });
    }

    // Uniformly fetch the user from YOUR database
    const user = await ctx.db
        .query("users")
        .withIndex("by_external_id", (q: any) => q.eq("id", identity.subject))
        .unique();

    if (!user) {
        // Optional: Auto-create user here if you want lazy creation, 
        // but usually better to fail so client knows to call 'storeUser'
        throw new ConvexError("User not found in database");
    }

    return { identity, user };
}

/**
 * 🔒 AUTHENTICATED MUTATION
 * Automatically checks auth and passes `identity` and `user` to the handler.
 */
export const authMutation = customMutation(mutation, {
    args: {},
    input: async (ctx, args) => {
        const { identity, user } = await checkAuth(ctx);
        return { ctx: { ...ctx, identity, user }, args };
    },
});

/**
 * 🔒 AUTHENTICATED QUERY
 * Automatically checks auth and passes `identity` and `user` to the handler.
 */
export const authQuery = customQuery(query, {
    args: {},
    input: async (ctx, args) => {
        const { identity, user } = await checkAuth(ctx);
        return { ctx: { ...ctx, identity, user }, args };
    },
});

/**
 * 🔓 PUBLIC PROCEDURES (Optional)
 * Use standard `mutation` and `query` for public access, 
 * or define public wrappers if you need logging/analytics.
 */
export { mutation as publicMutation, query as publicQuery };
