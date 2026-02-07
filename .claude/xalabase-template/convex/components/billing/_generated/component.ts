/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    import: {
      importInvoice: FunctionReference<
        "mutation",
        "internal",
        {
          billingAddress?: {
            city?: string;
            country?: string;
            postalCode?: string;
            street?: string;
          };
          bookingIds?: Array<string>;
          createdAt: number;
          createdBy?: string;
          currency: string;
          customerAddress?: string;
          customerEmail?: string;
          customerName: string;
          customerOrgNumber?: string;
          dueDate: number;
          internalNotes?: string;
          invoiceNumber: string;
          issueDate: number;
          lineItems: Array<{
            amount: number;
            bookingId?: string;
            description: string;
            id: string;
            quantity: number;
            resourceId?: string;
            taxAmount?: number;
            taxRate?: number;
            unitPrice: number;
          }>;
          metadata?: any;
          notes?: string;
          organizationId?: string;
          paidDate?: number;
          paymentId?: string;
          paymentMethod?: string;
          pdfStorageId?: string;
          reference?: string;
          status: string;
          subtotal: number;
          taxAmount: number;
          tenantId: string;
          totalAmount: number;
          updatedAt: number;
          userId?: string;
        },
        { id: string },
        Name
      >;
      importPayment: FunctionReference<
        "mutation",
        "internal",
        {
          amount: number;
          bookingId?: string;
          capturedAmount?: number;
          createdAt: number;
          currency: string;
          description?: string;
          externalId?: string;
          metadata?: any;
          provider: string;
          redirectUrl?: string;
          reference: string;
          refundedAmount?: number;
          status: string;
          tenantId: string;
          updatedAt: number;
          userId?: string;
        },
        { id: string },
        Name
      >;
    };
    mutations: {
      createInvoice: FunctionReference<
        "mutation",
        "internal",
        {
          bookingIds?: Array<string>;
          createdBy?: string;
          customerAddress?: string;
          customerEmail?: string;
          customerName: string;
          customerOrgNumber?: string;
          dueDate: number;
          lineItems: Array<{
            amount: number;
            bookingId?: string;
            description: string;
            id: string;
            quantity: number;
            resourceId?: string;
            taxAmount?: number;
            taxRate?: number;
            unitPrice: number;
          }>;
          notes?: string;
          organizationId?: string;
          tenantId: string;
          userId?: string;
        },
        { id: string; invoiceNumber: string },
        Name
      >;
      createPayment: FunctionReference<
        "mutation",
        "internal",
        {
          amount: number;
          bookingId?: string;
          currency: string;
          description?: string;
          metadata?: any;
          provider: string;
          reference: string;
          tenantId: string;
          userId?: string;
        },
        { id: string },
        Name
      >;
      creditInvoice: FunctionReference<
        "mutation",
        "internal",
        { id: string; reason?: string },
        { success: boolean },
        Name
      >;
      markInvoicePaid: FunctionReference<
        "mutation",
        "internal",
        { id: string; paymentId?: string; paymentMethod?: string },
        { success: boolean },
        Name
      >;
      sendInvoice: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      storeInvoicePdf: FunctionReference<
        "mutation",
        "internal",
        { id: string; storageId: string },
        { success: boolean },
        Name
      >;
      updateInvoiceStatus: FunctionReference<
        "mutation",
        "internal",
        {
          id: string;
          paidDate?: number;
          paymentId?: string;
          paymentMethod?: string;
          status: string;
        },
        { success: boolean },
        Name
      >;
      updatePaymentStatus: FunctionReference<
        "mutation",
        "internal",
        {
          capturedAmount?: number;
          externalId?: string;
          id: string;
          refundedAmount?: number;
          status: string;
        },
        { success: boolean },
        Name
      >;
    };
    queries: {
      getInvoice: FunctionReference<
        "query",
        "internal",
        { id: string },
        any,
        Name
      >;
      getInvoiceDownloadUrl: FunctionReference<
        "query",
        "internal",
        { id: string },
        any,
        Name
      >;
      getOrgBillingSummary: FunctionReference<
        "query",
        "internal",
        { organizationId: string; period?: string },
        any,
        Name
      >;
      getPayment: FunctionReference<
        "query",
        "internal",
        { id: string },
        any,
        Name
      >;
      getSummary: FunctionReference<
        "query",
        "internal",
        { limit?: number; period?: string; userId: string },
        any,
        Name
      >;
      listInvoices: FunctionReference<
        "query",
        "internal",
        { limit?: number; status?: string; userId: string },
        Array<any>,
        Name
      >;
      listOrgInvoices: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          limit?: number;
          organizationId: string;
          status?: string;
        },
        any,
        Name
      >;
      listPayments: FunctionReference<
        "query",
        "internal",
        { limit?: number; status?: string; tenantId: string },
        Array<any>,
        Name
      >;
      listUserInvoices: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit?: number; status?: string; userId: string },
        any,
        Name
      >;
      pendingCount: FunctionReference<
        "query",
        "internal",
        { limit?: number; userId: string },
        { count: number },
        Name
      >;
    };
  };
