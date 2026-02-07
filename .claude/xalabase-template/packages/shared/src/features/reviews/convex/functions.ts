/**
 * Reviews Component Functions
 *
 * Pure component implementation — operates only on its own tables.
 * Uses v.string() for all external references (tenantId, resourceId, userId).
 * Data enrichment (user names, resource names) happens in the facade layer.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * List reviews for a tenant, optionally filtered by resource or status.
 */
export const list = query({
    args: {
        tenantId: v.string(),
        resourceId: v.optional(v.string()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, resourceId, status, limit }) => {
        let reviews;

        if (resourceId) {
            reviews = await ctx.db
                .query("reviews")
                .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
                .collect();
            // Ensure tenant isolation
            reviews = reviews.filter((r) => r.tenantId === tenantId);
        } else {
            reviews = await ctx.db
                .query("reviews")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
                .collect();
        }

        if (status) {
            reviews = reviews.filter((r) => r.status === status);
        }

        // Sort newest first
        reviews.sort((a, b) => b._creationTime - a._creationTime);

        if (limit) {
            reviews = reviews.slice(0, limit);
        }

        return reviews;
    },
});

/**
 * Get a single review by ID.
 */
export const get = query({
    args: {
        id: v.id("reviews"),
    },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const review = await ctx.db.get(id);
        if (!review) {
            throw new Error("Review not found");
        }
        return review;
    },
});

/**
 * Get review stats for a resource (count + average rating).
 */
export const stats = query({
    args: {
        resourceId: v.string(),
    },
    returns: v.object({
        total: v.number(),
        averageRating: v.number(),
        distribution: v.any(),
        pending: v.number(),
    }),
    handler: async (ctx, { resourceId }) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_resource", (q) => q.eq("resourceId", resourceId))
            .collect();

        const approved = reviews.filter((r) => r.status === "approved");
        const total = approved.length;
        const averageRating =
            total > 0
                ? approved.reduce((sum, r) => sum + r.rating, 0) / total
                : 0;

        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const review of approved) {
            distribution[review.rating] = (distribution[review.rating] || 0) + 1;
        }

        return {
            total,
            averageRating: Math.round(averageRating * 10) / 10,
            distribution,
            pending: reviews.filter((r) => r.status === "pending").length,
        };
    },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new review.
 */
export const create = mutation({
    args: {
        tenantId: v.string(),
        resourceId: v.string(),
        userId: v.string(),
        rating: v.number(),
        title: v.optional(v.string()),
        text: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        // Validate rating
        if (args.rating < 1 || args.rating > 5) {
            throw new Error("Rating must be between 1 and 5");
        }

        // Check for duplicate review
        const existing = await ctx.db
            .query("reviews")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const duplicate = existing.find(
            (r) =>
                r.resourceId === args.resourceId &&
                r.status !== "rejected"
        );

        if (duplicate) {
            throw new Error("User has already reviewed this resource");
        }

        const reviewId = await ctx.db.insert("reviews", {
            tenantId: args.tenantId,
            resourceId: args.resourceId,
            userId: args.userId,
            rating: args.rating,
            title: args.title,
            text: args.text,
            status: "pending",
            metadata: args.metadata || {},
        });

        return { id: reviewId as string };
    },
});

/**
 * Update an existing review.
 */
export const update = mutation({
    args: {
        id: v.id("reviews"),
        rating: v.optional(v.number()),
        title: v.optional(v.string()),
        text: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, ...updates }) => {
        const review = await ctx.db.get(id);
        if (!review) {
            throw new Error("Review not found");
        }

        if (review.status === "rejected") {
            throw new Error("Cannot update a rejected review");
        }

        if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
            throw new Error("Rating must be between 1 and 5");
        }

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        // Reset moderation status on edit
        await ctx.db.patch(id, {
            ...filteredUpdates,
            status: "pending",
        });

        return { success: true };
    },
});

/**
 * Remove a review.
 */
export const remove = mutation({
    args: {
        id: v.id("reviews"),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const review = await ctx.db.get(id);
        if (!review) {
            throw new Error("Review not found");
        }

        await ctx.db.delete(id);
        return { success: true };
    },
});

/**
 * Moderate a review (approve/reject/flag).
 */
export const moderate = mutation({
    args: {
        id: v.id("reviews"),
        status: v.union(
            v.literal("approved"),
            v.literal("rejected"),
            v.literal("flagged")
        ),
        moderatedBy: v.string(),
        moderationNote: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, status, moderatedBy, moderationNote }) => {
        const review = await ctx.db.get(id);
        if (!review) {
            throw new Error("Review not found");
        }

        await ctx.db.patch(id, {
            status,
            moderatedBy,
            moderatedAt: Date.now(),
            moderationNote,
        });

        return { success: true };
    },
});

/**
 * Import a record from the legacy reviews table.
 * Used during data migration.
 */
export const importRecord = mutation({
    args: {
        tenantId: v.string(),
        resourceId: v.string(),
        userId: v.string(),
        rating: v.number(),
        title: v.optional(v.string()),
        text: v.optional(v.string()),
        status: v.string(),
        moderatedBy: v.optional(v.string()),
        moderatedAt: v.optional(v.number()),
        moderationNote: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("reviews", {
            tenantId: args.tenantId,
            resourceId: args.resourceId,
            userId: args.userId,
            rating: args.rating,
            title: args.title,
            text: args.text,
            status: args.status,
            moderatedBy: args.moderatedBy,
            moderatedAt: args.moderatedAt,
            moderationNote: args.moderationNote,
            metadata: args.metadata ?? {},
        });

        return { id: id as string };
    },
});
