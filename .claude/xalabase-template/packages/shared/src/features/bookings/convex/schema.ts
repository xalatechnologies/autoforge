/**
 * Bookings Component Schema
 *
 * Covers bookings, blocks, allocations, bookingConflicts, and rentalAgreements.
 * External references (tenantId, resourceId, userId, organizationId) use v.string()
 * for component isolation.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    bookings: defineTable({
        tenantId: v.string(),
        resourceId: v.string(),
        userId: v.string(),
        organizationId: v.optional(v.string()),
        status: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        totalPrice: v.number(),
        currency: v.string(),
        notes: v.optional(v.string()),
        metadata: v.any(),
        version: v.number(),
        submittedAt: v.optional(v.number()),
        approvedBy: v.optional(v.string()),
        approvedAt: v.optional(v.number()),
        rejectionReason: v.optional(v.string()),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_resource", ["resourceId"])
        .index("by_user", ["userId"])
        .index("by_status", ["status"])
        .index("by_organization", ["organizationId"])
        .index("by_time_range", ["resourceId", "startTime", "endTime"]),

    blocks: defineTable({
        tenantId: v.string(),
        resourceId: v.string(),
        title: v.string(),
        reason: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
        allDay: v.boolean(),
        recurring: v.boolean(),
        recurrenceRule: v.optional(v.string()),
        visibility: v.string(),
        status: v.string(),
        createdBy: v.optional(v.string()),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_resource", ["resourceId"])
        .index("by_time_range", ["startDate", "endDate"]),

    allocations: defineTable({
        tenantId: v.string(),
        organizationId: v.optional(v.string()),
        resourceId: v.string(),
        title: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        status: v.string(),
        bookingId: v.optional(v.id("bookings")),
        userId: v.optional(v.string()),
        notes: v.optional(v.string()),
        recurring: v.any(),
        metadata: v.any(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_resource", ["resourceId"])
        .index("by_time", ["startTime", "endTime"]),

    bookingConflicts: defineTable({
        tenantId: v.string(),
        resourceId: v.string(),
        bookingId: v.id("bookings"),
        conflictingBookingId: v.id("bookings"),
        conflictType: v.string(),
        severity: v.string(),
        description: v.optional(v.string()),
        overlapStart: v.optional(v.number()),
        overlapEnd: v.optional(v.number()),
        resolvedAt: v.optional(v.number()),
        resolvedBy: v.optional(v.string()),
        resolution: v.optional(v.string()),
        resolutionNotes: v.optional(v.string()),
        metadata: v.any(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_resource", ["resourceId"])
        .index("by_booking", ["bookingId"]),

    rentalAgreements: defineTable({
        tenantId: v.string(),
        bookingId: v.optional(v.id("bookings")),
        resourceId: v.string(),
        userId: v.string(),
        agreementType: v.string(),
        agreementVersion: v.string(),
        agreementText: v.string(),
        isSigned: v.boolean(),
        signatureData: v.optional(v.any()),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        metadata: v.any(),
        signedAt: v.optional(v.number()),
    })
        .index("by_booking", ["bookingId"])
        .index("by_user", ["userId"]),
});
