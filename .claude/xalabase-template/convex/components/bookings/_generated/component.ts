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
    allocations: {
      createAllocation: FunctionReference<
        "mutation",
        "internal",
        {
          bookingId?: string;
          endTime: number;
          metadata?: any;
          notes?: string;
          organizationId?: string;
          recurring?: any;
          resourceId: string;
          startTime: number;
          tenantId: string;
          title: string;
          userId?: string;
        },
        { id: string },
        Name
      >;
      getAllocation: FunctionReference<
        "query",
        "internal",
        { id: string },
        any,
        Name
      >;
      importAllocation: FunctionReference<
        "mutation",
        "internal",
        {
          bookingId?: string;
          endTime: number;
          metadata?: any;
          notes?: string;
          organizationId?: string;
          recurring?: any;
          resourceId: string;
          startTime: number;
          status: string;
          tenantId: string;
          title: string;
          userId?: string;
        },
        { id: string },
        Name
      >;
      importBlock: FunctionReference<
        "mutation",
        "internal",
        {
          allDay: boolean;
          createdBy?: string;
          endDate: number;
          reason?: string;
          recurrenceRule?: string;
          recurring: boolean;
          resourceId: string;
          startDate: number;
          status: string;
          tenantId: string;
          title: string;
          visibility: string;
        },
        { id: string },
        Name
      >;
      importBooking: FunctionReference<
        "mutation",
        "internal",
        {
          approvedAt?: number;
          approvedBy?: string;
          currency: string;
          endTime: number;
          metadata?: any;
          notes?: string;
          organizationId?: string;
          rejectionReason?: string;
          resourceId: string;
          startTime: number;
          status: string;
          submittedAt?: number;
          tenantId: string;
          totalPrice: number;
          userId: string;
          version: number;
        },
        { id: string },
        Name
      >;
      importBookingConflict: FunctionReference<
        "mutation",
        "internal",
        {
          bookingId: string;
          conflictType: string;
          conflictingBookingId: string;
          description?: string;
          metadata?: any;
          overlapEnd?: number;
          overlapStart?: number;
          resolution?: string;
          resolutionNotes?: string;
          resolvedAt?: number;
          resolvedBy?: string;
          resourceId: string;
          severity: string;
          tenantId: string;
        },
        { id: string },
        Name
      >;
      importRentalAgreement: FunctionReference<
        "mutation",
        "internal",
        {
          agreementText: string;
          agreementType: string;
          agreementVersion: string;
          bookingId?: string;
          ipAddress?: string;
          isSigned: boolean;
          metadata?: any;
          resourceId: string;
          signatureData?: any;
          signedAt?: number;
          tenantId: string;
          userAgent?: string;
          userId: string;
        },
        { id: string },
        Name
      >;
      listAllocations: FunctionReference<
        "query",
        "internal",
        {
          endDate?: number;
          resourceId?: string;
          startDate?: number;
          status?: string;
          tenantId: string;
        },
        Array<any>,
        Name
      >;
      removeAllocation: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
    };
    availability: {
      getResourceAvailability: FunctionReference<
        "query",
        "internal",
        {
          capacity?: number;
          endDate: string;
          maxBookingDuration?: number;
          mode: string;
          openingHours?: Array<any>;
          resourceId: string;
          slotDurationMinutes?: number;
          startDate: string;
        },
        any,
        Name
      >;
      validateBookingSlot: FunctionReference<
        "query",
        "internal",
        {
          capacity?: number;
          endTime: number;
          openingHours?: Array<any>;
          quantity?: number;
          resourceId: string;
          startTime: number;
        },
        any,
        Name
      >;
    };
    blocks: {
      checkAvailability: FunctionReference<
        "query",
        "internal",
        { endTime: number; resourceId: string; startTime: number },
        any,
        Name
      >;
      createBlock: FunctionReference<
        "mutation",
        "internal",
        {
          allDay?: boolean;
          createdBy?: string;
          endDate: number;
          reason?: string;
          recurrenceRule?: string;
          recurring?: boolean;
          resourceId: string;
          startDate: number;
          tenantId: string;
          title: string;
          visibility?: string;
        },
        { id: string },
        Name
      >;
      getAvailableSlots: FunctionReference<
        "query",
        "internal",
        { date: number; resourceId: string; slotDurationMinutes?: number },
        Array<any>,
        Name
      >;
      getBlock: FunctionReference<
        "query",
        "internal",
        { id: string },
        any,
        Name
      >;
      listBlocks: FunctionReference<
        "query",
        "internal",
        {
          endDate?: number;
          resourceId?: string;
          startDate?: number;
          status?: string;
          tenantId: string;
        },
        Array<any>,
        Name
      >;
      removeBlock: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      updateBlock: FunctionReference<
        "mutation",
        "internal",
        {
          allDay?: boolean;
          endDate?: number;
          id: string;
          reason?: string;
          recurrenceRule?: string;
          recurring?: boolean;
          startDate?: number;
          status?: string;
          title?: string;
          visibility?: string;
        },
        { success: boolean },
        Name
      >;
    };
    mutations: {
      approve: FunctionReference<
        "mutation",
        "internal",
        { approvedBy: string; id: string },
        { success: boolean },
        Name
      >;
      cancel: FunctionReference<
        "mutation",
        "internal",
        { cancelledBy: string; id: string; reason?: string },
        { success: boolean },
        Name
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          currency?: string;
          endTime: number;
          metadata?: any;
          notes?: string;
          organizationId?: string;
          resourceId: string;
          startTime: number;
          tenantId: string;
          totalPrice?: number;
          userId: string;
        },
        { id: string; status: string },
        Name
      >;
      reject: FunctionReference<
        "mutation",
        "internal",
        { id: string; reason?: string; rejectedBy: string },
        { success: boolean },
        Name
      >;
      update: FunctionReference<
        "mutation",
        "internal",
        {
          endTime?: number;
          id: string;
          metadata?: any;
          notes?: string;
          startTime?: number;
        },
        { success: boolean },
        Name
      >;
    };
    queries: {
      calendar: FunctionReference<
        "query",
        "internal",
        {
          endDate: number;
          resourceId?: string;
          startDate: number;
          tenantId: string;
        },
        any,
        Name
      >;
      get: FunctionReference<"query", "internal", { id: string }, any, Name>;
      list: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          resourceId?: string;
          startAfter?: number;
          startBefore?: number;
          status?: string;
          tenantId: string;
          userId?: string;
        },
        Array<any>,
        Name
      >;
    };
  };
