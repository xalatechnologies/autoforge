/**
 * Booking Mutations
 *
 * create, update, approve, reject, cancel — booking lifecycle operations.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// BOOKING MUTATIONS
// =============================================================================

// Create a new booking
export const create = mutation({
    args: {
        tenantId: v.string(),
        resourceId: v.string(),
        userId: v.string(),
        organizationId: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.number(),
        totalPrice: v.optional(v.number()),
        currency: v.optional(v.string()),
        notes: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string(), status: v.string() }),
    handler: async (ctx, args) => {
        // Check for conflicts
        const conflicts = await ctx.db
            .query("bookings")
            .withIndex("by_resource", (q) => q.eq("resourceId", args.resourceId))
            .filter((q) =>
                q.and(
                    q.neq(q.field("status"), "cancelled"),
                    q.neq(q.field("status"), "rejected"),
                    q.or(
                        // New booking starts during existing booking
                        q.and(
                            q.gte(q.field("startTime"), args.startTime),
                            q.lt(q.field("startTime"), args.endTime)
                        ),
                        // New booking ends during existing booking
                        q.and(
                            q.gt(q.field("endTime"), args.startTime),
                            q.lte(q.field("endTime"), args.endTime)
                        ),
                        // New booking contains existing booking
                        q.and(
                            q.lte(q.field("startTime"), args.startTime),
                            q.gte(q.field("endTime"), args.endTime)
                        )
                    )
                )
            )
            .collect();

        if (conflicts.length > 0) {
            throw new Error("Time slot conflicts with existing bookings");
        }

        // Resource lookup removed — facade handles requiresApproval check.
        // Status defaults to "pending"; facade may patch to "confirmed" afterward.
        const initialStatus = "pending";

        const bookingId = await ctx.db.insert("bookings", {
            tenantId: args.tenantId,
            resourceId: args.resourceId,
            userId: args.userId,
            organizationId: args.organizationId,
            startTime: args.startTime,
            endTime: args.endTime,
            status: initialStatus,
            totalPrice: args.totalPrice || 0,
            currency: args.currency || "NOK",
            notes: args.notes,
            metadata: args.metadata || {},
            version: 1,
            submittedAt: Date.now(),
        });

        // Audit removed — handled by facade via audit component

        return { id: bookingId as string, status: initialStatus };
    },
});

// Update booking
export const update = mutation({
    args: {
        id: v.id("bookings"),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        notes: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, ...updates }) => {
        const booking = await ctx.db.get(id);
        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.status === "cancelled") {
            throw new Error("Cannot update cancelled booking");
        }

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(id, {
            ...filteredUpdates,
            version: booking.version + 1,
        });

        return { success: true };
    },
});

// Approve a booking
export const approve = mutation({
    args: {
        id: v.id("bookings"),
        approvedBy: v.string(),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, approvedBy }) => {
        const booking = await ctx.db.get(id);
        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.status !== "pending") {
            throw new Error("Only pending bookings can be approved");
        }

        await ctx.db.patch(id, {
            status: "confirmed",
            approvedBy,
            approvedAt: Date.now(),
            version: booking.version + 1,
        });

        // Audit removed — handled by facade via audit component

        return { success: true };
    },
});

// Reject a booking
export const reject = mutation({
    args: {
        id: v.id("bookings"),
        rejectedBy: v.string(),
        reason: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, rejectedBy, reason }) => {
        const booking = await ctx.db.get(id);
        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.status !== "pending") {
            throw new Error("Only pending bookings can be rejected");
        }

        await ctx.db.patch(id, {
            status: "rejected",
            rejectionReason: reason,
            version: booking.version + 1,
        });

        // Audit removed — handled by facade via audit component

        return { success: true };
    },
});

// Cancel a booking
export const cancel = mutation({
    args: {
        id: v.id("bookings"),
        cancelledBy: v.string(),
        reason: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, cancelledBy, reason }) => {
        const booking = await ctx.db.get(id);
        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.status === "cancelled") {
            throw new Error("Booking is already cancelled");
        }

        await ctx.db.patch(id, {
            status: "cancelled",
            version: booking.version + 1,
        });

        // Audit removed — handled by facade via audit component

        return { success: true };
    },
});
