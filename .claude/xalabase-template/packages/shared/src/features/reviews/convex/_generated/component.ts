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
    functions: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          metadata?: any;
          rating: number;
          resourceId: string;
          tenantId: string;
          text?: string;
          title?: string;
          userId: string;
        },
        { id: string },
        Name
      >;
      get: FunctionReference<"query", "internal", { id: string }, any, Name>;
      importRecord: FunctionReference<
        "mutation",
        "internal",
        {
          metadata?: any;
          moderatedAt?: number;
          moderatedBy?: string;
          moderationNote?: string;
          rating: number;
          resourceId: string;
          status: string;
          tenantId: string;
          text?: string;
          title?: string;
          userId: string;
        },
        { id: string },
        Name
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          resourceId?: string;
          status?: string;
          tenantId: string;
        },
        Array<any>,
        Name
      >;
      moderate: FunctionReference<
        "mutation",
        "internal",
        {
          id: string;
          moderatedBy: string;
          moderationNote?: string;
          status: "approved" | "rejected" | "flagged";
        },
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
      stats: FunctionReference<
        "query",
        "internal",
        { resourceId: string },
        {
          averageRating: number;
          distribution: any;
          pending: number;
          total: number;
        },
        Name
      >;
      update: FunctionReference<
        "mutation",
        "internal",
        {
          id: string;
          metadata?: any;
          rating?: number;
          text?: string;
          title?: string;
        },
        { success: boolean },
        Name
      >;
    };
  };
