import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

/**
 * Allocations Facade
 * Delegates to components.bookings.allocations.* (allocations are in the bookings component).
 * Maps: list -> listAllocations, get -> getAllocation, create -> createAllocation, remove -> removeAllocation.
 * Preserves api.domain.allocations.* paths for SDK hooks.
 */

// List allocations for a tenant
export const list = query({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.optional(v.string()),
        status: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, { tenantId, resourceId, status, startDate, endDate }) => {
        const allocations = await ctx.runQuery(components.bookings.allocations.listAllocations, {
            tenantId: tenantId as string,
            resourceId: resourceId || undefined,
            status,
            startDate,
            endDate,
        });

        // Enrich with core table data (resource names, user names)
        const enriched = await Promise.all(
            allocations.map(async (allocation: any) => {
                const resource = allocation.resourceId
                    ? await ctx.runQuery(components.resources.queries.get, {
                          id: allocation.resourceId,
                      }).catch(() => null)
                    : null;

                const user = allocation.userId
                    ? await ctx.db
                          .query("users")
                          .filter((q) => q.eq(q.field("_id"), allocation.userId as any))
                          .first()
                          .catch(() => null)
                    : null;

                return {
                    ...allocation,
                    resource: resource
                        ? { id: resource._id, name: resource.name }
                        : null,
                    user: user
                        ? { id: user._id, name: user.name, email: user.email }
                        : null,
                };
            })
        );

        return enriched;
    },
});

// Get a single allocation
export const get = query({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        const allocation = await ctx.runQuery(components.bookings.allocations.getAllocation, {
            id: id as any,
        });

        // Enrich with core table data
        const resource = allocation.resourceId
            ? await ctx.runQuery(components.resources.queries.get, {
                  id: allocation.resourceId,
              }).catch(() => null)
            : null;

        const user = allocation.userId
            ? await ctx.db
                  .query("users")
                  .filter((q) => q.eq(q.field("_id"), allocation.userId as any))
                  .first()
                  .catch(() => null)
            : null;

        return {
            ...allocation,
            resource: resource
                ? { id: resource._id, name: resource.name }
                : null,
            user: user
                ? { id: user._id, name: user.name, email: user.email }
                : null,
        };
    },
});

// Create an allocation
export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        organizationId: v.optional(v.id("organizations")),
        resourceId: v.string(),
        title: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        bookingId: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        notes: v.optional(v.string()),
        recurring: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.bookings.allocations.createAllocation, {
            tenantId: args.tenantId as string,
            organizationId: args.organizationId ? (args.organizationId as string) : undefined,
            resourceId: args.resourceId as string,
            title: args.title,
            startTime: args.startTime,
            endTime: args.endTime,
            bookingId: args.bookingId as any,
            userId: args.userId ? (args.userId as string) : undefined,
            notes: args.notes,
            recurring: args.recurring,
            metadata: args.metadata,
        });
    },
});

// Remove an allocation
export const remove = mutation({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.bookings.allocations.removeAllocation, {
            id: id as any,
        });
    },
});
