/**
 * Block Functions
 *
 * listBlocks, getBlock, createBlock, updateBlock, removeBlock,
 * checkAvailability, getAvailableSlots — block management and availability checks.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// BLOCK QUERIES (from convex/domain/blocks.ts)
// =============================================================================

// List blocks for a resource
export const listBlocks = query({
    args: {
        tenantId: v.string(),
        resourceId: v.optional(v.string()),
        status: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, resourceId, status, startDate, endDate }) => {
        let blocks = await ctx.db
            .query("blocks")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();

        if (resourceId) {
            blocks = blocks.filter((b) => b.resourceId === resourceId);
        }

        if (status) {
            blocks = blocks.filter((b) => b.status === status);
        }

        if (startDate) {
            blocks = blocks.filter((b) => b.endDate >= startDate);
        }

        if (endDate) {
            blocks = blocks.filter((b) => b.startDate <= endDate);
        }

        return blocks;
    },
});

// Get block by ID
// NOTE: Domain version enriched with resource — that enrichment
// happens in the facade layer, not here.
export const getBlock = query({
    args: {
        id: v.id("blocks"),
    },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const block = await ctx.db.get(id);
        if (!block) {
            throw new Error("Block not found");
        }

        return block;
    },
});

// =============================================================================
// BLOCK MUTATIONS
// =============================================================================

// Create block
export const createBlock = mutation({
    args: {
        tenantId: v.string(),
        resourceId: v.string(),
        title: v.string(),
        reason: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
        allDay: v.optional(v.boolean()),
        recurring: v.optional(v.boolean()),
        recurrenceRule: v.optional(v.string()),
        visibility: v.optional(v.string()),
        createdBy: v.optional(v.string()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        // Resource validation removed — facade handles it

        const blockId = await ctx.db.insert("blocks", {
            tenantId: args.tenantId,
            resourceId: args.resourceId,
            title: args.title,
            reason: args.reason,
            startDate: args.startDate,
            endDate: args.endDate,
            allDay: args.allDay ?? true,
            recurring: args.recurring ?? false,
            recurrenceRule: args.recurrenceRule,
            visibility: args.visibility ?? "public",
            status: "active",
            createdBy: args.createdBy,
        });

        return { id: blockId as string };
    },
});

// Update block
export const updateBlock = mutation({
    args: {
        id: v.id("blocks"),
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
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, ...updates }) => {
        const block = await ctx.db.get(id);
        if (!block) {
            throw new Error("Block not found");
        }

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(id, filteredUpdates);

        return { success: true };
    },
});

// Delete block
export const removeBlock = mutation({
    args: {
        id: v.id("blocks"),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const block = await ctx.db.get(id);
        if (!block) {
            throw new Error("Block not found");
        }

        await ctx.db.delete(id);

        return { success: true };
    },
});

// =============================================================================
// AVAILABILITY CHECKS
// =============================================================================

// Check availability for a time range
export const checkAvailability = query({
    args: {
        resourceId: v.string(),
        startTime: v.number(),
        endTime: v.number(),
    },
    returns: v.any(),
    handler: async (ctx, { resourceId, startTime, endTime }) => {
        // Check for overlapping blocks
        const blocks = await ctx.db
            .query("blocks")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "active"),
                    q.lte(q.field("startDate"), endTime),
                    q.gte(q.field("endDate"), startTime)
                )
            )
            .collect();

        // Check for overlapping bookings
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .filter((q) =>
                q.and(
                    q.neq(q.field("status"), "cancelled"),
                    q.neq(q.field("status"), "rejected"),
                    q.lte(q.field("startTime"), endTime),
                    q.gte(q.field("endTime"), startTime)
                )
            )
            .collect();

        const isAvailable = blocks.length === 0 && bookings.length === 0;

        return {
            isAvailable,
            conflicts: {
                blocks: blocks.map((b) => ({
                    id: b._id,
                    title: b.title,
                    startDate: b.startDate,
                    endDate: b.endDate,
                })),
                bookings: bookings.map((b) => ({
                    id: b._id,
                    startTime: b.startTime,
                    endTime: b.endTime,
                    status: b.status,
                })),
            },
        };
    },
});

// Get available time slots for a date
export const getAvailableSlots = query({
    args: {
        resourceId: v.string(),
        date: v.number(), // Start of day timestamp
        slotDurationMinutes: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { resourceId, date, slotDurationMinutes = 60 }) => {
        const dayStart = date;
        const dayEnd = date + 24 * 60 * 60 * 1000; // End of day

        // Get all blocks and bookings for the day
        const blocks = await ctx.db
            .query("blocks")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "active"),
                    q.lte(q.field("startDate"), dayEnd),
                    q.gte(q.field("endDate"), dayStart)
                )
            )
            .collect();

        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .filter((q) =>
                q.and(
                    q.neq(q.field("status"), "cancelled"),
                    q.neq(q.field("status"), "rejected"),
                    q.lte(q.field("startTime"), dayEnd),
                    q.gte(q.field("endTime"), dayStart)
                )
            )
            .collect();

        // Combine all unavailable periods
        const unavailable: { start: number; end: number }[] = [
            ...blocks.map((b) => ({ start: b.startDate, end: b.endDate })),
            ...bookings.map((b) => ({ start: b.startTime, end: b.endTime })),
        ];

        // Generate time slots
        const slotDuration = slotDurationMinutes * 60 * 1000;
        const slots: { start: number; end: number; available: boolean }[] = [];

        // Assume business hours 8:00 - 20:00
        const businessStart = dayStart + 8 * 60 * 60 * 1000;
        const businessEnd = dayStart + 20 * 60 * 60 * 1000;

        for (let slotStart = businessStart; slotStart < businessEnd; slotStart += slotDuration) {
            const slotEnd = slotStart + slotDuration;

            const isUnavailable = unavailable.some(
                (u) => u.start < slotEnd && u.end > slotStart
            );

            slots.push({
                start: slotStart,
                end: slotEnd,
                available: !isUnavailable,
            });
        }

        return slots;
    },
});
