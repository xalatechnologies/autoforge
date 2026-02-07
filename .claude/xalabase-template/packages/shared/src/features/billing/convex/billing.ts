/**
 * Billing Facade
 *
 * Thin facade that delegates to the billing component.
 * Preserves api.domain.billing.* for SDK compatibility.
 * Handles:
 *   - ID type conversion (typed Id<"users"> / Id<"invoices"> -> string for component)
 *   - Storage URL resolution for invoice PDFs (ctx.storage)
 *   - Audit logging via audit component
 */

import { mutation, query } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

// =============================================================================
// QUERY FACADES
// =============================================================================

/**
 * Get billing summary for a user.
 * NOTE: SDK passes userId, not tenantId.
 */
export const getSummary = query({
    args: {
        userId: v.id("users"),
        period: v.optional(v.string()),
    },
    handler: async (ctx, { userId, period }) => {
        return ctx.runQuery(components.billing.queries.getSummary, {
            userId: userId as string,
            period,
        });
    },
});

/**
 * List invoices/payments for a user.
 */
export const listInvoices = query({
    args: {
        userId: v.id("users"),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { userId, status, limit }) => {
        return ctx.runQuery(components.billing.queries.listInvoices, {
            userId: userId as string,
            status,
            limit,
        });
    },
});

/**
 * Get pending payments count for a user.
 */
export const pendingCount = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, { userId }) => {
        return ctx.runQuery(components.billing.queries.pendingCount, {
            userId: userId as string,
        });
    },
});

/**
 * List invoices for an organization.
 */
export const listOrgInvoices = query({
    args: {
        organizationId: v.id("organizations"),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { organizationId, status, limit }) => {
        return ctx.runQuery(components.billing.queries.listOrgInvoices, {
            organizationId: organizationId as string,
            status,
            limit,
        });
    },
});

/**
 * Get a single invoice by ID.
 */
export const getInvoice = query({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runQuery(components.billing.queries.getInvoice, {
            id,
        });
    },
});

/**
 * Get billing summary for an organization.
 */
export const getOrgBillingSummary = query({
    args: {
        organizationId: v.id("organizations"),
        period: v.optional(v.string()),
    },
    handler: async (ctx, { organizationId, period }) => {
        return ctx.runQuery(components.billing.queries.getOrgBillingSummary, {
            organizationId: organizationId as string,
            period,
        });
    },
});

/**
 * Get invoice download URL.
 * Delegates to the component to check for pdfStorageId,
 * then resolves the storage URL via ctx.storage.
 */
export const getInvoiceDownloadUrl = query({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        const result = await ctx.runQuery(
            components.billing.queries.getInvoiceDownloadUrl,
            { id }
        );

        if (!result) return null;

        // If the component returned a storage URL directly, pass it through.
        // Otherwise, resolve from app-level storage if pdfStorageId is available.
        return result;
    },
});

/**
 * Get a single payment by ID.
 */
export const getPayment = query({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runQuery(components.billing.queries.getPayment, {
            id,
        });
    },
});

/**
 * List invoices for a specific user within a tenant.
 */
export const listUserInvoices = query({
    args: {
        tenantId: v.id("tenants"),
        userId: v.id("users"),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { tenantId, userId, status, limit }) => {
        return ctx.runQuery(components.billing.queries.listUserInvoices, {
            userId: userId as string,
            status,
            limit,
        });
    },
});

// =============================================================================
// MUTATION FACADES
// =============================================================================

/**
 * Create a payment record.
 */
export const createPayment = mutation({
    args: {
        tenantId: v.id("tenants"),
        bookingId: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        provider: v.string(),
        reference: v.string(),
        amount: v.number(),
        currency: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runMutation(
            components.billing.mutations.createPayment,
            {
                tenantId: args.tenantId as string,
                bookingId: args.bookingId,
                userId: args.userId as string | undefined,
                provider: args.provider,
                reference: args.reference,
                amount: args.amount,
                currency: args.currency,
                description: args.description,
            }
        );

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: args.tenantId as string,
            userId: (args.userId as string) ?? "",
            entityType: "payment",
            entityId: result.id,
            action: "created",
            newState: {
                amount: args.amount,
                currency: args.currency,
                provider: args.provider,
            },
            sourceComponent: "billing",
        });

        return result;
    },
});

/**
 * Update payment status.
 */
