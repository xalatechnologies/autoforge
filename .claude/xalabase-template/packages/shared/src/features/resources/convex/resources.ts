/**
 * Resources Facade — delegates to the resources component.
 * Preserves api.domain.resources.* for SDK compatibility.
 *
 * Handles:
 * - ID conversion (v.id("tenants") -> string for component)
 * - Enrichment: get() enriches with amenities, addons, pricing from other components
 * - Cascade: archive() cancels bookings and deactivates blocks
 * - Clone: clone() copies related data (amenities, pricing, addons) across components
 */

import { mutation, query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";

// =============================================================================
// QUERIES
// =============================================================================

export const list = query({
    args: {
        tenantId: v.id("tenants"),
        categoryKey: v.optional(v.string()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { tenantId, categoryKey, status, limit }) => {
        return ctx.runQuery(components.resources.queries.list, {
            tenantId: tenantId as string, categoryKey, status, limit,
        });
    },
});

export const listAll = query({
    args: {
        tenantId: v.id("tenants"),
        categoryKey: v.optional(v.string()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { tenantId, ...rest }) => {
        return ctx.runQuery(components.resources.queries.listAll, {
            tenantId: tenantId as string,
            ...rest,
        });
    },
});

export const listPublic = query({
    args: {
        categoryKey: v.optional(v.string()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return ctx.runQuery(components.resources.queries.listPublic, args);
    },
});

export const get = query({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        // Get base resource from component
        const resource = await ctx.runQuery(components.resources.queries.get, { id: id as string });

        // Enrich with related data from other components
        const amenities = await ctx.runQuery(components.catalog.queries.listForResource, {
            resourceId: id as string,
        });
        const addons = await ctx.runQuery(components.addons.queries.listForResource, {
            resourceId: id as string,
        });
        const pricing = await ctx.runQuery(components.pricing.queries.listForResource, {
            resourceId: id as string,
        });

        return { ...resource, amenities, addons, pricing };
    },
});

export const getBySlug = query({
    args: { tenantId: v.id("tenants"), slug: v.string() },
    handler: async (ctx, { tenantId, slug }) => {
        return ctx.runQuery(components.resources.queries.getBySlug, {
            tenantId: tenantId as string, slug,
        });
    },
});

export const getBySlugPublic = query({
    args: { slug: v.string() },
    handler: async (ctx, { slug }) => {
        return ctx.runQuery(components.resources.queries.getBySlugPublic, { slug });
    },
});

// =============================================================================
// MUTATIONS
// =============================================================================

export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        organizationId: v.optional(v.id("organizations")),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        categoryKey: v.string(),
        timeMode: v.optional(v.string()),
        status: v.optional(v.string()),
        requiresApproval: v.optional(v.boolean()),
        capacity: v.optional(v.number()),
        images: v.optional(v.array(v.any())),
        pricing: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runMutation(components.resources.mutations.create, {
            tenantId: args.tenantId as string,
            organizationId: args.organizationId as string | undefined,
            name: args.name, slug: args.slug, description: args.description,
            categoryKey: args.categoryKey, timeMode: args.timeMode,
            status: args.status, requiresApproval: args.requiresApproval,
            capacity: args.capacity, images: args.images,
            pricing: args.pricing, metadata: args.metadata,
        });

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: args.tenantId as string,
            entityType: "resource", entityId: result.id,
            action: "created", sourceComponent: "resources",
            newState: { name: args.name, slug: args.slug },
        });

        return result;
    },
});

export const update = mutation({
    args: {
        id: v.string(),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        status: v.optional(v.string()),
        requiresApproval: v.optional(v.boolean()),
        capacity: v.optional(v.number()),
        images: v.optional(v.array(v.any())),
        pricing: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runMutation(components.resources.mutations.update, args);

        // Audit
        const resource = await ctx.runQuery(components.resources.queries.get, { id: args.id as string });
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: (resource as any).tenantId,
            entityType: "resource",
            entityId: args.id as string,
            action: "updated",
            sourceComponent: "resources",
        });

        return result;
    },
});

