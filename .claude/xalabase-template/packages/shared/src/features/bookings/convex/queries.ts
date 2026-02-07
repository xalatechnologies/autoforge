/**
 * Booking Queries
 *
 * list, get, calendar — read-only booking lookups.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// BOOKING QUERIES
// =============================================================================

// List bookings for a tenant
export const list = query({
    args: {
        tenantId: v.string(),
        resourceId: v.optional(v.string()),
        userId: v.optional(v.string()),
        status: v.optional(v.string()),
        startAfter: v.optional(v.number()),
        startBefore: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 100;
        let bookings = await ctx.db
            .query("bookings")
            .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
            .collect();

        // Apply filters
        if (args.resourceId) {
            bookings = bookings.filter((b) => b.resourceId === args.resourceId);
        }

        if (args.userId) {
            bookings = bookings.filter((b) => b.userId === args.userId);
        }

        if (args.status) {
            bookings = bookings.filter((b) => b.status === args.status);
        }

        if (args.startAfter) {
            bookings = bookings.filter((b) => b.startTime >= args.startAfter!);
        }

        if (args.startBefore) {
            bookings = bookings.filter((b) => b.startTime <= args.startBefore!);
        }

        // Sort by start time
        bookings.sort((a, b) => a.startTime - b.startTime);

        return bookings.slice(0, limit);
    },
});

// Get a single booking
// NOTE: Domain version enriched with resource/user/addons — that enrichment
// happens in the facade layer, not here.
export const get = query({
    args: {
        id: v.id("bookings"),
    },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const booking = await ctx.db.get(id);
        if (!booking) {
            throw new Error("Booking not found");
        }

        return booking;
    },
});

// Get bookings for calendar view
export const calendar = query({
    args: {
        tenantId: v.string(),
        resourceId: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
    },
    returns: v.any(),
    handler: async (ctx, { tenantId, resourceId, startDate, endDate }) => {
        let bookings = await ctx.db
            .query("bookings")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .filter((q) =>
                q.and(
                    q.neq(q.field("status"), "cancelled"),
                    q.neq(q.field("status"), "rejected"),
                    q.gte(q.field("startTime"), startDate),
                    q.lte(q.field("endTime"), endDate)
                )
            )
            .collect();

        if (resourceId) {
            bookings = bookings.filter((b) => b.resourceId === resourceId);
        }

        // Get blocks for the same period
        let blocks = await ctx.db
            .query("blocks")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "active"),
                    q.gte(q.field("startDate"), startDate),
                    q.lte(q.field("endDate"), endDate)
                )
            )
            .collect();

        if (resourceId) {
            blocks = blocks.filter((b) => b.resourceId === resourceId);
        }

        return {
            bookings,
            blocks,
        };
    },
});
