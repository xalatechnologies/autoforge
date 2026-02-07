/**
 * Resources Component Schema
 *
 * The central entity for bookings, pricing, reviews, etc.
 * External references (tenantId, organizationId) use v.string().
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    resources: defineTable({
        tenantId: v.string(),
        organizationId: v.optional(v.string()),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        categoryKey: v.string(),
        subcategoryKeys: v.optional(v.array(v.string())),
        timeMode: v.string(),
        features: v.array(v.any()),
        ruleSetKey: v.optional(v.string()),
        status: v.string(),
        requiresApproval: v.boolean(),
        capacity: v.optional(v.number()),
        inventoryTotal: v.optional(v.number()),
        images: v.array(v.any()),
        pricing: v.any(),
        metadata: v.any(),
        allowSeasonRental: v.optional(v.boolean()),
        allowRecurringBooking: v.optional(v.boolean()),
        openingHours: v.optional(v.array(v.object({
            dayIndex: v.number(),
            day: v.string(),
            open: v.string(),
            close: v.string(),
            isClosed: v.optional(v.boolean()),
        }))),
        slotDurationMinutes: v.optional(v.number()),
        minBookingDuration: v.optional(v.number()),
        maxBookingDuration: v.optional(v.number()),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_slug", ["tenantId", "slug"])
        .index("by_category", ["categoryKey"])
        .index("by_status", ["status"]),
});
