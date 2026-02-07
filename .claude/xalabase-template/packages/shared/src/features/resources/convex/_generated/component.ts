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
    mutations: {
      archive: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      cloneResource: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { id: string; slug: string },
        Name
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          capacity?: number;
          categoryKey: string;
          description?: string;
          images?: Array<any>;
          metadata?: any;
          name: string;
          organizationId?: string;
          pricing?: any;
          requiresApproval?: boolean;
          slug: string;
          status?: string;
          tenantId: string;
          timeMode?: string;
        },
        { id: string },
        Name
      >;
      hardDelete: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      importResource: FunctionReference<
        "mutation",
        "internal",
        {
          allowRecurringBooking?: boolean;
          allowSeasonRental?: boolean;
          capacity?: number;
          categoryKey: string;
          description?: string;
          features: Array<any>;
          images: Array<any>;
          inventoryTotal?: number;
          maxBookingDuration?: number;
          metadata: any;
          minBookingDuration?: number;
          name: string;
          openingHours?: Array<any>;
          organizationId?: string;
          pricing: any;
          requiresApproval: boolean;
          ruleSetKey?: string;
          slotDurationMinutes?: number;
          slug: string;
          status: string;
          subcategoryKeys?: Array<string>;
          tenantId: string;
          timeMode: string;
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
      reassignTenant: FunctionReference<
        "mutation",
        "internal",
        { id: string; organizationId?: string; tenantId: string },
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
      restore: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      unpublish: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      update: FunctionReference<
        "mutation",
        "internal",
        {
          capacity?: number;
          description?: string;
          id: string;
          images?: Array<any>;
          metadata?: any;
          name?: string;
          pricing?: any;
          requiresApproval?: boolean;
          status?: string;
        },
        { success: boolean },
        Name
      >;
    };
    queries: {
      get: FunctionReference<"query", "internal", { id: string }, any, Name>;
      getBySlug: FunctionReference<
        "query",
        "internal",
        { slug: string; tenantId: string },
        any,
        Name
      >;
      getBySlugPublic: FunctionReference<
        "query",
        "internal",
        { slug: string },
        any,
        Name
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          categoryKey?: string;
          limit?: number;
          status?: string;
          tenantId: string;
        },
        Array<any>,
        Name
      >;
      listAll: FunctionReference<
        "query",
        "internal",
        {
          categoryKey?: string;
          limit?: number;
          status?: string;
          tenantId: string;
        },
        Array<any>,
        Name
      >;
      listPublic: FunctionReference<
        "query",
        "internal",
        { categoryKey?: string; limit?: number; status?: string },
        Array<any>,
        Name
      >;
    };
  };
