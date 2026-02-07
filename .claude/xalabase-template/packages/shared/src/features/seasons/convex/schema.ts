/**
 * Seasons Component Schema
 *
 * Seasons, season applications, seasonal leases, and priority rules.
 * External references (tenantId, userId, resourceId, organizationId, reviewedBy)
 * use v.string() because component tables cannot reference app-level tables.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    seasons: defineTable({
        tenantId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
        applicationStartDate: v.optional(v.number()),
        applicationEndDate: v.optional(v.number()),
        status: v.string(), // "draft" | "open" | "closed" | "archived"
        type: v.string(), // "standard" | "summer" | "winter" | "custom"
        settings: v.any(),
        metadata: v.any(),
        isActive: v.boolean(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_status", ["status"])
        .index("by_dates", ["startDate", "endDate"]),

    seasonApplications: defineTable({
        tenantId: v.string(),
        seasonId: v.id("seasons"),
        userId: v.string(),
        organizationId: v.optional(v.string()),
        resourceId: v.optional(v.string()),
        weekday: v.optional(v.number()),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        priority: v.number(),
        status: v.string(), // "draft" | "submitted" | "approved" | "rejected" | "waitlisted" | "withdrawn"
        applicantName: v.optional(v.string()),
        applicantEmail: v.optional(v.string()),
        applicantPhone: v.optional(v.string()),
        applicationData: v.any(),
        notes: v.optional(v.string()),
        rejectionReason: v.optional(v.string()),
        reviewedBy: v.optional(v.string()),
        reviewedAt: v.optional(v.number()),
        metadata: v.any(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_season", ["seasonId"])
        .index("by_user", ["userId"])
        .index("by_organization", ["organizationId"])
        .index("by_status", ["status"]),

    seasonalLeases: defineTable({
        tenantId: v.string(),
        resourceId: v.string(),
        organizationId: v.string(),
        startDate: v.number(),
        endDate: v.number(),
        weekdays: v.array(v.number()),
        startTime: v.string(),
        endTime: v.string(),
        status: v.string(), // "active" | "expired" | "cancelled" | "pending"
        totalPrice: v.number(),
        currency: v.string(),
        notes: v.optional(v.string()),
        metadata: v.any(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_resource", ["resourceId"])
        .index("by_organization", ["organizationId"]),

    priorityRules: defineTable({
        tenantId: v.string(),
        seasonId: v.optional(v.id("seasons")),
        name: v.string(),
        description: v.optional(v.string()),
        rules: v.array(v.any()),
        priority: v.number(),
        isActive: v.boolean(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_season", ["seasonId"]),
});
