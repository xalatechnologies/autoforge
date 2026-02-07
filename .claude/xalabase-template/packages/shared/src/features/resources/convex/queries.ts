/**
 * Resources Component — Query Functions
 *
 * Read-only operations for resources.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// QUERIES
// =============================================================================

export const list = query({
    args: {
        tenantId: v.string(),
        categoryKey: v.optional(v.string()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, categoryKey, status, limit }) => {
        let resources = await ctx.db.query("resources")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();
        if (categoryKey) resources = resources.filter((r) => r.categoryKey === categoryKey);
        if (status) resources = resources.filter((r) => r.status === status);
        if (limit) resources = resources.slice(0, limit);
        return resources;
    },
});

/**
 * List all resources for a tenant (admin view).
 * SECURITY: Requires tenantId to prevent cross-tenant data leakage.
 * For platform-wide admin, use internal functions only.
 */
export const listAll = query({
    args: {
        tenantId: v.string(),
        categoryKey: v.optional(v.string()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, categoryKey, status, limit = 100 }) => {
        let resources = await ctx.db.query("resources")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();
        if (categoryKey) resources = resources.filter((r) => r.categoryKey === categoryKey);
        if (status) resources = resources.filter((r) => r.status === status);
        resources = resources.filter((r) => r.status !== "deleted");
        if (limit) resources = resources.slice(0, limit);
        return resources;
    },
});

/**
 * List publicly visible resources (published only, excludes deleted/archived).
 * Uses by_status index for efficiency. Default limit 100 for safety.
 */
export const listPublic = query({
    args: {
        categoryKey: v.optional(v.string()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { categoryKey, status, limit = 100 }) => {
        const resources = await ctx.db.query("resources")
            .withIndex("by_status", (q) => q.eq("status", "published"))
            .take(limit);
        let filtered = resources;
        if (categoryKey) filtered = filtered.filter((r) => r.categoryKey === categoryKey);
        if (status && status !== "published") filtered = []; // Public only shows published
        return filtered;
    },
});

export const get = query({
    args: { id: v.id("resources") },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const resource = await ctx.db.get(id);
        if (!resource) throw new Error("Resource not found");
        return resource;
    },
});

export const getBySlug = query({
    args: { tenantId: v.string(), slug: v.string() },
    returns: v.any(),
    handler: async (ctx, { tenantId, slug }) => {
        return ctx.db.query("resources")
            .withIndex("by_slug", (q) => q.eq("tenantId", tenantId).eq("slug", slug))
            .first();
    },
});

export const getBySlugPublic = query({
    args: { slug: v.string() },
    returns: v.any(),
    handler: async (ctx, { slug }) => {
        return ctx.db.query("resources")
            .filter((q) => q.and(q.eq(q.field("slug"), slug), q.eq(q.field("status"), "published")))
            .first();
    },
});
