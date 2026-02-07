import { query, mutation } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

/**
 * Additional Services Facade
 * Delegates to components.pricing.queries.* / components.pricing.mutations.* (additional services are in the pricing component).
 * Preserves api.domain.additionalServices.* paths for SDK hooks.
 */

// List additional services for a resource
export const listByResource = query({
    args: {
        resourceId: v.string(),
    },
    handler: async (ctx, { resourceId }) => {
        return ctx.runQuery(components.pricing.queries.listAdditionalServices, {
            resourceId: resourceId as string,
        });
    },
});

// List all additional services for a tenant
export const listByTenant = query({
    args: {
        tenantId: v.id("tenants"),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, isActive }) => {
        return ctx.runQuery(components.pricing.queries.listAdditionalServicesByTenant, {
            tenantId: tenantId as string,
            isActive,
        });
    },
});

// Get a single additional service by ID
export const get = query({
    args: {
        serviceId: v.string(),
    },
    handler: async (ctx, { serviceId }) => {
        // The pricing component doesn't have a dedicated get for additional services,
        // so we use listAdditionalServices and filter, or access directly.
        // Since the component has no direct get, we list by resource would not work.
        // We'll need to call the component with whatever ID-based approach is available.
        // For now, delegate to the component — the component's get is for resourcePricing.
        // Additional services don't have a dedicated get in the component, so we
        // use the general pattern: the facade preserves the SDK interface.
        // The component's tables are isolated, so we proxy through.
        // Actually looking at the component, there's no getAdditionalService function.
        // We'll return null-safe pattern. The component will need a get added,
        // but for now we can use a workaround or just throw.
        throw new Error("Use listByResource or listByTenant to find additional services");
    },
});

// Create a new additional service
export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        resourceId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        price: v.number(),
        currency: v.optional(v.string()),
        isRequired: v.optional(v.boolean()),
        displayOrder: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.pricing.mutations.createAdditionalService, {
            tenantId: args.tenantId as string,
            resourceId: args.resourceId as string,
            name: args.name,
            description: args.description,
            price: args.price,
            currency: args.currency,
            isRequired: args.isRequired,
            displayOrder: args.displayOrder,
        });
    },
});

// Update an additional service
export const update = mutation({
    args: {
        serviceId: v.string(),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        price: v.optional(v.number()),
        currency: v.optional(v.string()),
        isRequired: v.optional(v.boolean()),
        displayOrder: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { serviceId, ...updates }) => {
        return ctx.runMutation(components.pricing.mutations.updateAdditionalService, {
            id: serviceId as any,
            ...updates,
        });
    },
});

// Delete an additional service (soft delete by setting isActive to false)
export const remove = mutation({
    args: {
        serviceId: v.string(),
    },
    handler: async (ctx, { serviceId }) => {
        return ctx.runMutation(components.pricing.mutations.removeAdditionalService, {
            id: serviceId as any,
        });
    },
});
