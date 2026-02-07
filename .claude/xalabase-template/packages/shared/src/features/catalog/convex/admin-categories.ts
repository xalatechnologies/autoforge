/**
 * Admin API for Categories Management
 *
 * Categories are tenant-scoped and configurable from admin/saas-admin.
 * Supports hierarchical structure (parent/child for subcategories).
 * Delegates to the catalog component for all table operations.
 */

import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

// =============================================================================
// Queries
// =============================================================================

/**
 * List all categories for a tenant (including subcategories)
 */
export const list = query({
    args: {
        tenantId: v.id("tenants"),
        parentId: v.optional(v.id("categories")),
        includeInactive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, parentId, includeInactive }) => {
        let categories = await ctx.runQuery(
            components.catalog.queries.listCategories,
            {
                tenantId: tenantId as string,
                parentId,
                isActive: includeInactive ? undefined : true,
            }
        );

        // If no parentId specified, filter to root categories (no parent)
        if (parentId === undefined) {
            categories = categories.filter((c: any) => !c.parentId);
        }

        return categories;
    },
});

/**
 * Get category tree (categories with their subcategories)
 */
export const getTree = query({
    args: {
        tenantId: v.id("tenants"),
        includeInactive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, includeInactive }) => {
        const allCategories = await ctx.runQuery(
            components.catalog.queries.listCategories,
            {
                tenantId: tenantId as string,
                isActive: includeInactive ? undefined : true,
            }
        );

        // Build tree structure
        const rootCategories = allCategories
            .filter((c: any) => !c.parentId)
            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        return rootCategories.map((parent: any) => ({
            ...parent,
            subcategories: allCategories
                .filter((c: any) => c.parentId === parent._id)
                .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
        }));
    },
});

/**
 * Get a single category by ID
 */
export const getById = query({
    args: { id: v.id("categories") },
    handler: async (ctx, { id }) => {
        const result = await ctx.runQuery(
            components.catalog.queries.getCategory,
            { id }
        );
        return result;
    },
});

/**
 * Get a category by key
 */
export const getByKey = query({
    args: {
        tenantId: v.id("tenants"),
        key: v.string(),
    },
    handler: async (ctx, { tenantId, key }) => {
        return await ctx.runQuery(
            components.catalog.queries.getCategoryByKey,
            { tenantId: tenantId as string, key }
        );
    },
});

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new category
 */
export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        parentId: v.optional(v.id("categories")),
        key: v.string(),
        name: v.string(),
        slug: v.optional(v.string()),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        color: v.optional(v.string()),
        sortOrder: v.optional(v.number()),
        settings: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const slug = args.slug || args.key.toLowerCase().replace(/_/g, "-");

        const result = await ctx.runMutation(
            components.catalog.mutations.createCategory,
            {
                tenantId: args.tenantId as string,
                parentId: args.parentId,
                key: args.key,
                name: args.name,
                slug,
                description: args.description,
                icon: args.icon,
                color: args.color,
                sortOrder: args.sortOrder,
                settings: args.settings ?? {},
            }
        );

        return result.id;
    },
});

/**
 * Update a category
 */
export const update = mutation({
    args: {
        id: v.id("categories"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        color: v.optional(v.string()),
        sortOrder: v.optional(v.number()),
        settings: v.optional(v.any()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { id, slug, ...updates }) => {
        await ctx.runMutation(
            components.catalog.mutations.updateCategory,
            {
                id,
                ...updates,
            }
        );

        return id;
    },
});

/**
 * Delete a category (via component -- checks for children)
 */
export const remove = mutation({
    args: { id: v.id("categories") },
    handler: async (ctx, { id }) => {
        await ctx.runMutation(
            components.catalog.mutations.removeCategory,
            { id }
        );

        return id;
    },
});

/**
 * Reorder categories
 */
export const reorder = mutation({
    args: {
        categoryIds: v.array(v.id("categories")),
    },
    handler: async (ctx, { categoryIds }) => {
        for (let i = 0; i < categoryIds.length; i++) {
            await ctx.runMutation(
                components.catalog.mutations.updateCategory,
                { id: categoryIds[i], sortOrder: i + 1 }
            );
        }
        return true;
    },
});

/**
 * Bulk create categories (for seeding)
 */
export const bulkCreate = mutation({
    args: {
        tenantId: v.id("tenants"),
        categories: v.array(
            v.object({
                key: v.string(),
                name: v.string(),
                icon: v.optional(v.string()),
                color: v.optional(v.string()),
                description: v.optional(v.string()),
                settings: v.optional(v.any()),
                subcategories: v.optional(
                    v.array(
                        v.object({
                            key: v.string(),
                            name: v.string(),
                            icon: v.optional(v.string()),
                            description: v.optional(v.string()),
                        })
                    )
                ),
            })
        ),
    },
    handler: async (ctx, { tenantId, categories }) => {
        let createdCount = 0;
        const tenantIdStr = tenantId as string;

        for (let i = 0; i < categories.length; i++) {
            const cat = categories[i];

            // Check if already exists
            const existing = await ctx.runQuery(
                components.catalog.queries.getCategoryByKey,
                { tenantId: tenantIdStr, key: cat.key }
            );

            let parentCatId: string | undefined;
            if (existing) {
                parentCatId = existing._id as string;
                await ctx.runMutation(
                    components.catalog.mutations.updateCategory,
                    {
                        id: existing._id,
                        name: cat.name,
                        icon: cat.icon,
                        color: cat.color,
                        description: cat.description,
                        settings: cat.settings ?? existing.settings,
                        sortOrder: i + 1,
                        isActive: true,
                    }
                );
            } else {
                const result = await ctx.runMutation(
                    components.catalog.mutations.createCategory,
                    {
                        tenantId: tenantIdStr,
                        key: cat.key,
                        name: cat.name,
                        slug: cat.key.toLowerCase().replace(/_/g, "-"),
                        icon: cat.icon,
                        color: cat.color,
                        description: cat.description,
                        settings: cat.settings ?? {},
                        sortOrder: i + 1,
                    }
                );
                parentCatId = result.id;
            }
            createdCount++;

            // Create subcategories
            if (cat.subcategories && parentCatId) {
                for (let j = 0; j < cat.subcategories.length; j++) {
                    const sub = cat.subcategories[j];

                    const existingSub = await ctx.runQuery(
                        components.catalog.queries.getCategoryByKey,
                        { tenantId: tenantIdStr, key: sub.key }
                    );

                    if (existingSub) {
                        await ctx.runMutation(
                            components.catalog.mutations.updateCategory,
                            {
                                id: existingSub._id,
                                name: sub.name,
                                icon: sub.icon,
                                description: sub.description,
                                sortOrder: j + 1,
                                isActive: true,
                            }
                        );
                    } else {
                        await ctx.runMutation(
                            components.catalog.mutations.createCategory,
                            {
                                tenantId: tenantIdStr,
                                parentId: parentCatId as any,
                                key: sub.key,
                                name: sub.name,
                                slug: sub.key.toLowerCase().replace(/_/g, "-"),
                                icon: sub.icon,
                                description: sub.description,
                                settings: {},
                                sortOrder: j + 1,
                            }
                        );
                    }
                    createdCount++;
                }
            }
        }

        return { created: createdCount };
    },
});
