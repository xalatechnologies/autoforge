/**
 * Amenities Facade — delegates to catalog component.
 * Preserves api.domain.amenities.* for SDK compatibility.
 */

import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

export const listGroups = query({
    args: { tenantId: v.id("tenants"), isActive: v.optional(v.boolean()) },
    handler: async (ctx, { tenantId, isActive }) => {
        return ctx.runQuery(components.catalog.queries.listAmenityGroups, { tenantId: tenantId as string, isActive });
    },
});

export const list = query({
    args: { tenantId: v.id("tenants"), groupId: v.optional(v.string()), isActive: v.optional(v.boolean()) },
    handler: async (ctx, { tenantId, groupId, isActive }) => {
        return ctx.runQuery(components.catalog.queries.listAmenities, { tenantId: tenantId as string, groupId, isActive });
    },
});

export const get = query({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runQuery(components.catalog.queries.getAmenity, { id });
    },
});

export const listForResource = query({
    args: { resourceId: v.string() },
    handler: async (ctx, { resourceId }) => {
        return ctx.runQuery(components.catalog.queries.listForResource, { resourceId: resourceId as string });
    },
});

export const createGroup = mutation({
    args: {
        tenantId: v.id("tenants"), name: v.string(), slug: v.string(),
        description: v.optional(v.string()), icon: v.optional(v.string()),
        displayOrder: v.optional(v.number()), metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.catalog.mutations.createAmenityGroup, { ...args, tenantId: args.tenantId as string });
    },
});

export const create = mutation({
    args: {
        tenantId: v.id("tenants"), groupId: v.optional(v.string()),
        name: v.string(), slug: v.string(), description: v.optional(v.string()),
        icon: v.optional(v.string()), displayOrder: v.optional(v.number()),
        isHighlighted: v.optional(v.boolean()), metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.catalog.mutations.createAmenity, { ...args, tenantId: args.tenantId as string });
    },
});

export const update = mutation({
    args: {
        id: v.string(), name: v.optional(v.string()), description: v.optional(v.string()),
        icon: v.optional(v.string()), displayOrder: v.optional(v.number()),
        isHighlighted: v.optional(v.boolean()), isActive: v.optional(v.boolean()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.catalog.mutations.updateAmenity, args);
    },
});

export const remove = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.catalog.mutations.removeAmenity, { id });
    },
});

export const addToResource = mutation({
    args: {
        tenantId: v.id("tenants"), resourceId: v.string(), amenityId: v.string(),
        quantity: v.optional(v.number()), notes: v.optional(v.string()),
        isIncluded: v.optional(v.boolean()), additionalCost: v.optional(v.number()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.catalog.mutations.addToResource, {
            ...args, tenantId: args.tenantId as string, resourceId: args.resourceId as string, amenityId: args.amenityId,
        });
    },
});

export const removeFromResource = mutation({
    args: { resourceId: v.string(), amenityId: v.string() },
    handler: async (ctx, { resourceId, amenityId }) => {
        return ctx.runMutation(components.catalog.mutations.removeFromResource, { resourceId: resourceId as string, amenityId });
    },
});
