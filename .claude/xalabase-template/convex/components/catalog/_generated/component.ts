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
      importAmenity: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          displayOrder: number;
          groupId?: string;
          icon?: string;
          isActive: boolean;
          isHighlighted: boolean;
          metadata?: any;
          name: string;
          slug: string;
          tenantId: string;
        },
        { id: string },
        Name
      >;
      importAmenityGroup: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          displayOrder: number;
          icon?: string;
          isActive: boolean;
          metadata?: any;
          name: string;
          slug: string;
          tenantId: string;
        },
        { id: string },
        Name
      >;
      importCategory: FunctionReference<
        "mutation",
        "internal",
        {
          color?: string;
          description?: string;
          icon?: string;
          isActive: boolean;
          key?: string;
          name: string;
          parentId?: string;
          settings?: any;
          slug: string;
          sortOrder?: number;
          tenantId: string;
        },
        { id: string },
        Name
      >;
      importResourceAmenity: FunctionReference<
        "mutation",
        "internal",
        {
          additionalCost?: number;
          amenityId: string;
          isIncluded: boolean;
          metadata?: any;
          notes?: string;
          quantity: number;
          resourceId: string;
          tenantId: string;
        },
        { id: string },
        Name
      >;
    };
    mutations: {
      addToResource: FunctionReference<
        "mutation",
        "internal",
        {
          additionalCost?: number;
          amenityId: string;
          isIncluded?: boolean;
          metadata?: any;
          notes?: string;
          quantity?: number;
          resourceId: string;
          tenantId: string;
        },
        { id: string },
        Name
      >;
      createAmenity: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          displayOrder?: number;
          groupId?: string;
          icon?: string;
          isHighlighted?: boolean;
          metadata?: any;
          name: string;
          slug: string;
          tenantId: string;
        },
        { id: string },
        Name
      >;
      createAmenityGroup: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          displayOrder?: number;
          icon?: string;
          metadata?: any;
          name: string;
          slug: string;
          tenantId: string;
        },
        { id: string },
        Name
      >;
      createCategory: FunctionReference<
        "mutation",
        "internal",
        {
          color?: string;
          description?: string;
          icon?: string;
          key?: string;
          name: string;
          parentId?: string;
          settings?: any;
          slug: string;
          sortOrder?: number;
          tenantId: string;
        },
        { id: string },
        Name
      >;
      removeAmenity: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      removeCategory: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      removeFromResource: FunctionReference<
        "mutation",
        "internal",
        { amenityId: string; resourceId: string },
        { success: boolean },
        Name
      >;
      updateAmenity: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          displayOrder?: number;
          icon?: string;
          id: string;
          isActive?: boolean;
          isHighlighted?: boolean;
          metadata?: any;
          name?: string;
        },
        { success: boolean },
        Name
      >;
      updateCategory: FunctionReference<
        "mutation",
        "internal",
        {
          color?: string;
          description?: string;
          icon?: string;
          id: string;
          isActive?: boolean;
          name?: string;
          settings?: any;
          sortOrder?: number;
        },
        { success: boolean },
        Name
      >;
    };
    queries: {
      getAmenity: FunctionReference<
        "query",
        "internal",
        { id: string },
        any,
        Name
      >;
      getCategory: FunctionReference<
        "query",
        "internal",
        { id: string },
        any,
        Name
      >;
      getCategoryByKey: FunctionReference<
        "query",
        "internal",
        { key: string; tenantId: string },
        any,
        Name
      >;
      getCategoryTree: FunctionReference<
        "query",
        "internal",
        { tenantId: string },
        Array<any>,
        Name
      >;
      listAmenities: FunctionReference<
        "query",
        "internal",
        {
          groupId?: string;
          isActive?: boolean;
          limit?: number;
          tenantId: string;
        },
        Array<any>,
        Name
      >;
      listAmenityGroups: FunctionReference<
        "query",
        "internal",
        { isActive?: boolean; limit?: number; tenantId: string },
        Array<any>,
        Name
      >;
      listCategories: FunctionReference<
        "query",
        "internal",
        {
          isActive?: boolean;
          limit?: number;
          parentId?: string;
          tenantId: string;
        },
        Array<any>,
        Name
      >;
      listForResource: FunctionReference<
        "query",
        "internal",
        { resourceId: string },
        Array<any>,
        Name
      >;
    };
  };
