/**
 * Seasons Facade
 *
 * Thin facade that delegates to the seasons component.
 * Preserves api.domain.seasons.* for SDK compatibility.
 * Handles:
 *   - ID type conversion (typed Id<"tenants"> / Id<"seasons"> -> string for component)
 *   - Audit logging via audit component
 */

import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

// =============================================================================
// QUERY FACADES
// =============================================================================

/**
 * List seasons for a tenant, optionally filtered by status or active flag.
 */
export const list = query({
    args: {
        tenantId: v.id("tenants"),
        status: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, status, isActive }) => {
        return ctx.runQuery(components.seasons.queries.list, {
            tenantId: tenantId as string,
            status,
            isActive,
        });
    },
});

/**
 * Get a single season by ID, including application stats.
 */
export const get = query({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runQuery(components.seasons.queries.get, {
            id,
        });
    },
});

// =============================================================================
// MUTATION FACADES
// =============================================================================

/**
 * Create a new season.
 */
export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        name: v.string(),
        description: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
        applicationStartDate: v.optional(v.number()),
        applicationEndDate: v.optional(v.number()),
        type: v.string(),
        settings: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runMutation(
            components.seasons.mutations.create,
            {
                tenantId: args.tenantId as string,
                name: args.name,
                description: args.description,
                startDate: args.startDate,
                endDate: args.endDate,
                applicationStartDate: args.applicationStartDate,
                applicationEndDate: args.applicationEndDate,
                type: args.type,
                settings: args.settings,
                metadata: args.metadata,
            }
        );

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: args.tenantId as string,
            userId: "",
            entityType: "season",
            entityId: result.id,
            action: "created",
            newState: { name: args.name, type: args.type },
            sourceComponent: "seasons",
        });

        return result;
    },
});

/**
 * Update a season.
 * NOTE: SDK also passes status in updates.
 */
export const update = mutation({
    args: {
        id: v.string(),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        applicationStartDate: v.optional(v.number()),
        applicationEndDate: v.optional(v.number()),
        status: v.optional(v.string()),
        settings: v.optional(v.any()),
        metadata: v.optional(v.any()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { id, ...updates }) => {
        return ctx.runMutation(components.seasons.mutations.update, {
            id,
            ...updates,
        });
    },
});

/**
 * Publish a season (open for applications).
 */
export const publish = mutation({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.seasons.mutations.publish, {
            id,
        });
    },
});

/**
 * Close a season (stop accepting applications).
 */
export const close = mutation({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.seasons.mutations.close, {
            id,
        });
    },
});

/**
 * Remove a season. Fails if there are existing applications.
 */
export const remove = mutation({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.seasons.mutations.remove, {
            id,
        });
    },
});
