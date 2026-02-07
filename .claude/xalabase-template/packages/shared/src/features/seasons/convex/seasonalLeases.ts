import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

/**
 * Seasonal Leases Facade
 * Delegates to components.seasons.queries.* / components.seasons.mutations.*.
 * Maps: list -> listLeases, create -> createLease, cancel -> cancelLease.
 * Preserves api.domain.seasonalLeases.* paths for SDK hooks.
 */

// List seasonal leases for a tenant
export const list = query({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.optional(v.string()),
        organizationId: v.optional(v.id("organizations")),
        status: v.optional(v.string()),
    },
    handler: async (ctx, { tenantId, resourceId, organizationId, status }) => {
        const leases = await ctx.runQuery(components.seasons.queries.listLeases, {
            tenantId: tenantId as string,
            resourceId: resourceId ? (resourceId as string) : undefined,
            organizationId: organizationId
                ? (organizationId as string)
                : undefined,
            status,
        });

        // Enrich with core table data (resource and org names)
        const enriched = await Promise.all(
            leases.map(async (lease: any) => {
                const resource = lease.resourceId
                    ? await ctx.runQuery(components.resources.queries.get, {
                          id: lease.resourceId,
                      }).catch(() => null)
                    : null;

                const org = lease.organizationId
                    ? await ctx.db
                          .query("organizations")
                          .filter((q) =>
                              q.eq(q.field("_id"), lease.organizationId as any)
                          )
                          .first()
                          .catch(() => null)
                    : null;

                return {
                    ...lease,
                    resource: resource
                        ? { id: resource._id, name: resource.name }
                        : null,
                    organization: org
                        ? { id: org._id, name: org.name }
                        : null,
                };
            })
        );

        // Sort by start date
        enriched.sort((a: any, b: any) => a.startDate - b.startDate);

        return enriched;
    },
});

// Get a single seasonal lease
export const get = query({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        // The component's listLeases doesn't have a direct get by ID.
        // We need to find the lease. Since we don't know the tenantId here,
        // we throw a helpful error. The component would need a getLease function.
        throw new Error(
            "Use list with tenantId to find leases. Direct get by ID requires component enhancement."
        );
    },
});

// Create a seasonal lease
export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.string(),
        organizationId: v.id("organizations"),
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
    handler: async (ctx, args) => {
        return ctx.runMutation(components.seasons.mutations.createLease, {
            tenantId: args.tenantId as string,
            resourceId: args.resourceId as string,
            organizationId: args.organizationId as string,
            startDate: args.startDate,
            endDate: args.endDate,
            weekdays: args.weekdays,
            startTime: args.startTime,
            endTime: args.endTime,
            totalPrice: args.totalPrice,
            currency: args.currency,
            notes: args.notes,
            metadata: args.metadata,
        });
    },
});

// Update a seasonal lease
export const update = mutation({
    args: {
        id: v.string(),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        weekdays: v.optional(v.array(v.number())),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        totalPrice: v.optional(v.number()),
        notes: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (_ctx, _args) => {
        // The component doesn't have an updateLease function.
        // This would need a component enhancement.
        throw new Error(
            "Lease update requires component enhancement. Use cancel to cancel a lease."
        );
    },
});

// Approve a seasonal lease
export const approve = mutation({
    args: {
        id: v.string(),
    },
    handler: async (_ctx, _args) => {
        // The component's createLease sets status to "active" directly.
        // There's no separate approve flow in the component.
        // This would need a component enhancement.
        throw new Error(
            "Lease approval requires component enhancement."
        );
    },
});

// Reject a seasonal lease
export const reject = mutation({
    args: {
        id: v.string(),
        reason: v.optional(v.string()),
    },
    handler: async (_ctx, _args) => {
        // The component doesn't have a rejectLease function.
        // This would need a component enhancement.
        throw new Error(
            "Lease rejection requires component enhancement."
        );
    },
});

// Cancel a seasonal lease
export const cancel = mutation({
    args: {
        id: v.string(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, { id, reason }) => {
        return ctx.runMutation(components.seasons.mutations.cancelLease, {
            id: id as any,
            reason,
        });
    },
});