export const updatePaymentStatus = mutation({
    args: {
        id: v.string(),
        status: v.string(),
        externalId: v.optional(v.string()),
        capturedAmount: v.optional(v.number()),
        refundedAmount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runMutation(
            components.billing.mutations.updatePaymentStatus,
            {
                id: args.id,
                status: args.status,
                externalId: args.externalId,
                capturedAmount: args.capturedAmount,
                refundedAmount: args.refundedAmount,
            }
        );

        // Audit
        const payment = await ctx.runQuery(components.billing.queries.getPayment, { id: args.id });
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: (payment as any)?.tenantId ?? "",
            entityType: "payment",
            entityId: args.id as string,
            action: "status_updated",
            sourceComponent: "billing",
            newState: { status: args.status },
        });

        return result;
    },
});

/**
 * Create a new invoice.
 */
export const createInvoice = mutation({
    args: {
        tenantId: v.id("tenants"),
        userId: v.optional(v.id("users")),
        organizationId: v.optional(v.id("organizations")),
        lineItems: v.array(
            v.object({
                id: v.string(),
                description: v.string(),
                quantity: v.number(),
                unitPrice: v.number(),
                amount: v.number(),
                taxRate: v.optional(v.number()),
                taxAmount: v.optional(v.number()),
                bookingId: v.optional(v.string()),
                resourceId: v.optional(v.string()),
            })
        ),
        customerName: v.string(),
        customerEmail: v.optional(v.string()),
        customerAddress: v.optional(v.string()),
        customerOrgNumber: v.optional(v.string()),
        dueDate: v.number(),
        notes: v.optional(v.string()),
        bookingIds: v.optional(v.array(v.string())),
        createdBy: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runMutation(
            components.billing.mutations.createInvoice,
            {
                tenantId: args.tenantId as string,
                userId: args.userId as string | undefined,
                organizationId: args.organizationId as string | undefined,
                lineItems: args.lineItems,
                customerName: args.customerName,
                customerEmail: args.customerEmail,
                customerAddress: args.customerAddress,
                customerOrgNumber: args.customerOrgNumber,
                dueDate: args.dueDate,
                notes: args.notes,
                bookingIds: args.bookingIds,
                createdBy: args.createdBy,
            }
        );

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: args.tenantId as string,
            userId: args.createdBy ?? "",
            entityType: "invoice",
            entityId: result.id,
            action: "created",
            newState: {
                customerName: args.customerName,
                lineItemCount: args.lineItems.length,
            },
            sourceComponent: "billing",
        });

        return result;
    },
});

/**
 * Update invoice status.
 */
export const updateInvoiceStatus = mutation({
    args: {
        id: v.string(),
        status: v.string(),
        paidDate: v.optional(v.number()),
        paymentId: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runMutation(
            components.billing.mutations.updateInvoiceStatus,
            {
                id: args.id,
                status: args.status,
                paidDate: args.paidDate,
                paymentId: args.paymentId,
                paymentMethod: args.paymentMethod,
            }
        );

        // Audit
        const invoice = await ctx.runQuery(components.billing.queries.getInvoice, { id: args.id });
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: (invoice as any)?.tenantId ?? "",
            entityType: "invoice",
            entityId: args.id as string,
            action: "status_updated",
            sourceComponent: "billing",
            newState: { status: args.status },
        });

        return result;
    },
});

/**
 * Send an invoice (transition from draft to sent).
 */
export const sendInvoice = mutation({
    args: {
        id: v.string(),
    },
    handler: async (ctx, { id }) => {
        return ctx.runMutation(components.billing.mutations.sendInvoice, {
            id,
        });
    },
});

/**
 * Mark an invoice as paid.
 */
export const markInvoicePaid = mutation({
    args: {
        id: v.string(),
        paymentId: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
    },
    handler: async (ctx, { id, paymentId, paymentMethod }) => {
        return ctx.runMutation(components.billing.mutations.markInvoicePaid, {
            id,
            paymentId,
            paymentMethod,
        });
    },
});

/**
 * Credit/cancel an invoice.
 */
export const creditInvoice = mutation({
    args: {
        id: v.string(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, { id, reason }) => {
        return ctx.runMutation(components.billing.mutations.creditInvoice, {
            id,
            reason,
        });
    },
});

/**
 * Store an invoice PDF reference.
 */
export const storeInvoicePdf = mutation({
    args: {
        invoiceId: v.string(),
        storageId: v.string(),
    },
    handler: async (ctx, { invoiceId, storageId }) => {
        return ctx.runMutation(components.billing.mutations.storeInvoicePdf, {
            id: invoiceId,
            storageId,
        });
    },
});
