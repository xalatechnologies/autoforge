/**
 * Resources Component — Mutation Functions
 *
 * Write operations for resources including CRUD, lifecycle, and import.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Valid status transitions (state machine)
const VALID_TRANSITIONS: Record<string, string[]> = {
    draft: ["published", "archived", "deleted"],
    published: ["draft", "archived", "deleted"],
    archived: ["draft"],
    deleted: [],
};

function validateStatusTransition(currentStatus: string, targetStatus: string): void {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed) throw new Error(`Unknown resource status: "${currentStatus}"`);
    if (!allowed.includes(targetStatus)) {
        throw new Error(`Invalid status transition: "${currentStatus}" → "${targetStatus}". Allowed: [${allowed.join(", ")}]`);
    }
}

// =============================================================================
// MUTATIONS
// =============================================================================

export const create = mutation({
    args: {
        tenantId: v.string(),
        organizationId: v.optional(v.string()),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        categoryKey: v.string(),
        timeMode: v.optional(v.string()),
        status: v.optional(v.string()),
        requiresApproval: v.optional(v.boolean()),
        capacity: v.optional(v.number()),
        images: v.optional(v.array(v.any())),
        pricing: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("resources")
            .withIndex("by_slug", (q) => q.eq("tenantId", args.tenantId).eq("slug", args.slug))
            .first();
        if (existing) throw new Error(`Resource with slug "${args.slug}" already exists`);

        const id = await ctx.db.insert("resources", {
            tenantId: args.tenantId,
            organizationId: args.organizationId,
            name: args.name,
            slug: args.slug,
            description: args.description,
            categoryKey: args.categoryKey,
            timeMode: args.timeMode || "PERIOD",
            features: [],
            status: args.status || "draft",
            requiresApproval: args.requiresApproval || false,
            capacity: args.capacity,
            inventoryTotal: args.capacity,
            images: args.images || [],
            pricing: args.pricing || {},
            metadata: args.metadata || {},
        });
        return { id: id as string };
    },
});

export const update = mutation({
    args: {
        id: v.id("resources"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        status: v.optional(v.string()),
        requiresApproval: v.optional(v.boolean()),
        capacity: v.optional(v.number()),
        images: v.optional(v.array(v.any())),
        pricing: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, ...updates }) => {
        if (!await ctx.db.get(id)) throw new Error("Resource not found");
        const filtered = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
        await ctx.db.patch(id, filtered);
        return { success: true };
    },
});

export const remove = mutation({
    args: { id: v.id("resources") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const r = await ctx.db.get(id);
        if (!r) throw new Error("Resource not found");
        validateStatusTransition(r.status, "deleted");
        await ctx.db.patch(id, { status: "deleted" });
        return { success: true };
    },
});

export const publish = mutation({
    args: { id: v.id("resources") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const r = await ctx.db.get(id);
        if (!r) throw new Error("Resource not found");
        validateStatusTransition(r.status, "published");
        await ctx.db.patch(id, { status: "published" });
        return { success: true };
    },
});

export const unpublish = mutation({
    args: { id: v.id("resources") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const r = await ctx.db.get(id);
        if (!r) throw new Error("Resource not found");
        validateStatusTransition(r.status, "draft");
        await ctx.db.patch(id, { status: "draft" });
        return { success: true };
    },
});

export const archive = mutation({
    args: { id: v.id("resources") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const r = await ctx.db.get(id);
        if (!r) throw new Error("Resource not found");
        validateStatusTransition(r.status, "archived");
        await ctx.db.patch(id, { status: "archived" });
        // NOTE: Cascade (cancel bookings, deactivate blocks) happens in the facade layer
        return { success: true };
    },
});

export const restore = mutation({
    args: { id: v.id("resources") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const r = await ctx.db.get(id);
        if (!r) throw new Error("Resource not found");
        validateStatusTransition(r.status, "draft");
        await ctx.db.patch(id, { status: "draft" });
        return { success: true };
    },
});

export const cloneResource = mutation({
    args: { id: v.id("resources") },
    returns: v.object({ id: v.string(), slug: v.string() }),
    handler: async (ctx, { id }) => {
        const resource = await ctx.db.get(id);
        if (!resource) throw new Error("Resource not found");

        const baseSlug = resource.slug.replace(/-copy(-\d+)?$/, "");
        let newSlug = `${baseSlug}-copy`;
        let suffix = 1;
        while (true) {
            const existing = await ctx.db.query("resources")
                .withIndex("by_slug", (q) => q.eq("tenantId", resource.tenantId).eq("slug", newSlug))
                .first();
            if (!existing) break;
            suffix++;
            newSlug = `${baseSlug}-copy-${suffix}`;
        }

        const { _id, _creationTime, status, ...fields } = resource;
        const newId = await ctx.db.insert("resources", {
            ...fields,
            name: `${resource.name} (Copy)`,
            slug: newSlug,
            status: "draft",
        });
        // NOTE: Cloning related data (amenities, pricing, addons) happens in the facade
        return { id: newId as string, slug: newSlug };
    },
});

export const importResource = mutation({
    args: {
        tenantId: v.string(), organizationId: v.optional(v.string()),
        name: v.string(), slug: v.string(), description: v.optional(v.string()),
        categoryKey: v.string(), subcategoryKeys: v.optional(v.array(v.string())),
        timeMode: v.string(), features: v.array(v.any()),
        ruleSetKey: v.optional(v.string()), status: v.string(),
        requiresApproval: v.boolean(), capacity: v.optional(v.number()),
        inventoryTotal: v.optional(v.number()),
        images: v.array(v.any()), pricing: v.any(), metadata: v.any(),
        allowSeasonRental: v.optional(v.boolean()),
        allowRecurringBooking: v.optional(v.boolean()),
        openingHours: v.optional(v.array(v.any())),
        slotDurationMinutes: v.optional(v.number()),
        minBookingDuration: v.optional(v.number()),
        maxBookingDuration: v.optional(v.number()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("resources", args as any);
        return { id: id as string };
    },
});

/**
 * Admin: Reassign a resource to a different tenant/organization.
 */
export const reassignTenant = mutation({
    args: {
        id: v.id("resources"),
        tenantId: v.string(),
        organizationId: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, tenantId, organizationId }) => {
        const r = await ctx.db.get(id);
        if (!r) throw new Error("Resource not found");
        await ctx.db.patch(id, { tenantId, organizationId });
        return { success: true };
    },
});

/**
 * Admin: Hard delete a resource (permanent).
 */
export const hardDelete = mutation({
    args: { id: v.id("resources") },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const r = await ctx.db.get(id);
        if (!r) throw new Error("Resource not found");
        await ctx.db.delete(id);
        return { success: true };
    },
});
