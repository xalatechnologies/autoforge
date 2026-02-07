/**
 * Catalog Component — Query Functions
 *
 * Read-only operations for categories, amenity groups, amenities, and resource-amenity associations.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// CATEGORY QUERIES
// =============================================================================

export const listCategories = query({
    args: {
        tenantId: v.string(),
        parentId: v.optional(v.id("categories")),
        isActive: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, parentId, isActive, limit = 100 }) => {
        let categories = await ctx.db
            .query("categories")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .collect();
        if (parentId !== undefined) categories = categories.filter((c) => c.parentId === parentId);
        if (isActive !== undefined) categories = categories.filter((c) => c.isActive === isActive);
        categories.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        return categories.slice(0, limit);
    },
});

export const getCategory = query({
    args: { id: v.id("categories") },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const category = await ctx.db.get(id);
        if (!category) throw new Error("Category not found");
        const parent = category.parentId ? await ctx.db.get(category.parentId) : null;
        const children = await ctx.db.query("categories").withIndex("by_parent", (q) => q.eq("parentId", id)).collect();
        return { ...category, parent, children };
    },
});

export const getCategoryByKey = query({
    args: { tenantId: v.string(), key: v.string() },
    returns: v.any(),
    handler: async (ctx, { tenantId, key }) => {
        return ctx.db.query("categories").withIndex("by_key", (q) => q.eq("tenantId", tenantId).eq("key", key)).first();
    },
});

export const getCategoryTree = query({
    args: { tenantId: v.string() },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId }) => {
        const allCategories = await ctx.db.query("categories").withIndex("by_tenant", (q) => q.eq("tenantId", tenantId)).filter((q) => q.eq(q.field("isActive"), true)).collect();
        const categoryMap = new Map<string, Record<string, unknown>>();
        for (const cat of allCategories) categoryMap.set(cat._id as string, { ...cat, children: [] });
        const roots: Record<string, unknown>[] = [];
        for (const category of categoryMap.values()) {
            const parentId = category.parentId as string | undefined;
            if (parentId && categoryMap.has(parentId)) {
                (categoryMap.get(parentId)!.children as Record<string, unknown>[]).push(category);
            } else {
                roots.push(category);
            }
        }
        const sortChildren = (cats: Record<string, unknown>[]): void => {
            cats.sort((a, b) => ((a.sortOrder as number) ?? 0) - ((b.sortOrder as number) ?? 0));
            cats.forEach((c) => sortChildren(c.children as Record<string, unknown>[]));
        };
        sortChildren(roots);
        return roots;
    },
});

// =============================================================================
// AMENITY GROUP QUERIES
// =============================================================================

export const listAmenityGroups = query({
    args: { tenantId: v.string(), isActive: v.optional(v.boolean()), limit: v.optional(v.number()) },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, isActive, limit = 100 }) => {
        let groups = await ctx.db.query("amenityGroups").withIndex("by_tenant", (q) => q.eq("tenantId", tenantId)).collect();
        if (isActive !== undefined) groups = groups.filter((g) => g.isActive === isActive);
        groups.sort((a, b) => a.displayOrder - b.displayOrder);
        return groups.slice(0, limit);
    },
});

// =============================================================================
// AMENITY QUERIES
// =============================================================================

export const listAmenities = query({
    args: { tenantId: v.string(), groupId: v.optional(v.id("amenityGroups")), isActive: v.optional(v.boolean()), limit: v.optional(v.number()) },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, groupId, isActive, limit = 100 }) => {
        let amenities = await ctx.db.query("amenities").withIndex("by_tenant", (q) => q.eq("tenantId", tenantId)).collect();
        if (groupId) amenities = amenities.filter((a) => a.groupId === groupId);
        if (isActive !== undefined) amenities = amenities.filter((a) => a.isActive === isActive);
        amenities.sort((a, b) => a.displayOrder - b.displayOrder);
        return amenities.slice(0, limit);
    },
});

export const getAmenity = query({
    args: { id: v.id("amenities") },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const amenity = await ctx.db.get(id);
        if (!amenity) throw new Error("Amenity not found");
        const group = amenity.groupId ? await ctx.db.get(amenity.groupId) : null;
        return { ...amenity, group };
    },
});

// =============================================================================
// RESOURCE-AMENITY QUERIES
// =============================================================================

export const listForResource = query({
    args: { resourceId: v.string() },
    returns: v.array(v.any()),
    handler: async (ctx, { resourceId }) => {
        const resourceAmenities = await ctx.db.query("resourceAmenities").withIndex("by_resource", (q) => q.eq("resourceId", resourceId)).collect();

        // Batch fetch amenities to avoid N+1
        const amenityIds = [...new Set(resourceAmenities.map((ra) => ra.amenityId))];
        const amenities = await Promise.all(amenityIds.map((id) => ctx.db.get(id)));
        const amenityMap = new Map(amenities.filter(Boolean).map((a: any) => [a._id, a]));

        return resourceAmenities.map((ra) => ({
            ...ra,
            amenity: amenityMap.get(ra.amenityId) ?? null,
        }));
    },
});