export const remove = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        // Get resource before removal for audit
        const resource = await ctx.runQuery(components.resources.queries.get, { id: id as string });

        const result = await ctx.runMutation(components.resources.mutations.remove, { id: id as string });

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: (resource as any).tenantId,
            entityType: "resource",
            entityId: id as string,
            action: "removed",
            sourceComponent: "resources",
        });

        return result;
    },
});

export const publish = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        const result = await ctx.runMutation(components.resources.mutations.publish, { id: id as string });

        // Audit
        const resource = await ctx.runQuery(components.resources.queries.get, { id: id as string });
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: (resource as any).tenantId,
            entityType: "resource",
            entityId: id as string,
            action: "published",
            sourceComponent: "resources",
        });

        return result;
    },
});

export const unpublish = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        const result = await ctx.runMutation(components.resources.mutations.unpublish, { id: id as string });

        // Audit
        const resource = await ctx.runQuery(components.resources.queries.get, { id: id as string });
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: (resource as any).tenantId,
            entityType: "resource",
            entityId: id as string,
            action: "unpublished",
            sourceComponent: "resources",
        });

        return result;
    },
});

/**
 * Archive — delegates to component for status change, then cascades to bookings/blocks.
 */
export const archive = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        // Archive the resource in the component
        await ctx.runMutation(components.resources.mutations.archive, { id: id as string });

        // Get tenantId from the resource for component queries
        const resource = await ctx.runQuery(components.resources.queries.get, { id: id as string });
        const tenantId = (resource as any).tenantId;

        const now = Date.now();

        // Cascade: cancel future pending/confirmed bookings via bookings component
        const allBookings = await ctx.runQuery(components.bookings.queries.list, {
            tenantId,
            resourceId: id as string,
        });
        for (const booking of (allBookings as any[])) {
            if (booking.startTime > now && (booking.status === "pending" || booking.status === "confirmed")) {
                await ctx.runMutation(components.bookings.mutations.cancel, {
                    id: booking._id,
                    cancelledBy: "system",
                    reason: "resource_archived",
                });
            }
        }

        // Cascade: deactivate future active blocks via bookings component
        const allBlocks = await ctx.runQuery(components.bookings.blocks.listBlocks, {
            tenantId,
            resourceId: id as string,
        });
        for (const block of (allBlocks as any[])) {
            if (block.endDate > now && block.status === "active") {
                await ctx.runMutation(components.bookings.blocks.updateBlock, {
                    id: block._id,
                    status: "inactive",
                });
            }
        }

        return { success: true };
    },
});

export const restore = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.resources.mutations.restore, { id: id as string });
    },
});

/**
 * Clone — delegates base resource to component, then clones related data across components.
 */
export const clone = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        // Clone the base resource in the component
        const result = await ctx.runMutation(components.resources.mutations.cloneResource, {
            id: id as string,
        });
        const newResourceId = result.id;

        // Clone resource amenities via catalog component
        const amenities = await ctx.runQuery(components.catalog.queries.listForResource, {
            resourceId: id as string,
        });
        for (const a of amenities as any[]) {
            if (a.amenityId) {
                await ctx.runMutation(components.catalog.mutations.addToResource, {
                    tenantId: a.tenantId, resourceId: newResourceId,
                    amenityId: a.amenityId, quantity: a.quantity,
                    notes: a.notes, isIncluded: a.isIncluded,
                    additionalCost: a.additionalCost, metadata: a.metadata,
                });
            }
        }

        // Clone resource addons via addons component
        const addons = await ctx.runQuery(components.addons.queries.listForResource, {
            resourceId: id as string,
        });
        for (const a of addons as any[]) {
            if (a.addonId) {
                await ctx.runMutation(components.addons.mutations.addToResource, {
                    tenantId: a.tenantId, resourceId: newResourceId,
                    addonId: a.addonId, isRequired: a.isRequired,
                    isRecommended: a.isRecommended, customPrice: a.customPrice,
                    displayOrder: a.displayOrder,
                    metadata: a.metadata,
                });
            }
        }

        return { id: newResourceId, slug: result.slug };
    },
});
