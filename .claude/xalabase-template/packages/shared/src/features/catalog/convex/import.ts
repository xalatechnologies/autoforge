/**
 * Catalog Component — Import Functions
 *
 * Data migration helpers for categories, amenity groups, amenities, and resource-amenities.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Import a category record from the legacy table.
 * Used during data migration.
 */
export const importCategory = mutation({
    args: {
        tenantId: v.string(),
        parentId: v.optional(v.id("categories")),
        key: v.optional(v.string()),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        color: v.optional(v.string()),
        sortOrder: v.optional(v.number()),
        settings: v.optional(v.any()),
        isActive: v.boolean(),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("categories", { ...args, settings: args.settings ?? {} });
        return { id: id as string };
    },
});

/**
 * Import an amenity group record from the legacy table.
 * Used during data migration.
 */
export const importAmenityGroup = mutation({
    args: {
        tenantId: v.string(),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        displayOrder: v.number(),
        isActive: v.boolean(),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("amenityGroups", { ...args, metadata: args.metadata ?? {} });
        return { id: id as string };
    },
});

/**
 * Import an amenity record from the legacy table.
 * Used during data migration.
 */
export const importAmenity = mutation({
    args: {
        tenantId: v.string(),
        groupId: v.optional(v.id("amenityGroups")),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        displayOrder: v.number(),
        isHighlighted: v.boolean(),
        isActive: v.boolean(),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("amenities", { ...args, metadata: args.metadata ?? {} });
        return { id: id as string };
    },
});

/**
 * Import a resource-amenity association from the legacy table.
 * Used during data migration.
 */
export const importResourceAmenity = mutation({
    args: {
        tenantId: v.string(),
        resourceId: v.string(),
        amenityId: v.id("amenities"),
        quantity: v.number(),
        notes: v.optional(v.string()),
        isIncluded: v.boolean(),
        additionalCost: v.optional(v.number()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("resourceAmenities", { ...args, metadata: args.metadata ?? {} });
        return { id: id as string };
    },
});
