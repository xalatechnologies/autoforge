/**
 * Billing Component — Query Functions
 *
 * Read-only operations for payments, invoices, and billing summaries.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// PAYMENT QUERIES
// =============================================================================

/**
 * Get billing summary for a user
 */
export const getSummary = query({
    args: {
        userId: v.string(),
        period: v.optional(v.string()), // "month", "quarter", "year", "all"
        limit: v.optional(v.number()),
    },
    returns: v.any(),
    handler: async (ctx, { userId, period = "month", limit = 1000 }) => {
        // Get all payments for this user
        const payments = await ctx.db
            .query("payments")
            .filter((q) => q.eq(q.field("userId"), userId))
            .take(limit);

        // Compute date range based on period
        const now = Date.now();
        let startTime = 0;
        if (period === "month") {
            startTime = now - 30 * 24 * 60 * 60 * 1000;
        } else if (period === "quarter") {
            startTime = now - 90 * 24 * 60 * 60 * 1000;
        } else if (period === "year") {
            startTime = now - 365 * 24 * 60 * 60 * 1000;
        }

        // Filter payments in range
        const filteredPayments = payments.filter((p) => p.createdAt >= startTime);

        // Calculate totals from payments
        const totalSpent = filteredPayments
            .filter((p) => p.status === "captured" || p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0);

        const pendingAmount = filteredPayments
            .filter((p) => p.status === "created" || p.status === "authorized")
            .reduce((sum, p) => sum + p.amount, 0);

        return {
            totalSpent,
            pendingAmount,
            currency: "NOK",
            paymentCount: filteredPayments.length,
            period,
        };
    },
});

/**
 * List invoices/payments for a user
 */
export const listInvoices = query({
    args: {
        userId: v.string(),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { userId, status, limit = 50 }) => {
        // Get payments for this user
        const payments = await ctx.db
            .query("payments")
            .filter((q) => q.eq(q.field("userId"), userId))
            .order("desc")
            .take(limit);

        let filtered = payments;
        if (status) {
            filtered = payments.filter((p) => p.status === status);
        }

        // Return payment records — enrichment with booking/resource happens in facade
        return filtered.map((p) => ({
            id: p._id,
            reference: p.reference,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            description: p.description || "Payment",
            createdAt: new Date(p.createdAt).toISOString(),
            bookingId: p.bookingId,
        }));
    },
});

/**
 * Get a single payment/invoice
 */
export const getPayment = query({
    args: {
        id: v.id("payments"),
    },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const payment = await ctx.db.get(id);
        if (!payment) {
            throw new Error("Payment not found");
        }

        // Return raw payment — enrichment with booking/resource happens in facade
        return payment;
    },
});

/**
 * List payments for a tenant, optionally filtered by status.
 */
export const listPayments = query({
    args: {
        tenantId: v.string(),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { tenantId, status, limit = 50 }) => {
        if (status) {
            return await ctx.db
                .query("payments")
                .withIndex("by_status", (q) =>
                    q.eq("tenantId", tenantId).eq("status", status)
                )
                .order("desc")
                .take(limit);
        }

        return await ctx.db
            .query("payments")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .order("desc")
            .take(limit);
    },
});

/**
 * Get pending payments count for a user
 */
export const pendingCount = query({
    args: {
        userId: v.string(),
        limit: v.optional(v.number()),
    },
    returns: v.object({ count: v.number() }),
    handler: async (ctx, { userId, limit = 1000 }) => {
        const payments = await ctx.db
            .query("payments")
            .filter((q) =>
                q.and(
                    q.eq(q.field("userId"), userId),
                    q.or(
                        q.eq(q.field("status"), "created"),
                        q.eq(q.field("status"), "authorized")
                    )
                )
            )
            .take(limit);

        return { count: payments.length };
    },
});

// =============================================================================
// INVOICE QUERIES
// =============================================================================

/**
 * List invoices for a user
 */
export const listUserInvoices = query({
    args: {
        userId: v.string(),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
        cursor: v.optional(v.string()),
    },
    returns: v.any(),
    handler: async (ctx, { userId, status, limit = 50 }) => {
        let invoices = await ctx.db
            .query("invoices")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .take(limit);

        if (status) {
            invoices = invoices.filter((inv) => inv.status === status);
        }

        return {
            data: invoices,
            meta: {
                total: invoices.length,
                limit,
                hasMore: invoices.length === limit,
            },
        };
    },
});

/**
 * List invoices for an organization
 */
export const listOrgInvoices = query({
    args: {
        organizationId: v.string(),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
        cursor: v.optional(v.string()),
    },
    returns: v.any(),
    handler: async (ctx, { organizationId, status, limit = 50 }) => {
        let invoices = await ctx.db
            .query("invoices")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .order("desc")
            .take(limit);

        if (status) {
            invoices = invoices.filter((inv) => inv.status === status);
        }

        return {
            data: invoices,
            meta: {
                total: invoices.length,
                limit,
                hasMore: invoices.length === limit,
            },
        };
    },
});

/**
 * Get a single invoice by ID
 */
export const getInvoice = query({
    args: {
        id: v.id("invoices"),
    },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const invoice = await ctx.db.get(id);
        if (!invoice) {
            throw new Error("Invoice not found");
        }

        // Return raw invoice — enrichment with user/org happens in facade
        return invoice;
    },
});

// =============================================================================
// BILLING SUMMARIES
// =============================================================================

/**
 * Get billing summary for an organization
 */
export const getOrgBillingSummary = query({
    args: {
        organizationId: v.string(),
        period: v.optional(v.string()),
    },
    returns: v.any(),
    handler: async (ctx, { organizationId, period = "month" }) => {
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .take(1000);

        const now = Date.now();
        let startTime = 0;
        if (period === "month") {
            startTime = now - 30 * 24 * 60 * 60 * 1000;
        } else if (period === "quarter") {
            startTime = now - 90 * 24 * 60 * 60 * 1000;
        } else if (period === "year") {
            startTime = now - 365 * 24 * 60 * 60 * 1000;
        }

        const filteredInvoices = invoices.filter((inv) => inv.createdAt >= startTime);

        const totalBilled = filteredInvoices
            .filter((inv) => inv.status === "paid" || inv.status === "sent")
            .reduce((sum, inv) => sum + inv.totalAmount, 0);

        const pendingAmount = filteredInvoices
            .filter((inv) => inv.status === "sent")
            .reduce((sum, inv) => sum + inv.totalAmount, 0);

        const overdueAmount = filteredInvoices
            .filter((inv) => inv.status === "overdue" || (inv.status === "sent" && inv.dueDate < now))
            .reduce((sum, inv) => sum + inv.totalAmount, 0);

        const paidAmount = filteredInvoices
            .filter((inv) => inv.status === "paid")
            .reduce((sum, inv) => sum + inv.totalAmount, 0);

        return {
            totalBilled,
            pendingAmount,
            overdueAmount,
            paidAmount,
            invoiceCount: filteredInvoices.length,
            currency: "NOK",
            period,
        };
    },
});

/**
 * Get invoice download URL (for PDF)
 */
export const getInvoiceDownloadUrl = query({
    args: {
        id: v.id("invoices"),
    },
    returns: v.any(),
    handler: async (ctx, { id }) => {
        const invoice = await ctx.db.get(id);
        if (!invoice) {
            throw new Error("Invoice not found");
        }

        if (!invoice.pdfStorageId) {
            return { url: null, invoiceNumber: invoice.invoiceNumber };
        }

        const url = await ctx.storage.getUrl(invoice.pdfStorageId);
        return { url, invoiceNumber: invoice.invoiceNumber };
    },
});
