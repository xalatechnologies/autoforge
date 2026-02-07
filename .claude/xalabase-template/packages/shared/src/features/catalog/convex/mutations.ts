/**
 * Catalog Component — Mutation Functions
 *
 * Write operations for categories, amenity groups, amenities, and resource-amenity associations.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// CATEGORY MUTATIONS
// =============================================================================

export const createCategory = mutation({
    args: {
        tenantId: v.string(), parentId: v.optional(v.id("categories")),
        key: v.optional(v.string()), name: v.string(), slug: v.string(),
        description: v.optional(v.string()), icon: v.optional(v.string()),
        color: v.optional(v.string()), sortOrder: v.optional(v.number()),
        settings: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("categories").withIndex("by_slug", (q) => q.eq("tenantId", args.tenantId).eq("slug", args.slug)).first();
        if (existing) throw new Error(`Category with slug "${args.slug}" already exists`);
        const id = await ctx.db.insert("categories", { ...args, sortOrder: args.sortOrder ?? 0, settings: args.settings || {}, isActive: true });
        return { id: id as string };
    },
});

export const updateCategory = mutation({
    args: {
        id: v.id("categories"), name: v.optional(v.string()), description: v.optional(v.string()),
        icon: v.optional(v.string()), color: v.optional(v.string()), sortOrder: v.optional(v.number()),
        settings: v.optional(v.any()), isActive: v.optional(v.boolean()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, ...updates }) => {
        if (!await ctx.db.get(id)) throw new Error("Category not found");
        const filteredUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
        await ctx.db.patch(id, filteredUpdates);
        return { success: true };
    },
});

export const removeCategory = mutation({
    args: { id: v.id("categories") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        if (!await ctx.db.get(id)) throw new Error("Category not found");
        const children = await ctx.db.query("categories").withIndex("by_parent", (q) => q.eq("parentId", id)).first();
        if (children) throw new Error("Cannot delete category with children");
        await ctx.db.delete(id);
        return { success: true };
    },
});

// =============================================================================
// AMENITY GROUP MUTATIONS
// =============================================================================

export const createAmenityGroup = mutation({
    args: {
        tenantId: v.string(), name: v.string(), slug: v.string(),
        description: v.optional(v.string()), icon: v.optional(v.string()),
        displayOrder: v.optional(v.number()), metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("amenityGroups").withIndex("by_slug", (q) => q.eq("tenantId", args.tenantId).eq("slug", args.slug)).first();
        if (existing) throw new Error(`Amenity group with slug "${args.slug}" already exists`);
        const id = await ctx.db.insert("amenityGroups", { ...args, displayOrder: args.displayOrder ?? 0, isActive: true, metadata: args.metadata || {} });
        return { id: id as string };
    },
});

// =============================================================================
// AMENITY MUTATIONS
// =============================================================================

export const createAmenity = mutation({
    args: {
        tenantId: v.string(), groupId: v.optional(v.id("amenityGroups")),
        name: v.string(), slug: v.string(), description: v.optional(v.string()),
        icon: v.optional(v.string()), displayOrder: v.optional(v.number()),
        isHighlighted: v.optional(v.boolean()), metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("amenities").withIndex("by_slug", (q) => q.eq("tenantId", args.tenantId).eq("slug", args.slug)).first();
        if (existing) throw new Error(`Amenity with slug "${args.slug}" already exists`);
        const id = await ctx.db.insert("amenities", { ...args, displayOrder: args.displayOrder ?? 0, isHighlighted: args.isHighlighted ?? false, isActive: true, metadata: args.metadata || {} });
        return { id: id as string };
    },
});

export const updateAmenity = mutation({
    args: {
        id: v.id("amenities"), name: v.optional(v.string()), description: v.optional(v.string()),
        icon: v.optional(v.string()), displayOrder: v.optional(v.number()),
        isHighlighted: v.optional(v.boolean()), isActive: v.optional(v.boolean()), metadata: v.optional(v.any()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, ...updates }) => {
        if (!await ctx.db.get(id)) throw new Error("Amenity not found");
        const filteredUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
        await ctx.db.patch(id, filteredUpdates);
        return { success: true };
    },
});

export const removeAmenity = mutation({
    args: { id: v.id("amenities") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        if (!await ctx.db.get(id)) throw new Error("Amenity not found");
        const used = await ctx.db.query("resourceAmenities").withIndex("by_amenity", (q) => q.eq("amenityId", id)).first();
        if (used) throw new Error("Amenity is used by resources, deactivate instead");
        await ctx.db.delete(id);
        return { success: true };
    },
});

// =============================================================================
// RESOURCE-AMENITY MUTATIONS
// =============================================================================

export const addToResource = mutation({
    args: {
        tenantId: v.string(), resourceId: v.string(), amenityId: v.id("amenities"),
        quantity: v.optional(v.number()), notes: v.optional(v.string()),
        isIncluded: v.optional(v.boolean()), additionalCost: v.optional(v.number()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("resourceAmenities").withIndex("by_resource", (q) => q.eq("resourceId", args.resourceId)).filter((q) => q.eq(q.field("amenityId"), args.amenityId)).first();
        if (existing) throw new Error("Amenity already added to resource");
        const id = await ctx.db.insert("resourceAmenities", { tenantId: args.tenantId, resourceId: args.resourceId, amenityId: args.amenityId, quantity: args.quantity ?? 1, notes: args.notes, isIncluded: args.isIncluded ?? true, additionalCost: args.additionalCost, metadata: args.metadata || {} });
        return { id: id as string };
    },
});

export const removeFromResource = mutation({
    args: { resourceId: v.string(), amenityId: v.id("amenities") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { resourceId, amenityId }) => {
        const existing = await ctx.db.query("resourceAmenities").withIndex("by_resource", (q) => q.eq("resourceId", resourceId)).filter((q) => q.eq(q.field("amenityId"), amenityId)).first();
        if (!existing) throw new Error("Amenity not found on resource");
        await ctx.db.delete(existing._id);
        return { success: true };
    },
});
