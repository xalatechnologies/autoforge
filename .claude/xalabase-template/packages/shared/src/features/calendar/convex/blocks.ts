/**
 * Blocks Facade
 *
 * Thin facade that delegates to the bookings component's block functions.
 * Preserves the existing API path (api.domain.blocks.*) for SDK compatibility.
 * Handles:
 *   - ID type conversion (typed Id<"tenants"> -> string for component)
 *   - Data enrichment (join resource data from resources component)
 *   - Audit logging via audit component
 */

import { mutation, query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";

// =============================================================================
// BLOCK QUERIES
// =============================================================================

/**
 * List blocks for a tenant with optional filters.
 * Delegates to bookings component's listBlocks.
 */
export const list = query({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.optional(v.string()),
        status: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, { tenantId, resourceId, status, startDate, endDate }) => {
        return ctx.runQuery(components.bookings.blocks.listBlocks, {
            tenantId: tenantId as string,
            resourceId: resourceId as string | undefined,
            status,
            startDate,
            endDate,
        });
    },
});

/**
 * Get a single block by ID.
 * Enriches with resource data from resources component.
 */
export const get = query({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        const block = await ctx.runQuery(components.bookings.blocks.getBlock, { id });

        if (!block) {
            throw new Error("Block not found");
        }

        // Enrich with resource data from resources component
        const resource = (block as any).resourceId
            ? await ctx.runQuery(components.resources.queries.get, {
                  id: (block as any).resourceId,
              })
            : null;

        return {
            ...block,
            resource: resource
                ? { id: (resource as any)._id, name: (resource as any).name }
                : null,
        };
    },
});

// =============================================================================
// BLOCK MUTATIONS
// =============================================================================

/**
 * Create a block.
 * Delegates to bookings component's createBlock.
 */
export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.string(),
        title: v.string(),
        reason: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
        allDay: v.optional(v.boolean()),
        recurring: v.optional(v.boolean()),
        recurrenceRule: v.optional(v.string()),
        visibility: v.optional(v.string()),
        createdBy: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runMutation(components.bookings.blocks.createBlock, {
            tenantId: args.tenantId as string,
            resourceId: args.resourceId as string,
            title: args.title,
            reason: args.reason,
            startDate: args.startDate,
            endDate: args.endDate,
            allDay: args.allDay,
            recurring: args.recurring,
            recurrenceRule: args.recurrenceRule,
            visibility: args.visibility,
            createdBy: args.createdBy as string | undefined,
        });

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: args.tenantId as string,
            userId: args.createdBy as string | undefined,
            entityType: "block",
            entityId: result.id,
            action: "created",
            sourceComponent: "bookings",
            newState: {
                resourceId: args.resourceId as string,
                title: args.title,
                startDate: args.startDate,
                endDate: args.endDate,
            },
        });

        return result;
    },
});

/**
 * Update a block.
 */
export const update = mutation({
    args: {
        id: v.string(),
        title: v.optional(v.string()),
        reason: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        allDay: v.optional(v.boolean()),
        recurring: v.optional(v.boolean()),
        recurrenceRule: v.optional(v.string()),
        visibility: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, { id, ...updates }) => {
        return ctx.runMutation(components.bookings.blocks.updateBlock, {
            id,
            ...updates,
        });
    },
});

/**
 * Remove a block.
 */
export const remove = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.bookings.blocks.removeBlock, { id });
    },
});

// =============================================================================
// AVAILABILITY CHECKS
// =============================================================================

/**
 * Check availability for a time range.
 * Returns information about conflicting blocks and bookings.
 */
export const checkAvailability = query({
    args: {
        resourceId: v.string(),
        startTime: v.number(),
        endTime: v.number(),
    },
    handler: async (ctx, { resourceId, startTime, endTime }) => {
        return ctx.runQuery(components.bookings.blocks.checkAvailability, {
            resourceId: resourceId as string,
            startTime,
            endTime,
        });
    },
});

/**
 * Get available time slots for a specific date.
 */
export const getAvailableSlots = query({
    args: {
        resourceId: v.string(),
        date: v.number(),
        slotDurationMinutes: v.optional(v.number()),
    },
    handler: async (ctx, { resourceId, date, slotDurationMinutes }) => {
        return ctx.runQuery(components.bookings.blocks.getAvailableSlots, {
            resourceId: resourceId as string,
            date,
            slotDurationMinutes,
        });
    },
});
