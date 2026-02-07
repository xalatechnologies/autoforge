import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

/**
 * Booking Addon Facade
 * Delegates to components.addons.queries.* / components.addons.mutations.* (booking addon ops live in the addons component).
 * Preserves api.domain.bookingAddons.* paths for SDK hooks.
 */

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

// Add addon to booking
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

// Update booking addon
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

// Remove addon from booking
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

// Approve addon
export const approve = mutation({
    args: {
        id: v.string(),
        approvedBy: v.id("users"),
    },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.addons.mutations.approve, {
            id: id as any,
        });
    },
});

// Reject addon
export const reject = mutation({
    args: {
        id: v.string(),
        rejectedBy: v.id("users"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, { id, reason }) => {
        return ctx.runMutation(components.addons.mutations.reject, {
            id: id as any,
            reason,
        });
    },
});
