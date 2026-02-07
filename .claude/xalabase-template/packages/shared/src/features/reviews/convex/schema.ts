/**
 * Reviews Component Schema
 *
 * External references (tenantId, resourceId, userId, moderatedBy)
 * use v.string() because component tables cannot reference app-level tables.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    reviews: defineTable({
        tenantId: v.string(),
        resourceId: v.string(),
        userId: v.string(),
        rating: v.number(),
        title: v.optional(v.string()),
        text: v.optional(v.string()),
        status: v.string(), // "pending" | "approved" | "rejected" | "flagged"
        moderatedBy: v.optional(v.string()),
        moderatedAt: v.optional(v.number()),
        moderationNote: v.optional(v.string()),
        metadata: v.optional(v.any()),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_resource", ["resourceId"])
        .index("by_user", ["userId"])
        .index("by_status", ["tenantId", "status"]),
});
