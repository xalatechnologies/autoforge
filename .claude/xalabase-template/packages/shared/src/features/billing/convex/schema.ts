/**
 * Billing Component Schema
 *
 * Payments and invoices for tenant-scoped billing.
 * External references (tenantId, userId, bookingId, etc.) use v.string()
 * because component tables cannot reference app-level tables via v.id().
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    payments: defineTable({
        tenantId: v.string(),
        bookingId: v.optional(v.string()),
        userId: v.optional(v.string()),
        provider: v.string(),
        reference: v.string(),
        externalId: v.optional(v.string()),
        amount: v.number(),
        currency: v.string(),
        description: v.optional(v.string()),
        status: v.string(),
        redirectUrl: v.optional(v.string()),
        capturedAmount: v.optional(v.number()),
        refundedAmount: v.optional(v.number()),
        metadata: v.optional(v.any()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_booking", ["bookingId"])
        .index("by_reference", ["reference"])
        .index("by_status", ["tenantId", "status"]),

    invoices: defineTable({
        tenantId: v.string(),
        userId: v.optional(v.string()),
        organizationId: v.optional(v.string()),
        // Invoice identification
        invoiceNumber: v.string(),
        reference: v.optional(v.string()),
        // Status
        status: v.string(),
        // Dates
        issueDate: v.number(),
        dueDate: v.number(),
        paidDate: v.optional(v.number()),
        // Amounts (in minor units — øre for NOK)
        subtotal: v.number(),
        taxAmount: v.number(),
        totalAmount: v.number(),
        currency: v.string(),
        // Line items
        lineItems: v.array(v.object({
            id: v.string(),
            description: v.string(),
            quantity: v.number(),
            unitPrice: v.number(),
            amount: v.number(),
            taxRate: v.optional(v.number()),
            taxAmount: v.optional(v.number()),
            bookingId: v.optional(v.string()),
            resourceId: v.optional(v.string()),
        })),
        // Related bookings
        bookingIds: v.optional(v.array(v.string())),
        // Payment info
        paymentId: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
        // Customer info (denormalized for invoice display)
        customerName: v.string(),
        customerEmail: v.optional(v.string()),
        customerAddress: v.optional(v.string()),
        customerOrgNumber: v.optional(v.string()),
        // Billing address
        billingAddress: v.optional(v.object({
            street: v.optional(v.string()),
            postalCode: v.optional(v.string()),
            city: v.optional(v.string()),
            country: v.optional(v.string()),
        })),
        // Notes
        notes: v.optional(v.string()),
        internalNotes: v.optional(v.string()),
        // Audit
        createdAt: v.number(),
        updatedAt: v.number(),
        createdBy: v.optional(v.string()),
        // PDF storage
        pdfStorageId: v.optional(v.string()),
        metadata: v.optional(v.any()),
    })
        .index("by_tenant", ["tenantId"])
        .index("by_user", ["userId"])
        .index("by_organization", ["organizationId"])
        .index("by_status", ["tenantId", "status"])
        .index("by_invoice_number", ["invoiceNumber"])
        .index("by_due_date", ["tenantId", "dueDate"]),
});
