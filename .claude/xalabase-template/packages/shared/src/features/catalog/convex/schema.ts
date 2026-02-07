/**
 * Catalog Component Schema
 *
 * Categories, amenity groups, amenities, and resource-amenity associations.
 * External references use v.string() for component isolation.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    categories: defineTable({
        tenantId: v.string(),
        parentId: v.optional(v.id("categories")),
        key: v.optional(v.string()),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        color: v.optional(v.string()),
        sortOrder: v.optional(v.number()),
        settings: v.any(),
        isActive: v.boolean(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_parent", ["parentId"])
        .index("by_slug", ["tenantId", "slug"])
        .index("by_key", ["tenantId", "key"])
        .index("by_tenant_active", ["tenantId", "isActive"]),

    amenityGroups: defineTable({
        tenantId: v.string(),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        displayOrder: v.number(),
        isActive: v.boolean(),
        metadata: v.any(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_slug", ["tenantId", "slug"]),

    amenities: defineTable({
        tenantId: v.string(),
        groupId: v.optional(v.id("amenityGroups")),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        displayOrder: v.number(),
        isHighlighted: v.boolean(),
        isActive: v.boolean(),
        metadata: v.any(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_group", ["groupId"])
        .index("by_slug", ["tenantId", "slug"]),

    resourceAmenities: defineTable({
        tenantId: v.string(),
        resourceId: v.string(),
        amenityId: v.id("amenities"),
        quantity: v.number(),
        notes: v.optional(v.string()),
        isIncluded: v.boolean(),
        additionalCost: v.optional(v.number()),
        metadata: v.any(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_resource", ["resourceId"])
        .index("by_amenity", ["amenityId"]),
});
