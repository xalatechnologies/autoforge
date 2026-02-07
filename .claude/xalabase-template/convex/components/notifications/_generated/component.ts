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
          body?: string;
          link?: string;
          metadata?: any;
          tenantId: string;
          title: string;
          type: string;
          userId: string;
        },
        { id: string },
        Name
      >;
      get: FunctionReference<"query", "internal", { id: string }, any, Name>;
      getPreferences: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<any>,
        Name
      >;
      importNotification: FunctionReference<
        "mutation",
        "internal",
        {
          body?: string;
          link?: string;
          metadata?: any;
          readAt?: number;
          tenantId: string;
          title: string;
          type: string;
          userId: string;
        },
        { id: string },
        Name
      >;
      importPreference: FunctionReference<
        "mutation",
        "internal",
        {
          category: string;
          channel: string;
          enabled: boolean;
          tenantId: string;
          userId: string;
        },
        { id: string },
        Name
      >;
      listByUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; unreadOnly?: boolean; userId: string },
        Array<any>,
        Name
      >;
      markAllAsRead: FunctionReference<
        "mutation",
        "internal",
        { userId: string },
        { count: number; success: boolean },
        Name
      >;
      markAsRead: FunctionReference<
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
      unreadCount: FunctionReference<
        "query",
        "internal",
        { userId: string },
        { count: number },
        Name
      >;
      updatePreference: FunctionReference<
        "mutation",
        "internal",
        {
          category: string;
          channel: string;
          enabled: boolean;
          tenantId: string;
          userId: string;
        },
        { id: string },
        Name
      >;
    };
  };
