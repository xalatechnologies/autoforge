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
      importPriorityRule: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          isActive: boolean;
          name: string;
          priority: number;
          rules: Array<any>;
          seasonId?: string;
          tenantId: string;
        },
        { id: string },
        Name
      >;
      importSeason: FunctionReference<
        "mutation",
        "internal",
        {
          applicationEndDate?: number;
          applicationStartDate?: number;
          description?: string;
          endDate: number;
          isActive: boolean;
          metadata?: any;
          name: string;
          settings?: any;
          startDate: number;
          status: string;
          tenantId: string;
          type: string;
        },
        { id: string },
        Name
      >;
      importSeasonalLease: FunctionReference<
        "mutation",
        "internal",
        {
          currency: string;
          endDate: number;
          endTime: string;
          metadata?: any;
          notes?: string;
          organizationId: string;
          resourceId: string;
          startDate: number;
          startTime: string;
          status: string;
          tenantId: string;
          totalPrice: number;
          weekdays: Array<number>;
        },
        { id: string },
        Name
      >;
      importSeasonApplication: FunctionReference<
        "mutation",
        "internal",
        {
          applicantEmail?: string;
          applicantName?: string;
          applicantPhone?: string;
          applicationData?: any;
          endTime?: string;
          metadata?: any;
          notes?: string;
          organizationId?: string;
          priority: number;
          rejectionReason?: string;
          resourceId?: string;
          reviewedAt?: number;
          reviewedBy?: string;
          seasonId: string;
          startTime?: string;
          status: string;
          tenantId: string;
          userId: string;
          weekday?: number;
        },
        { id: string },
        Name
      >;
    };
    mutations: {
      cancelLease: FunctionReference<
        "mutation",
        "internal",
        { id: string; reason?: string },
        { success: boolean },
        Name
      >;
      close: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          applicationEndDate?: number;
          applicationStartDate?: number;
          description?: string;
          endDate: number;
          metadata?: any;
          name: string;
          settings?: any;
          startDate: number;
          tenantId: string;
          type: string;
        },
        { id: string },
        Name
      >;
      createAllocation: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          metadata?: any;
          name: string;
          priority: number;
          rules: Array<any>;
          seasonId?: string;
          tenantId: string;
        },
        { id: string },
        Name
      >;
      createLease: FunctionReference<
        "mutation",
        "internal",
        {
          currency: string;
          endDate: number;
          endTime: string;
          metadata?: any;
          notes?: string;
          organizationId: string;
          resourceId: string;
          startDate: number;
          startTime: string;
          tenantId: string;
          totalPrice: number;
          weekdays: Array<number>;
        },
        { id: string },
        Name
      >;
      publish: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      removeAllocation: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      reviewApplication: FunctionReference<
        "mutation",
        "internal",
        {
          id: string;
          notes?: string;
          rejectionReason?: string;
          reviewedBy: string;
          status: "approved" | "rejected" | "waitlist";
        },
        { success: boolean },
        Name
      >;
      submitApplication: FunctionReference<
        "mutation",
        "internal",
        {
          applicantEmail?: string;
          applicantName?: string;
          applicantPhone?: string;
          applicationData?: any;
          endTime?: string;
          notes?: string;
          organizationId?: string;
          resourceId?: string;
          seasonId: string;
          startTime?: string;
          tenantId: string;
          userId: string;
          weekday?: number;
        },
        { id: string },
        Name
      >;
      update: FunctionReference<
        "mutation",
        "internal",
        {
          applicationEndDate?: number;
          applicationStartDate?: number;
          description?: string;
          endDate?: number;
          id: string;
          isActive?: boolean;
          metadata?: any;
          name?: string;
          settings?: any;
          startDate?: number;
          status?: string;
        },
        { success: boolean },
        Name
      >;
      updateAllocation: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          id: string;
          isActive?: boolean;
          name?: string;
          priority?: number;
          rules?: Array<any>;
        },
        { success: boolean },
        Name
      >;
    };
    queries: {
      get: FunctionReference<"query", "internal", { id: string }, any, Name>;
      list: FunctionReference<
        "query",
        "internal",
        {
          isActive?: boolean;
          limit?: number;
          status?: string;
          tenantId: string;
        },
        Array<any>,
        Name
      >;
      listAllocations: FunctionReference<
        "query",
        "internal",
        { limit?: number; seasonId?: string; tenantId: string },
        Array<any>,
        Name
      >;
      listApplications: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          organizationId?: string;
          seasonId: string;
          status?: string;
        },
        Array<any>,
        Name
      >;
      listLeases: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          organizationId?: string;
          resourceId?: string;
          status?: string;
          tenantId: string;
        },
        Array<any>,
        Name
      >;
    };
  };
