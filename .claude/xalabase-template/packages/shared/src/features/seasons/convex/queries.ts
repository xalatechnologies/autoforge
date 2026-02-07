/**
 * Seasons Component — Query Functions
 *
 * Read-only operations for seasons, applications, allocations, and leases.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// SEASON QUERIES
// =============================================================================

/**
 * List seasons for a tenant
 */
export const list = query({
    args: {
        tenantId: v.string(),
        status: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, status, isActive, limit = 100 }) => {
        let seasons = await ctx.db
            .query("seasons")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();

        if (status) {
            seasons = seasons.filter((s) => s.status === status);
        }

        if (isActive !== undefined) {
            seasons = seasons.filter((s) => s.isActive === isActive);
        }

        // Sort by start date
        seasons.sort((a, b) => a.startDate - b.startDate);

        return seasons.slice(0, limit);
    },
});

/**
 * Get season by ID
 */
export const get = query({
    args: {
        id: v.id("seasons"),
    },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const season = await ctx.db.get(id);
        if (!season) {
            throw new Error("Season not found");
        }

        // Get applications count
        const applications = await ctx.db
            .query("seasonApplications")
            .withIndex("by_season", (q) => q.eq("seasonId", id))
            .collect();

        const statusCounts = applications.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            ...season,
            applicationStats: {
                total: applications.length,
                byStatus: statusCounts,
            },
        };
    },
});

// =============================================================================
// SEASON APPLICATIONS
// =============================================================================

/**
 * List applications for a season
 */
export const listApplications = query({
    args: {
        seasonId: v.id("seasons"),
        status: v.optional(v.string()),
        organizationId: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { seasonId, status, organizationId, limit = 100 }) => {
        let applications = await ctx.db
            .query("seasonApplications")
            .withIndex("by_season", (q) => q.eq("seasonId", seasonId))
            .collect();

        if (status) {
            applications = applications.filter((a) => a.status === status);
        }

        if (organizationId) {
            applications = applications.filter((a) => a.organizationId === organizationId);
        }

        // Sort by priority
        applications.sort((a, b) => b.priority - a.priority);

        // Return raw applications — enrichment with user/org/resource happens in facade
        return applications.slice(0, limit);
    },
});

// =============================================================================
// ALLOCATIONS (Priority Rules)
// =============================================================================

/**
 * List allocations (priority rules) for a tenant, optionally scoped to a season.
 */
export const listAllocations = query({
    args: {
        tenantId: v.string(),
        seasonId: v.optional(v.id("seasons")),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, seasonId, limit = 100 }) => {
        let rules;

        if (seasonId) {
            rules = await ctx.db
                .query("priorityRules")
                .withIndex("by_season", (q) => q.eq("seasonId", seasonId))
                .collect();
            rules = rules.filter((r) => r.tenantId === tenantId);
        } else {
            rules = await ctx.db
                .query("priorityRules")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
                .collect();
        }

        rules.sort((a, b) => a.priority - b.priority);
        return rules.slice(0, limit);
    },
});

// =============================================================================
// SEASONAL LEASES
// =============================================================================

/**
 * List seasonal leases
 */
export const listLeases = query({
    args: {
        tenantId: v.string(),
        resourceId: v.optional(v.string()),
        organizationId: v.optional(v.string()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, resourceId, organizationId, status, limit = 100 }) => {
        let leases = await ctx.db
            .query("seasonalLeases")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();

        if (resourceId) {
            leases = leases.filter((l) => l.resourceId === resourceId);
        }

        if (organizationId) {
            leases = leases.filter((l) => l.organizationId === organizationId);
        }

        if (status) {
            leases = leases.filter((l) => l.status === status);
        }

        return leases.slice(0, limit);
    },
});
