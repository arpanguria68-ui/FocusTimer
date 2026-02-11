import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user tasks
export const getTasks = query({
    args: {
        // userId: v.string(), // REMOVED
        completed: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return []; // Return empty if not authenticated

        let tasksQuery = ctx.db
            .query("tasks")
            .withIndex("by_user", (q) => q.eq("user_id", identity.subject));

        if (args.completed !== undefined) {
            tasksQuery = ctx.db
                .query("tasks")
                .withIndex("by_user_completed", (q) =>
                    q.eq("user_id", identity.subject).eq("completed", args.completed!)
                );
        }

        const tasks = await tasksQuery.collect();
        // Sort by Due Date (asc) then Created At (desc)
        return tasks.sort((a, b) => {
            if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
            return b.created_at.localeCompare(a.created_at);
        });
    },
});

// Create Task
export const createTask = mutation({
    args: {
        // user_id: v.string(), // REMOVED
        title: v.string(),
        description: v.optional(v.string()),
        priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
        due_date: v.optional(v.string()),
        category: v.union(v.literal('signal'), v.literal('noise')),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const taskId = await ctx.db.insert("tasks", {
            ...args,
            user_id: identity.subject, // TRUSTED
            completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        return taskId;
    },
});

// Toggle Task Completion
export const toggleTask = mutation({
    args: { id: v.id("tasks"), completed: v.boolean() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const task = await ctx.db.get(args.id);
        if (!task) throw new Error("Task not found");

        if (task.user_id !== identity.subject) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.id, {
            completed: args.completed,
            updated_at: new Date().toISOString(),
        });
    },
});

// Delete Task
export const deleteTask = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const task = await ctx.db.get(args.id);
        if (!task) throw new Error("Task not found");

        if (task.user_id !== identity.subject) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});

// Update Task
export const updateTask = mutation({
    args: {
        id: v.id("tasks"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
        due_date: v.optional(v.string()),
        category: v.optional(v.union(v.literal('signal'), v.literal('noise'))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const task = await ctx.db.get(args.id);
        if (!task) throw new Error("Task not found");

        if (task.user_id !== identity.subject) {
            throw new Error("Unauthorized");
        }

        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updated_at: new Date().toISOString(),
        });
        return await ctx.db.get(id);
    },
});
