/**
 * Notifications Component Schema
 *
 * External references use v.string() for component isolation.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    notifications: defineTable({
        tenantId: v.string(),
        userId: v.string(),
        type: v.string(),
        title: v.string(),
        body: v.optional(v.string()),
        link: v.optional(v.string()),
        readAt: v.optional(v.number()),
        metadata: v.optional(v.any()),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_user", ["userId"])
        .index("by_user_unread", ["userId", "readAt"]),

    notificationPreferences: defineTable({
        tenantId: v.string(),
        userId: v.string(),
        channel: v.string(),
        category: v.string(),
        enabled: v.boolean(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_user", ["userId"]),
});
