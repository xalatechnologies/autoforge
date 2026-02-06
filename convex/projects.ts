/**
 * Project Mutations
 *
 * CRUD operations for AutoForge projects.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new project.
 */
export const create = mutation({
    args: {
        name: v.string(),
        path: v.string(),
    },
    handler: async (ctx, { name, path }) => {
        // Check if project already exists
        const existing = await ctx.db
            .query("projects")
            .withIndex("by_name", (q) => q.eq("name", name))
            .first();

        if (existing) {
            return { error: `Project '${name}' already exists`, id: existing._id };
        }

        const id = await ctx.db.insert("projects", {
            name,
            path,
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
        });

        return { success: true, id };
    },
});

/**
 * Get a project by name.
 */
export const getByName = query({
    args: { name: v.string() },
    handler: async (ctx, { name }) => {
        return await ctx.db
            .query("projects")
            .withIndex("by_name", (q) => q.eq("name", name))
            .first();
    },
});

/**
 * List all projects.
 */
export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("projects").collect();
    },
});

/**
 * Update last active timestamp.
 */
export const touch = mutation({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        await ctx.db.patch(projectId, { lastActiveAt: Date.now() });
        return { success: true };
    },
});

/**
 * Get or create a project by name.
 * Returns the project ID, creating the project if it doesn't exist.
 */
export const getOrCreate = mutation({
    args: {
        name: v.string(),
        path: v.optional(v.string()),
    },
    handler: async (ctx, { name, path }) => {
        // Check if project already exists
        const existing = await ctx.db
            .query("projects")
            .withIndex("by_name", (q) => q.eq("name", name))
            .first();

        if (existing) {
            // Update last active time
            await ctx.db.patch(existing._id, { lastActiveAt: Date.now() });
            return { id: existing._id, created: false };
        }

        // Create new project
        const id = await ctx.db.insert("projects", {
            name,
            path: path || `/projects/${name}`,
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
        });

        return { id, created: true };
    },
});
