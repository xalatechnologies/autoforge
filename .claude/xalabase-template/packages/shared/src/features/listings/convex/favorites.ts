/**
 * Favorites Facade
 *
 * Thin facade delegating to the user-prefs component.
 * Preserves api.domain.favorites.* for SDK compatibility.
 * Enriches favorites with resource data from core tables.
 */

import { mutation, query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";

// =============================================================================
// QUERY FACADES
// =============================================================================

export const list = query({
    args: {
        userId: v.id("users"),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, { userId, tags }) => {
        const favorites = await ctx.runQuery(
            components.userPrefs.functions.listFavorites,
            { userId: userId as string, tags }
        );

        // Batch fetch resources from resources component
        const resourceIds = [...new Set(favorites.map((f: any) => f.resourceId).filter(Boolean))];
        const resources = await Promise.all(
            resourceIds.map((id: string) =>
                ctx.runQuery(components.resources.queries.get, { id }).catch(() => null)
            )
        );
        const resourceMap = new Map(resources.filter(Boolean).map((r: any) => [r._id, r]));

        const withResources = favorites.map((fav: any) => ({
            ...fav,
            resource: fav.resourceId ? resourceMap.get(fav.resourceId) : null,
        }));

        return withResources.filter((f: any) => f.resource);
    },
});

export const isFavorite = query({
    args: {
        userId: v.id("users"),
        resourceId: v.string(),
    },
    handler: async (ctx, { userId, resourceId }) => {
        return ctx.runQuery(components.userPrefs.functions.isFavorite, {
            userId: userId as string,
            resourceId,
        });
    },
});

// =============================================================================
// MUTATION FACADES
// =============================================================================

export const add = mutation({
    args: {
        tenantId: v.id("tenants"),
        userId: v.id("users"),
        resourceId: v.string(),
        notes: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.userPrefs.functions.addFavorite, {
            tenantId: args.tenantId as string,
            userId: args.userId as string,
            resourceId: args.resourceId,
            notes: args.notes,
            tags: args.tags,
            metadata: args.metadata,
        });
    },
});

export const update = mutation({
    args: {
        id: v.string(),
        notes: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { id, ...updates }) => {
        return ctx.runMutation(components.userPrefs.functions.updateFavorite, {
            id,
            ...updates,
        });
    },
});

export const remove = mutation({
    args: {
        userId: v.id("users"),
        resourceId: v.string(),
    },
    handler: async (ctx, { userId, resourceId }) => {
        return ctx.runMutation(components.userPrefs.functions.removeFavorite, {
            userId: userId as string,
            resourceId,
        });
    },
});

export const toggle = mutation({
    args: {
        tenantId: v.id("tenants"),
        userId: v.id("users"),
        resourceId: v.string(),
    },
    handler: async (ctx, { tenantId, userId, resourceId }) => {
        return ctx.runMutation(components.userPrefs.functions.toggleFavorite, {
            tenantId: tenantId as string,
            userId: userId as string,
            resourceId,
        });
    },
});
