/**
 * Categories Facade — delegates to catalog component.
 * Preserves api.domain.categories.* for SDK compatibility.
 */

import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

export const list = query({
    args: { tenantId: v.id("tenants"), parentId: v.optional(v.string()), isActive: v.optional(v.boolean()) },
    handler: async (ctx, { tenantId, parentId, isActive }) => {
        return ctx.runQuery(components.catalog.queries.listCategories, { tenantId: tenantId as string, parentId, isActive });
    },
});

export const get = query({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runQuery(components.catalog.queries.getCategory, { id });
    },
});

export const getByKey = query({
    args: { tenantId: v.id("tenants"), key: v.string() },
    handler: async (ctx, { tenantId, key }) => {
        return ctx.runQuery(components.catalog.queries.getCategoryByKey, { tenantId: tenantId as string, key });
    },
});

export const getTree = query({
    args: { tenantId: v.id("tenants") },
    handler: async (ctx, { tenantId }) => {
        return ctx.runQuery(components.catalog.queries.getCategoryTree, { tenantId: tenantId as string });
    },
});

export const create = mutation({
    args: {
        tenantId: v.id("tenants"), parentId: v.optional(v.string()),
        key: v.optional(v.string()), name: v.string(), slug: v.string(),
        description: v.optional(v.string()), icon: v.optional(v.string()),
        color: v.optional(v.string()), sortOrder: v.optional(v.number()),
        settings: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.catalog.mutations.createCategory, { ...args, tenantId: args.tenantId as string });
    },
});

export const update = mutation({
    args: {
        id: v.string(), name: v.optional(v.string()), description: v.optional(v.string()),
        icon: v.optional(v.string()), color: v.optional(v.string()),
        sortOrder: v.optional(v.number()), settings: v.optional(v.any()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.catalog.mutations.updateCategory, args);
    },
});

export const remove = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.catalog.mutations.removeCategory, { id });
    },
});
