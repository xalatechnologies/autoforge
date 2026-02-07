/**
 * Billing Component — Mutation Functions
 *
 * Write operations for payments and invoices.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

// =============================================================================
// PAYMENT MUTATIONS
// =============================================================================

/**
 * Create a payment record
 */
export const createPayment = mutation({
    args: {
        tenantId: v.string(),
        bookingId: v.optional(v.string()),
        userId: v.optional(v.string()),
        provider: v.string(),
        reference: v.string(),
        amount: v.number(),
        currency: v.string(),
        description: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    returns: v.object({ id: v.string() }),
    handler: async (ctx, args) => {
        const now = Date.now();

        const paymentId = await ctx.db.insert("payments", {
            tenantId: args.tenantId,
            bookingId: args.bookingId,
            userId: args.userId,
            provider: args.provider,
            reference: args.reference,
            amount: args.amount,
            currency: args.currency,
            description: args.description,
            status: "created",
            metadata: args.metadata ?? {},
            createdAt: now,
            updatedAt: now,
        });

        return { id: paymentId as string };
    },
});

/**
 * Update payment status
 */
export const updatePaymentStatus = mutation({
    args: {
        id: v.id("payments"),
        status: v.string(),
        externalId: v.optional(v.string()),
        capturedAmount: v.optional(v.number()),
        refundedAmount: v.optional(v.number()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, status, externalId, capturedAmount, refundedAmount }) => {
        await ctx.db.patch(id, {
            status,
            externalId,
            capturedAmount,
            refundedAmount,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

// =============================================================================
// INVOICE MUTATIONS
// =============================================================================

/**
 * Create a new invoice
 */
export const createInvoice = mutation({
    args: {
        tenantId: v.string(),
        userId: v.optional(v.string()),
        organizationId: v.optional(v.string()),
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
        customerName: v.string(),
        customerEmail: v.optional(v.string()),
        customerAddress: v.optional(v.string()),
        customerOrgNumber: v.optional(v.string()),
        dueDate: v.number(),
        notes: v.optional(v.string()),
        bookingIds: v.optional(v.array(v.string())),
        createdBy: v.optional(v.string()),
    },
    returns: v.object({ id: v.string(), invoiceNumber: v.string() }),
    handler: async (ctx, args) => {
        const now = Date.now();

        // Generate invoice number
        const year = new Date().getFullYear();
        const existingInvoices = await ctx.db
            .query("invoices")
            .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
            .collect();
        const invoiceCount = existingInvoices.length + 1;
        const invoiceNumber = `INV-${year}-${String(invoiceCount).padStart(4, "0")}`;

        // Calculate totals
        const subtotal = args.lineItems.reduce((sum, item) => sum + item.amount, 0);
        const taxAmount = args.lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
        const totalAmount = subtotal + taxAmount;

        const invoiceId = await ctx.db.insert("invoices", {
            tenantId: args.tenantId,
            userId: args.userId,
            organizationId: args.organizationId,
            invoiceNumber,
            status: "draft",
            issueDate: now,
            dueDate: args.dueDate,
            subtotal,
            taxAmount,
            totalAmount,
            currency: "NOK",
            lineItems: args.lineItems,
            bookingIds: args.bookingIds,
            customerName: args.customerName,
            customerEmail: args.customerEmail,
            customerAddress: args.customerAddress,
            customerOrgNumber: args.customerOrgNumber,
            notes: args.notes,
            createdAt: now,
            updatedAt: now,
            createdBy: args.createdBy,
        });

        return { id: invoiceId as string, invoiceNumber };
    },
});

/**
 * Update invoice status
 */
export const updateInvoiceStatus = mutation({
    args: {
        id: v.id("invoices"),
        status: v.string(),
        paidDate: v.optional(v.number()),
        paymentId: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, status, paidDate, paymentId, paymentMethod }) => {
        const updates: Record<string, unknown> = {
            status,
            updatedAt: Date.now(),
        };

        if (paidDate) updates.paidDate = paidDate;
        if (paymentId) updates.paymentId = paymentId;
        if (paymentMethod) updates.paymentMethod = paymentMethod;

        await ctx.db.patch(id, updates);
        return { success: true };
    },
});

/**
 * Send an invoice (change status from draft to sent)
 */
export const sendInvoice = mutation({
    args: {
        id: v.id("invoices"),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id }) => {
        const invoice = await ctx.db.get(id);
        if (!invoice) throw new Error("Invoice not found");
        if (invoice.status !== "draft") throw new Error("Only draft invoices can be sent");

        await ctx.db.patch(id, {
            status: "sent",
            issueDate: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Mark invoice as paid
 */
export const markInvoicePaid = mutation({
    args: {
        id: v.id("invoices"),
        paymentId: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, paymentId, paymentMethod }) => {
        const invoice = await ctx.db.get(id);
        if (!invoice) throw new Error("Invoice not found");

        await ctx.db.patch(id, {
            status: "paid",
            paidDate: Date.now(),
            paymentId,
            paymentMethod,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Credit/cancel an invoice
 */
export const creditInvoice = mutation({
    args: {
        id: v.id("invoices"),
        reason: v.optional(v.string()),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, reason }) => {
        const invoice = await ctx.db.get(id);
        if (!invoice) throw new Error("Invoice not found");

        await ctx.db.patch(id, {
            status: "credited",
            internalNotes: reason
                ? `${invoice.internalNotes || ""}\nCredited: ${reason}`.trim()
                : invoice.internalNotes,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Store invoice PDF
 */
export const storeInvoicePdf = mutation({
    args: {
        id: v.id("invoices"),
        storageId: v.string(),
    },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, { id, storageId }) => {
        await ctx.db.patch(id, {
            pdfStorageId: storageId,
            updatedAt: Date.now(),
        });
        return { success: true };
    },
});
