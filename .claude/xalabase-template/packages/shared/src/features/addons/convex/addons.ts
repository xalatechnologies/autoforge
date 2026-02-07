import { mutation, query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";

/**
 * Addon Facade
 * Delegates to components.addons.queries.* / components.addons.mutations.* and enriches with core table data.
 * Preserves api.domain.addons.* paths for SDK hooks.
 */

// List addons for a tenant
export const list = query({
    args: {
        tenantId: v.id("tenants"),
        category: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, category, isActive }) => {
        return ctx.runQuery(components.addons.queries.list, {
            tenantId: tenantId as string,
            category,
            isActive,
        });
    },
});

// Get addon by ID
export const get = query({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runQuery(components.addons.queries.get, {
            id: id as any,
        });
    },
});

// List addons for a resource
export const listForResource = query({
    args: {
        resourceId: v.string(),
    },
    handler: async (ctx, { resourceId }) => {
        return ctx.runQuery(components.addons.queries.listForResource, {
            resourceId: resourceId as string,
        });
    },
});

// Create addon
export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        category: v.optional(v.string()),
        priceType: v.string(),
        price: v.number(),
        currency: v.string(),
        maxQuantity: v.optional(v.number()),
        requiresApproval: v.optional(v.boolean()),
        leadTimeHours: v.optional(v.number()),
        icon: v.optional(v.string()),
        images: v.optional(v.array(v.any())),
        displayOrder: v.optional(v.number()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.addons.mutations.create, {
            tenantId: args.tenantId as string,
            name: args.name,
            slug: args.slug,
            description: args.description,
            category: args.category,
            priceType: args.priceType,
            price: args.price,
            currency: args.currency,
            maxQuantity: args.maxQuantity,
            requiresApproval: args.requiresApproval,
            leadTimeHours: args.leadTimeHours,
            icon: args.icon,
            images: args.images,
            displayOrder: args.displayOrder,
            metadata: args.metadata,
        });
    },
});

// Update addon
export const update = mutation({
    args: {
        id: v.string(),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        category: v.optional(v.string()),
        priceType: v.optional(v.string()),
        price: v.optional(v.number()),
        currency: v.optional(v.string()),
        maxQuantity: v.optional(v.number()),
        requiresApproval: v.optional(v.boolean()),
        leadTimeHours: v.optional(v.number()),
        icon: v.optional(v.string()),
        images: v.optional(v.array(v.any())),
        displayOrder: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { id, ...updates }) => {
        return ctx.runMutation(components.addons.mutations.update, {
            id: id as any,
            ...updates,
        });
    },
});

// Delete addon
export const remove = mutation({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.addons.mutations.remove, {
            id: id as any,
        });
    },
});

// Add addon to resource
export const addToResource = mutation({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.string(),
        addonId: v.string(),
        isRequired: v.optional(v.boolean()),
        isRecommended: v.optional(v.boolean()),
        customPrice: v.optional(v.number()),
        displayOrder: v.optional(v.number()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.addons.mutations.addToResource, {
            tenantId: args.tenantId as string,
            resourceId: args.resourceId as string,
            addonId: args.addonId as any,
            isRequired: args.isRequired,
            isRecommended: args.isRecommended,
            customPrice: args.customPrice,
            displayOrder: args.displayOrder,
            metadata: args.metadata,
        });
    },
});

// Remove addon from resource
export const removeFromResource = mutation({
    args: {
        resourceId: v.string(),
        addonId: v.string(),
    },
    handler: async (ctx, { resourceId, addonId }) => {
        return ctx.runMutation(components.addons.mutations.removeFromResource, {
            resourceId: resourceId as string,
            addonId: addonId as any,
        });
    },
});

// =============================================================================
// BOOKING-ADDON OPERATIONS
// =============================================================================

// List addons for a booking
export const listForBooking = query({
    args: {
        bookingId: v.string(),
    },
    handler: async (ctx, { bookingId }) => {
        return ctx.runQuery(components.addons.queries.listForBooking, {
            bookingId: bookingId as string,
        });
    },
});

// Add addon to a booking
export const addToBooking = mutation({
    args: {
        tenantId: v.id("tenants"),
        bookingId: v.string(),
        addonId: v.string(),
        quantity: v.number(),
        notes: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.addons.mutations.addToBooking, {
            tenantId: args.tenantId as string,
            bookingId: args.bookingId as string,
            addonId: args.addonId as any,
            quantity: args.quantity,
            notes: args.notes,
            metadata: args.metadata,
        });
    },
});

// Update a booking addon (quantity, notes)
export const updateBookingAddon = mutation({
    args: {
        id: v.string(),
        quantity: v.optional(v.number()),
        notes: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { id, ...updates }) => {
        return ctx.runMutation(components.addons.mutations.updateBookingAddon, {
            id: id as any,
            ...updates,
        });
    },
});

// Remove addon from a booking
export const removeFromBooking = mutation({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.addons.mutations.removeFromBooking, {
            id: id as any,
        });
    },
});

// Approve a pending booking addon
export const approveBookingAddon = mutation({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.addons.mutations.approve, {
            id: id as any,
        });
    },
});

// Reject a pending booking addon
export const rejectBookingAddon = mutation({
    args: {
        id: v.string(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, { id, reason }) => {
        return ctx.runMutation(components.addons.mutations.reject, {
            id: id as any,
            reason,
        });
    },
});
