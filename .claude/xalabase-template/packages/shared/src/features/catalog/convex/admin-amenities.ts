/**
 * Admin API for Amenities Management
 *
 * Amenities are tenant-scoped and configurable from admin/saas-admin.
 * Delegates to the catalog component for all table operations.
 */

import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

// =============================================================================
// Queries
// =============================================================================

/**
 * List all amenities for a tenant
 */
export const list = query({
    args: {
        tenantId: v.id("tenants"),
        groupId: v.optional(v.id("amenityGroups")),
        includeInactive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, groupId, includeInactive }) => {
        let amenities = await ctx.runQuery(
            components.catalog.queries.listAmenities,
            {
                tenantId: tenantId as string,
                groupId,
                isActive: includeInactive ? undefined : true,
            }
        );

        if (groupId) {
            amenities = amenities.filter((a: any) => a.groupId === groupId);
        }

        return amenities;
    },
});

/**
 * List amenity groups for a tenant
 */
export const listGroups = query({
    args: {
        tenantId: v.id("tenants"),
        includeInactive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, includeInactive }) => {
        const groups = await ctx.runQuery(
            components.catalog.queries.listAmenityGroups,
            {
                tenantId: tenantId as string,
                isActive: includeInactive ? undefined : true,
            }
        );

        return groups;
    },
});

/**
 * Get amenities grouped by their groups
 */
export const getGrouped = query({
    args: {
        tenantId: v.id("tenants"),
        includeInactive: v.optional(v.boolean()),
    },
    handler: async (ctx, { tenantId, includeInactive }) => {
        const groups = await ctx.runQuery(
            components.catalog.queries.listAmenityGroups,
            {
                tenantId: tenantId as string,
                isActive: includeInactive ? undefined : true,
            }
        );

        const amenities = await ctx.runQuery(
            components.catalog.queries.listAmenities,
            {
                tenantId: tenantId as string,
                isActive: includeInactive ? undefined : true,
            }
        );

        return groups.map((group: any) => ({
            ...group,
            amenities: amenities
                .filter((a: any) => a.groupId === group._id)
                .sort((a: any, b: any) => a.displayOrder - b.displayOrder),
        }));
    },
});

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create an amenity group
 */
export const createGroup = mutation({
    args: {
        tenantId: v.id("tenants"),
        name: v.string(),
        slug: v.optional(v.string()),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        displayOrder: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const slug = args.slug || args.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        const result = await ctx.runMutation(
            components.catalog.mutations.createAmenityGroup,
            {
                tenantId: args.tenantId as string,
                name: args.name,
                slug,
                description: args.description,
                icon: args.icon,
                displayOrder: args.displayOrder,
                metadata: {},
            }
        );

        return result.id;
    },
});

/**
 * Create an amenity
 */
export const create = mutation({
    args: {
        tenantId: v.id("tenants"),
        groupId: v.optional(v.id("amenityGroups")),
        name: v.string(),
        slug: v.optional(v.string()),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        displayOrder: v.optional(v.number()),
        isHighlighted: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const slug = args.slug || args.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        const result = await ctx.runMutation(
            components.catalog.mutations.createAmenity,
            {
                tenantId: args.tenantId as string,
                groupId: args.groupId,
                name: args.name,
                slug,
                description: args.description,
                icon: args.icon,
                displayOrder: args.displayOrder,
                isHighlighted: args.isHighlighted,
                metadata: {},
            }
        );

        return result.id;
    },
});

/**
 * Update an amenity
 */
export const update = mutation({
    args: {
        id: v.id("amenities"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        displayOrder: v.optional(v.number()),
        isHighlighted: v.optional(v.boolean()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, { id, ...updates }) => {
        await ctx.runMutation(
            components.catalog.mutations.updateAmenity,
            {
                id,
                ...updates,
            }
        );

        return id;
    },
});

/**
 * Bulk create amenities (for seeding)
 */
export const bulkCreate = mutation({
    args: {
        tenantId: v.id("tenants"),
        amenities: v.array(
            v.object({
                key: v.string(),
                name: v.string(),
                icon: v.optional(v.string()),
                description: v.optional(v.string()),
                isHighlighted: v.optional(v.boolean()),
            })
        ),
    },
    handler: async (ctx, { tenantId, amenities }) => {
        let createdCount = 0;
        const tenantIdStr = tenantId as string;

        for (let i = 0; i < amenities.length; i++) {
            const amenity = amenities[i];
            const slug = amenity.key.toLowerCase().replace(/_/g, "-");

            // Check if amenity with this slug exists via component
            const existingAmenities = await ctx.runQuery(
                components.catalog.queries.listAmenities,
                { tenantId: tenantIdStr }
            );
            const existing = existingAmenities.find((a: any) => a.slug === slug);

            if (existing) {
                await ctx.runMutation(
                    components.catalog.mutations.updateAmenity,
                    {
                        id: existing._id,
                        name: amenity.name,
                        icon: amenity.icon,
                        description: amenity.description,
                        isHighlighted: amenity.isHighlighted ?? existing.isHighlighted,
                        displayOrder: i + 1,
                        isActive: true,
                    }
                );
            } else {
                await ctx.runMutation(
                    components.catalog.mutations.createAmenity,
                    {
                        tenantId: tenantIdStr,
                        name: amenity.name,
                        slug,
                        icon: amenity.icon,
                        description: amenity.description,
                        displayOrder: i + 1,
                        isHighlighted: amenity.isHighlighted ?? false,
                        metadata: {},
                    }
                );
            }
            createdCount++;
        }

        return { created: createdCount };
    },
});
