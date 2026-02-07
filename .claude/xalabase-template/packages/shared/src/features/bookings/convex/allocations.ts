/**
 * Allocation Functions + Import Functions (data migration)
 *
 * listAllocations, getAllocation, createAllocation, removeAllocation,
 * importBooking, importBlock, importAllocation, importBookingConflict, importRentalAgreement.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// ALLOCATION QUERIES
// =============================================================================

/** List allocations for a tenant with optional filters */
export const listAllocations = query({
    args: {
        tenantId: v.string(),
        resourceId: v.optional(v.string()),
        status: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, resourceId, status, startDate, endDate }) => {
        let allocations;

        if (resourceId) {
            allocations = await ctx.db
                .query("allocations")
                .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
                .collect();
            allocations = allocations.filter((a) => a.tenantId === tenantId);
        } else {
            allocations = await ctx.db
                .query("allocations")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
                .collect();
        }

        if (status) {
            allocations = allocations.filter((a) => a.status === status);
        }
        if (startDate) {
            allocations = allocations.filter((a) => a.endTime >= startDate);
        }
        if (endDate) {
            allocations = allocations.filter((a) => a.startTime <= endDate);
        }

        allocations.sort((a, b) => a.startTime - b.startTime);

        return allocations;
    },
});

/** Get a single allocation by ID */
export const getAllocation = query({
    args: { id: v.id("allocations") },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const allocation = await ctx.db.get(id);
        if (!allocation) {
            throw new Error("Allocation not found");
        }
        return allocation;
    },
});

// =============================================================================
// ALLOCATION MUTATIONS
// =============================================================================

/** Create an allocation */
export const createAllocation = mutation({
    args: {
        tenantId: v.string(),
        organizationId: v.optional(v.string()),
        resourceId: v.string(),
        title: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        bookingId: v.optional(v.id("bookings")),
        userId: v.optional(v.string()),
        notes: v.optional(v.string()),
        recurring: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        if (args.startTime >= args.endTime) {
            throw new Error("Start time must be before end time");
        }

        const allocationId = await ctx.db.insert("allocations", {
            tenantId: args.tenantId,
            organizationId: args.organizationId,
            resourceId: args.resourceId,
            title: args.title,
            startTime: args.startTime,
            endTime: args.endTime,
            status: "active",
            bookingId: args.bookingId,
            userId: args.userId,
            notes: args.notes,
            recurring: args.recurring ?? {},
            metadata: args.metadata ?? {},
        });

        return { id: allocationId as string };
    },
});

/** Remove (delete) an allocation */
export const removeAllocation = mutation({
    args: { id: v.id("allocations") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const allocation = await ctx.db.get(id);
        if (!allocation) {
            throw new Error("Allocation not found");
        }
        await ctx.db.delete(id);
        return { success: true };
    },
});

// =============================================================================
// IMPORT FUNCTIONS (data migration)
// =============================================================================

/**
 * Import a booking record from the legacy table.
 * Used during data migration.
 */
export const importBooking = mutation({
    args: {
        tenantId: v.string(),
        resourceId: v.string(),
        userId: v.string(),
        organizationId: v.optional(v.string()),
        status: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        totalPrice: v.number(),
        currency: v.string(),
        notes: v.optional(v.string()),
        metadata: v.optional(v.any()),
        version: v.number(),
        submittedAt: v.optional(v.number()),
        approvedBy: v.optional(v.string()),
        approvedAt: v.optional(v.number()),
        rejectionReason: v.optional(v.string()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("bookings", { ...args, metadata: args.metadata ?? {} });
        return { id: id as string };
    },
});

/**
 * Import a block record from the legacy table.
 * Used during data migration.
 */
export const importBlock = mutation({
    args: {
        tenantId: v.string(),
        resourceId: v.string(),
        title: v.string(),
        reason: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
        allDay: v.boolean(),
        recurring: v.boolean(),
        recurrenceRule: v.optional(v.string()),
        visibility: v.string(),
        status: v.string(),
        createdBy: v.optional(v.string()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("blocks", { ...args });
        return { id: id as string };
    },
});

/**
 * Import an allocation record from the legacy table.
 * Used during data migration.
 */
export const importAllocation = mutation({
    args: {
        tenantId: v.string(),
        organizationId: v.optional(v.string()),
        resourceId: v.string(),
        title: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        status: v.string(),
        bookingId: v.optional(v.id("bookings")),
        userId: v.optional(v.string()),
        notes: v.optional(v.string()),
        recurring: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("allocations", {
            ...args,
            recurring: args.recurring ?? {},
            metadata: args.metadata ?? {},
        });
        return { id: id as string };
    },
});

/**
 * Import a booking conflict record from the legacy table.
 * Used during data migration.
 */
export const importBookingConflict = mutation({
    args: {
        tenantId: v.string(),
        resourceId: v.string(),
        bookingId: v.id("bookings"),
        conflictingBookingId: v.id("bookings"),
        conflictType: v.string(),
        severity: v.string(),
        description: v.optional(v.string()),
        overlapStart: v.optional(v.number()),
        overlapEnd: v.optional(v.number()),
        resolvedAt: v.optional(v.number()),
        resolvedBy: v.optional(v.string()),
        resolution: v.optional(v.string()),
        resolutionNotes: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("bookingConflicts", { ...args, metadata: args.metadata ?? {} });
        return { id: id as string };
    },
});

/**
 * Import a rental agreement record from the legacy table.
 * Used during data migration.
 */
export const importRentalAgreement = mutation({
    args: {
        tenantId: v.string(),
        bookingId: v.optional(v.id("bookings")),
        resourceId: v.string(),
        userId: v.string(),
        agreementType: v.string(),
        agreementVersion: v.string(),
        agreementText: v.string(),
        isSigned: v.boolean(),
        signatureData: v.optional(v.any()),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        metadata: v.optional(v.any()),
        signedAt: v.optional(v.number()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("rentalAgreements", { ...args, metadata: args.metadata ?? {} });
        return { id: id as string };
    },
});
