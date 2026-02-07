/**
 * Bookings Facade
 *
 * Thin facade that delegates to the bookings component.
 * Preserves the existing API path (api.domain.bookings.*) for SDK compatibility.
 * Handles:
 *   - ID type conversion (typed Id<"tenants"> -> string for component)
 *   - Data enrichment (join user/resource data from core tables)
 *   - Resource lookups (to pass config for availability queries)
 *   - Audit logging via audit component
 */

import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { requireActiveUser } from "../../_shared/lib/auth";
import { rateLimit, rateLimitKeys } from "../../_shared/lib/rateLimits";

// =============================================================================
// BOOKING QUERIES
// =============================================================================

/**
 * List bookings for a tenant with optional filters.
 */
export const list = query({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        status: v.optional(v.string()),
        startAfter: v.optional(v.number()),
        startBefore: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { tenantId, resourceId, userId, status, startAfter, startBefore, limit }) => {
        return ctx.runQuery(components.bookings.queries.list, {
            tenantId: tenantId as string,
            resourceId: resourceId as string | undefined,
            userId: userId as string | undefined,
            status,
            startAfter,
            startBefore,
            limit,
        });
    },
});

/**
 * Get a single booking by ID.
 * Enriches with user name and resource name from core tables.
 */
export const get = query({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        const booking = await ctx.runQuery(components.bookings.queries.get, { id });

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Enrich with user data from core table
        const user = (booking as any).userId
            ? await ctx.db.get((booking as any).userId as Id<"users">)
            : null;

        // Enrich with resource data from resources component
        const resource = (booking as any).resourceId
            ? await ctx.runQuery(components.resources.queries.get, {
                  id: (booking as any).resourceId,
              })
            : null;

        return {
            ...booking,
            resource: resource ? { name: (resource as any).name } : null,
            user: user ? { name: user.name, email: user.email } : null,
            // Digdir-compatible aliases
            resourceName: resource ? (resource as any).name : undefined,
            userName: user?.name,
            userEmail: user?.email,
        };
    },
});

// =============================================================================
// BOOKING MUTATIONS
// =============================================================================

/**
 * Create a new booking.
 * Validates resource exists via resources component, delegates to bookings component,
 * and creates an audit entry.
 */
export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.string(),
        userId: v.id("users"),
        organizationId: v.optional(v.id("organizations")),
        startTime: v.number(),
        endTime: v.number(),
        totalPrice: v.optional(v.number()),
        currency: v.optional(v.string()),
        notes: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        await requireActiveUser(ctx, args.userId);

        // Rate limit: per-tenant booking creation
        await rateLimit(ctx, {
            name: "createBooking",
            key: rateLimitKeys.tenant(args.tenantId as string),
            throws: true,
        });

        // Validate resource exists via resources component
        const resource = await ctx.runQuery(components.resources.queries.get, {
            id: args.resourceId as string,
        });

        if (!resource) {
            throw new Error("Resource not found");
        }

        // Delegate to bookings component
        const result = await ctx.runMutation(components.bookings.mutations.create, {
            tenantId: args.tenantId as string,
            resourceId: args.resourceId as string,
            userId: args.userId as string,
            organizationId: args.organizationId as string | undefined,
            startTime: args.startTime,
            endTime: args.endTime,
            totalPrice: args.totalPrice,
            currency: args.currency,
            notes: args.notes,
            metadata: args.metadata,
        });

        // Create audit entry
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: args.tenantId as string,
            userId: args.userId as string,
            entityType: "booking",
            entityId: result.id,
            action: "created",
            sourceComponent: "bookings",
            newState: {
                resourceId: args.resourceId as string,
                startTime: args.startTime,
                endTime: args.endTime,
                status: result.status,
            },
        });

        return result;
    },
});

/**
 * Update a booking.
 */
export const update = mutation({
    args: {
        id: v.string(),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        notes: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { id, ...updates }) => {
        return ctx.runMutation(components.bookings.mutations.update, {
            id,
            ...updates,
        });
    },
});

/**
 * Approve a booking.
 */
export const approve = mutation({
    args: {
        id: v.string(),
        approvedBy: v.id("users"),
    },
    handler: async (ctx, { id, approvedBy }) => {
        await requireActiveUser(ctx, approvedBy);

        // Fetch booking to get tenantId for audit
        const booking = await ctx.runQuery(components.bookings.queries.get, { id });

        const result = await ctx.runMutation(components.bookings.mutations.approve, {
            id,
            approvedBy: approvedBy as string,
        });

        // Create audit entry
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: (booking as any)?.tenantId ?? "",
            userId: approvedBy as string,
            entityType: "booking",
            entityId: id as string,
            action: "approved",
            sourceComponent: "bookings",
            newState: { status: "confirmed" },
        });

        return result;
    },
});

