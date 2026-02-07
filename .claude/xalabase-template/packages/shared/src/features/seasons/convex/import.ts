/**
 * Seasons Component — Import Functions
 *
 * Data migration helpers for seasons, applications, leases, and priority rules.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Import a season record from the legacy table.
 * Used during data migration.
 */
export const importSeason = mutation({
    args: {
        tenantId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
        applicationStartDate: v.optional(v.number()),
        applicationEndDate: v.optional(v.number()),
        status: v.string(),
        type: v.string(),
        settings: v.optional(v.any()),
        metadata: v.optional(v.any()),
        isActive: v.boolean(),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("seasons", {
            ...args,
            settings: args.settings ?? {},
            metadata: args.metadata ?? {},
        });
        return { id: id as string };
    },
});

/**
 * Import a season application record from the legacy table.
 * Used during data migration.
 */
export const importSeasonApplication = mutation({
    args: {
        tenantId: v.string(),
        seasonId: v.id("seasons"),
        userId: v.string(),
        organizationId: v.optional(v.string()),
        resourceId: v.optional(v.string()),
        weekday: v.optional(v.number()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        priority: v.number(),
        status: v.string(),
        applicantName: v.optional(v.string()),
        applicantEmail: v.optional(v.string()),
        applicantPhone: v.optional(v.string()),
        applicationData: v.optional(v.any()),
        notes: v.optional(v.string()),
        rejectionReason: v.optional(v.string()),
        reviewedBy: v.optional(v.string()),
        reviewedAt: v.optional(v.number()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("seasonApplications", {
            ...args,
            applicationData: args.applicationData ?? {},
            metadata: args.metadata ?? {},
        });
        return { id: id as string };
    },
});

/**
 * Import a seasonal lease record from the legacy table.
 * Used during data migration.
 */
export const importSeasonalLease = mutation({
    args: {
        tenantId: v.string(),
        resourceId: v.string(),
        organizationId: v.string(),
        startDate: v.number(),
        endDate: v.number(),
        weekdays: v.array(v.number()),
        startTime: v.string(),
        endTime: v.string(),
        status: v.string(),
        totalPrice: v.number(),
        currency: v.string(),
        notes: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("seasonalLeases", {
            ...args,
            metadata: args.metadata ?? {},
        });
        return { id: id as string };
    },
});

/**
 * Import a priority rule record from the legacy table.
 * Used during data migration.
 */
export const importPriorityRule = mutation({
    args: {
        tenantId: v.string(),
        seasonId: v.optional(v.id("seasons")),
        name: v.string(),
        description: v.optional(v.string()),
        rules: v.array(v.any()),
        priority: v.number(),
        isActive: v.boolean(),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("priorityRules", { ...args });
        return { id: id as string };
    },
});
