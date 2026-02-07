/**
 * Seasons Component — Mutation Functions
 *
 * Write operations for seasons, applications, allocations, and leases.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// SEASON MUTATIONS (CRUD + LIFECYCLE)
// =============================================================================

/**
 * Create season
 */
export const create = mutation({
    args: {
        tenantId: v.string(),
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
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const seasonId = await ctx.db.insert("seasons", {
            tenantId: args.tenantId,
            name: args.name,
            description: args.description,
            startDate: args.startDate,
            endDate: args.endDate,
            applicationStartDate: args.applicationStartDate,
            applicationEndDate: args.applicationEndDate,
            status: "draft",
            type: args.type,
            settings: args.settings || {},
            metadata: args.metadata || {},
            isActive: false,
        });

        return { id: seasonId as string };
    },
});

/**
 * Update season
 */
export const update = mutation({
    args: {
        id: v.id("seasons"),
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
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, ...updates }) => {
        const season = await ctx.db.get(id);
        if (!season) {
            throw new Error("Season not found");
        }

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(id, filteredUpdates);

        return { success: true };
    },
});

/**
 * Delete season
 */
export const remove = mutation({
    args: {
        id: v.id("seasons"),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const season = await ctx.db.get(id);
        if (!season) {
            throw new Error("Season not found");
        }

        // Check for applications
        const applications = await ctx.db
            .query("seasonApplications")
            .withIndex("by_season", (q) => q.eq("seasonId", id))
            .first();

        if (applications) {
            throw new Error("Cannot delete season with applications");
        }

        await ctx.db.delete(id);

        return { success: true };
    },
});

/**
 * Publish season (open for applications)
 */
export const publish = mutation({
    args: {
        id: v.id("seasons"),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const season = await ctx.db.get(id);
        if (!season) {
            throw new Error("Season not found");
        }

        await ctx.db.patch(id, {
            status: "published",
            isActive: true,
        });

        return { success: true };
    },
});

/**
 * Close season (stop accepting applications)
 */
export const close = mutation({
    args: {
        id: v.id("seasons"),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const season = await ctx.db.get(id);
        if (!season) {
            throw new Error("Season not found");
        }

        await ctx.db.patch(id, {
            status: "closed",
        });

        return { success: true };
    },
});

// =============================================================================
// SEASON APPLICATION MUTATIONS
// =============================================================================

/**
 * Submit application
 */
export const submitApplication = mutation({
    args: {
        tenantId: v.string(),
        seasonId: v.id("seasons"),
        userId: v.string(),
        organizationId: v.optional(v.string()),
        resourceId: v.optional(v.string()),
        weekday: v.optional(v.number()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        applicantName: v.optional(v.string()),
        applicantEmail: v.optional(v.string()),
        applicantPhone: v.optional(v.string()),
        applicationData: v.optional(v.any()),
        notes: v.optional(v.string()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const season = await ctx.db.get(args.seasonId);
        if (!season) {
            throw new Error("Season not found");
        }

        if (season.status !== "published") {
            throw new Error("Season is not accepting applications");
        }

        // Check application deadline
        if (season.applicationEndDate && Date.now() > season.applicationEndDate) {
            throw new Error("Application deadline has passed");
        }

        const applicationId = await ctx.db.insert("seasonApplications", {
            tenantId: args.tenantId,
            seasonId: args.seasonId,
            userId: args.userId,
            organizationId: args.organizationId,
            resourceId: args.resourceId,
            weekday: args.weekday,
            startTime: args.startTime,
            endTime: args.endTime,
            priority: 0, // Will be calculated later
            status: "pending",
            applicantName: args.applicantName,
            applicantEmail: args.applicantEmail,
            applicantPhone: args.applicantPhone,
            applicationData: args.applicationData || {},
            notes: args.notes,
            metadata: {},
        });

        return { id: applicationId as string };
    },
});

/**
 * Review application (approve/reject)
 */
export const reviewApplication = mutation({
    args: {
        id: v.id("seasonApplications"),
        status: v.union(v.literal("approved"), v.literal("rejected"), v.literal("waitlist")),
        reviewedBy: v.string(),
        rejectionReason: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, status, reviewedBy, rejectionReason, notes }) => {
        const application = await ctx.db.get(id);
        if (!application) {
            throw new Error("Application not found");
        }

        await ctx.db.patch(id, {
            status,
            reviewedBy,
            reviewedAt: Date.now(),
            rejectionReason: status === "rejected" ? rejectionReason : undefined,
            notes: notes || application.notes,
        });

        return { success: true };
    },
});

// =============================================================================
// ALLOCATION MUTATIONS (Priority Rules)
// =============================================================================

/**
 * Create allocation (priority rule)
 */
export const createAllocation = mutation({
    args: {
        tenantId: v.string(),
        seasonId: v.optional(v.id("seasons")),
        name: v.string(),
        description: v.optional(v.string()),
        rules: v.array(v.any()),
        priority: v.number(),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        // Verify season exists if provided
        if (args.seasonId) {
            const season = await ctx.db.get(args.seasonId);
            if (!season) {
                throw new Error("Season not found");
            }
        }

        const ruleId = await ctx.db.insert("priorityRules", {
            tenantId: args.tenantId,
            seasonId: args.seasonId,
            name: args.name,
            description: args.description,
            rules: args.rules,
            priority: args.priority,
            isActive: true,
        });

        return { id: ruleId as string };
    },
});

/**
 * Update allocation (priority rule)
 */
export const updateAllocation = mutation({
    args: {
        id: v.id("priorityRules"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        rules: v.optional(v.array(v.any())),
        priority: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, ...updates }) => {
        const rule = await ctx.db.get(id);
        if (!rule) {
            throw new Error("Priority rule not found");
        }

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(id, filteredUpdates);

        return { success: true };
    },
});

/**
 * Delete allocation (priority rule)
 */
export const removeAllocation = mutation({
    args: {
        id: v.id("priorityRules"),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const rule = await ctx.db.get(id);
        if (!rule) {
            throw new Error("Priority rule not found");
        }

        await ctx.db.delete(id);

        return { success: true };
    },
});

// =============================================================================
// SEASONAL LEASE MUTATIONS
// =============================================================================

/**
 * Create seasonal lease
 */
export const createLease = mutation({
    args: {
        tenantId: v.string(),
        resourceId: v.string(),
        organizationId: v.string(),
        startDate: v.number(),
        endDate: v.number(),
        weekdays: v.array(v.number()),
        startTime: v.string(),
        endTime: v.string(),
        totalPrice: v.number(),
        currency: v.string(),
        notes: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const leaseId = await ctx.db.insert("seasonalLeases", {
            tenantId: args.tenantId,
            resourceId: args.resourceId,
            organizationId: args.organizationId,
            startDate: args.startDate,
            endDate: args.endDate,
            weekdays: args.weekdays,
            startTime: args.startTime,
            endTime: args.endTime,
            status: "active",
            totalPrice: args.totalPrice,
            currency: args.currency,
            notes: args.notes,
            metadata: args.metadata || {},
        });

        return { id: leaseId as string };
    },
});

/**
 * Cancel seasonal lease
 */
export const cancelLease = mutation({
    args: {
        id: v.id("seasonalLeases"),
        reason: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, reason }) => {
        const lease = await ctx.db.get(id);
        if (!lease) {
            throw new Error("Lease not found");
        }

        await ctx.db.patch(id, {
            status: "cancelled",
            metadata: {
                ...(lease.metadata as Record<string, unknown>),
                cancelledAt: Date.now(),
                cancellationReason: reason,
            },
        });

        return { success: true };
    },
});