/**
 * Reject a booking.
 */
export const reject = mutation({
    args: {
        id: v.string(),
        rejectedBy: v.id("users"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, { id, rejectedBy, reason }) => {
        await requireActiveUser(ctx, rejectedBy);

        // Fetch booking to get tenantId for audit
        const booking = await ctx.runQuery(components.bookings.queries.get, { id });

        const result = await ctx.runMutation(components.bookings.mutations.reject, {
            id,
            rejectedBy: rejectedBy as string,
            reason,
        });

        // Create audit entry
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: (booking as any)?.tenantId ?? "",
            userId: rejectedBy as string,
            entityType: "booking",
            entityId: id as string,
            action: "rejected",
            sourceComponent: "bookings",
            newState: { status: "rejected", reason },
        });

        return result;
    },
});

/**
 * Cancel a booking.
 */
export const cancel = mutation({
    args: {
        id: v.string(),
        cancelledBy: v.id("users"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, { id, cancelledBy, reason }) => {
        await requireActiveUser(ctx, cancelledBy);

        // Fetch booking to get tenantId for audit
        const booking = await ctx.runQuery(components.bookings.queries.get, { id });

        // Rate limit: per-tenant booking cancellation
        await rateLimit(ctx, {
            name: "cancelBooking",
            key: rateLimitKeys.tenant((booking as any)?.tenantId ?? ""),
            throws: true,
        });

        const result = await ctx.runMutation(components.bookings.mutations.cancel, {
            id,
            cancelledBy: cancelledBy as string,
            reason,
        });

        // Create audit entry
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: (booking as any)?.tenantId ?? "",
            userId: cancelledBy as string,
            entityType: "booking",
            entityId: id as string,
            action: "cancelled",
            sourceComponent: "bookings",
            newState: { status: "cancelled", reason },
        });

        return result;
    },
});

// =============================================================================
// CALENDAR
// =============================================================================

/**
 * Get bookings and blocks for calendar view.
 */
export const calendar = query({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
    },
    handler: async (ctx, { tenantId, resourceId, startDate, endDate }) => {
        return ctx.runQuery(components.bookings.queries.calendar, {
            tenantId: tenantId as string,
            resourceId: resourceId as string | undefined,
            startDate,
            endDate,
        });
    },
});

// =============================================================================
// AVAILABILITY
// =============================================================================

/**
 * Get resource availability for a date range.
 * Looks up resource config from resources component (opening hours, capacity, etc.)
 * then delegates to bookings component with that config.
 */
export const getResourceAvailability = query({
    args: {
        resourceId: v.string(),
        startDate: v.string(),
        endDate: v.string(),
        mode: v.string(),
    },
    handler: async (ctx, { resourceId, startDate, endDate, mode }) => {
        // Look up resource config from resources component
        const resource = await ctx.runQuery(components.resources.queries.get, {
            id: resourceId as string,
        });

        // Extract config fields from resource (if available)
        const openingHours = resource ? (resource as any).openingHours : undefined;
        const slotDurationMinutes = resource ? (resource as any).slotDurationMinutes : undefined;
        const maxBookingDuration = resource ? (resource as any).maxBookingDuration : undefined;
        const capacity = resource ? (resource as any).capacity : undefined;

        return ctx.runQuery(components.bookings.availability.getResourceAvailability, {
            resourceId: resourceId as string,
            startDate,
            endDate,
            mode,
            openingHours,
            slotDurationMinutes,
            maxBookingDuration,
            capacity,
        });
    },
});

/**
 * Validate a booking slot before creation.
 * Looks up resource to pass capacity and opening hours.
 */
export const validateBookingSlot = query({
    args: {
        resourceId: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        quantity: v.optional(v.number()),
    },
    handler: async (ctx, { resourceId, startTime, endTime, quantity }) => {
        // Look up resource for capacity and opening hours
        const resource = await ctx.runQuery(components.resources.queries.get, {
            id: resourceId as string,
        });

        const capacity = resource ? (resource as any).capacity : undefined;
        const openingHours = resource ? (resource as any).openingHours : undefined;

        return ctx.runQuery(components.bookings.availability.validateBookingSlot, {
            resourceId: resourceId as string,
            startTime,
            endTime,
            quantity,
            capacity,
            openingHours,
        });
    },
});
