/**
 * Catalog Component Contract
 */

import { v } from "convex/values";
import { defineContract } from "../../lib/componentContract";

export const CONTRACT = defineContract({
    name: "catalog",
    version: "1.0.0",
    category: "domain",
    description: "Categories, amenity groups, amenities, and resource-amenity mappings",

    queries: {
        listCategories: {
            args: { tenantId: v.string() },
            returns: v.array(v.any()),
        },
        getCategory: {
            args: { id: v.string() },
            returns: v.any(),
        },
        getCategoryByKey: {
            args: { tenantId: v.string(), key: v.string() },
            returns: v.any(),
        },
        getCategoryTree: {
            args: { tenantId: v.string() },
            returns: v.array(v.any()),
        },
        listAmenityGroups: {
            args: { tenantId: v.string() },
            returns: v.array(v.any()),
        },
        listAmenities: {
            args: { tenantId: v.string() },
            returns: v.array(v.any()),
        },
        getAmenity: {
            args: { id: v.string() },
            returns: v.any(),
        },
        listForResource: {
            args: { resourceId: v.string() },
            returns: v.array(v.any()),
        },
    },

    mutations: {
        createCategory: {
            args: { tenantId: v.string() },
            returns: v.object({ id: v.string() }),
        },
        updateCategory: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        removeCategory: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        createAmenityGroup: {
            args: { tenantId: v.string() },
            returns: v.object({ id: v.string() }),
        },
        createAmenity: {
            args: { tenantId: v.string() },
            returns: v.object({ id: v.string() }),
        },
        updateAmenity: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        removeAmenity: {
            args: { id: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
        addToResource: {
            args: { resourceId: v.string(), amenityId: v.string() },
            returns: v.object({ id: v.string() }),
        },
        removeFromResource: {
            args: { resourceId: v.string(), amenityId: v.string() },
            returns: v.object({ success: v.boolean() }),
        },
    },

    emits: [
        "catalog.category.created",
        "catalog.category.updated",
        "catalog.category.deleted",
        "catalog.amenity.created",
        "catalog.amenity.updated",
        "catalog.amenity.deleted",
    ],

    subscribes: [
        "resources.resource.deleted",
    ],

    dependencies: {
        core: ["tenants", "resources"],
        components: [],
    },
});
