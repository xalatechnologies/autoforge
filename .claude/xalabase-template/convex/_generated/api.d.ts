/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_amenities from "../admin/amenities.js";
import type * as admin_categories from "../admin/categories.js";
import type * as admin_cleanup from "../admin/cleanup.js";
import type * as admin_stats from "../admin/stats.js";
import type * as auth_callback from "../auth/callback.js";
import type * as auth_claims from "../auth/claims.js";
import type * as auth_demoToken from "../auth/demoToken.js";
import type * as auth_link from "../auth/link.js";
import type * as auth_magicLink from "../auth/magicLink.js";
import type * as auth_oauthStates from "../auth/oauthStates.js";
import type * as auth_password from "../auth/password.js";
import type * as auth_seedTestUsers from "../auth/seedTestUsers.js";
import type * as auth_sessions from "../auth/sessions.js";
import type * as auth_start from "../auth/start.js";
import type * as billing_vipps from "../billing/vipps.js";
import type * as billing_webhooks from "../billing/webhooks.js";
import type * as domain_additionalServices from "../domain/additionalServices.js";
import type * as domain_addons from "../domain/addons.js";
import type * as domain_allocations from "../domain/allocations.js";
import type * as domain_amenities from "../domain/amenities.js";
import type * as domain_audit from "../domain/audit.js";
import type * as domain_authSessions from "../domain/authSessions.js";
import type * as domain_billing from "../domain/billing.js";
import type * as domain_blocks from "../domain/blocks.js";
import type * as domain_bookingAddons from "../domain/bookingAddons.js";
import type * as domain_bookings from "../domain/bookings.js";
import type * as domain_categories from "../domain/categories.js";
import type * as domain_favorites from "../domain/favorites.js";
import type * as domain_featureFlags from "../domain/featureFlags.js";
import type * as domain_messaging from "../domain/messaging.js";
import type * as domain_moduleRegistry from "../domain/moduleRegistry.js";
import type * as domain_notifications from "../domain/notifications.js";
import type * as domain_pricing from "../domain/pricing.js";
import type * as domain_rbacFacade from "../domain/rbacFacade.js";
import type * as domain_resources from "../domain/resources.js";
import type * as domain_reviews from "../domain/reviews.js";
import type * as domain_search from "../domain/search.js";
import type * as domain_seasonApplications from "../domain/seasonApplications.js";
import type * as domain_seasonalLeases from "../domain/seasonalLeases.js";
import type * as domain_seasons from "../domain/seasons.js";
import type * as http from "../http.js";
import type * as integrations_altinn from "../integrations/altinn.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_batchGet from "../lib/batchGet.js";
import type * as lib_componentContract from "../lib/componentContract.js";
import type * as lib_componentMiddleware from "../lib/componentMiddleware.js";
import type * as lib_crud from "../lib/crud.js";
import type * as lib_eventBus from "../lib/eventBus.js";
import type * as lib_functions from "../lib/functions.js";
import type * as lib_index from "../lib/index.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as lib_rls from "../lib/rls.js";
import type * as lib_triggers from "../lib/triggers.js";
import type * as lib_validators from "../lib/validators.js";
import type * as migrations_index from "../migrations/index.js";
import type * as modules_index from "../modules/index.js";
import type * as monitoring_dashboard from "../monitoring/dashboard.js";
import type * as monitoring_index from "../monitoring/index.js";
import type * as ops_index from "../ops/index.js";
import type * as organizations_index from "../organizations/index.js";
import type * as seedComponents from "../seedComponents.js";
import type * as seeds from "../seeds.js";
import type * as seeds_amenities from "../seeds/amenities.js";
import type * as seeds_categories from "../seeds/categories.js";
import type * as seeds_data_arrangementer from "../seeds/data/arrangementer.js";
import type * as seeds_data_index from "../seeds/data/index.js";
import type * as seeds_data_lokaler from "../seeds/data/lokaler.js";
import type * as seeds_data_sport from "../seeds/data/sport.js";
import type * as seeds_data_torget from "../seeds/data/torget.js";
import type * as seeds_images from "../seeds/images.js";
import type * as seeds_index from "../seeds/index.js";
import type * as seeds_locations from "../seeds/locations.js";
import type * as seeds_types from "../seeds/types.js";
import type * as storage from "../storage.js";
import type * as tenants_index from "../tenants/index.js";
import type * as types from "../types.js";
import type * as users_index from "../users/index.js";
import type * as users_mutations from "../users/mutations.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/amenities": typeof admin_amenities;
  "admin/categories": typeof admin_categories;
  "admin/cleanup": typeof admin_cleanup;
  "admin/stats": typeof admin_stats;
  "auth/callback": typeof auth_callback;
  "auth/claims": typeof auth_claims;
  "auth/demoToken": typeof auth_demoToken;
  "auth/link": typeof auth_link;
  "auth/magicLink": typeof auth_magicLink;
  "auth/oauthStates": typeof auth_oauthStates;
  "auth/password": typeof auth_password;
  "auth/seedTestUsers": typeof auth_seedTestUsers;
  "auth/sessions": typeof auth_sessions;
  "auth/start": typeof auth_start;
  "billing/vipps": typeof billing_vipps;
  "billing/webhooks": typeof billing_webhooks;
  "domain/additionalServices": typeof domain_additionalServices;
  "domain/addons": typeof domain_addons;
  "domain/allocations": typeof domain_allocations;
  "domain/amenities": typeof domain_amenities;
  "domain/audit": typeof domain_audit;
  "domain/authSessions": typeof domain_authSessions;
  "domain/billing": typeof domain_billing;
  "domain/blocks": typeof domain_blocks;
  "domain/bookingAddons": typeof domain_bookingAddons;
  "domain/bookings": typeof domain_bookings;
  "domain/categories": typeof domain_categories;
  "domain/favorites": typeof domain_favorites;
  "domain/featureFlags": typeof domain_featureFlags;
  "domain/messaging": typeof domain_messaging;
  "domain/moduleRegistry": typeof domain_moduleRegistry;
  "domain/notifications": typeof domain_notifications;
  "domain/pricing": typeof domain_pricing;
  "domain/rbacFacade": typeof domain_rbacFacade;
  "domain/resources": typeof domain_resources;
  "domain/reviews": typeof domain_reviews;
  "domain/search": typeof domain_search;
  "domain/seasonApplications": typeof domain_seasonApplications;
  "domain/seasonalLeases": typeof domain_seasonalLeases;
  "domain/seasons": typeof domain_seasons;
  http: typeof http;
  "integrations/altinn": typeof integrations_altinn;
  "lib/auth": typeof lib_auth;
  "lib/batchGet": typeof lib_batchGet;
  "lib/componentContract": typeof lib_componentContract;
  "lib/componentMiddleware": typeof lib_componentMiddleware;
  "lib/crud": typeof lib_crud;
  "lib/eventBus": typeof lib_eventBus;
  "lib/functions": typeof lib_functions;
  "lib/index": typeof lib_index;
  "lib/rateLimits": typeof lib_rateLimits;
  "lib/rls": typeof lib_rls;
  "lib/triggers": typeof lib_triggers;
  "lib/validators": typeof lib_validators;
  "migrations/index": typeof migrations_index;
  "modules/index": typeof modules_index;
  "monitoring/dashboard": typeof monitoring_dashboard;
  "monitoring/index": typeof monitoring_index;
  "ops/index": typeof ops_index;
  "organizations/index": typeof organizations_index;
  seedComponents: typeof seedComponents;
  seeds: typeof seeds;
  "seeds/amenities": typeof seeds_amenities;
  "seeds/categories": typeof seeds_categories;
  "seeds/data/arrangementer": typeof seeds_data_arrangementer;
  "seeds/data/index": typeof seeds_data_index;
  "seeds/data/lokaler": typeof seeds_data_lokaler;
  "seeds/data/sport": typeof seeds_data_sport;
  "seeds/data/torget": typeof seeds_data_torget;
  "seeds/images": typeof seeds_images;
  "seeds/index": typeof seeds_index;
  "seeds/locations": typeof seeds_locations;
  "seeds/types": typeof seeds_types;
  storage: typeof storage;
  "tenants/index": typeof tenants_index;
  types: typeof types;
  "users/index": typeof users_index;
  "users/mutations": typeof users_mutations;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  audit: {
    functions: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          action: string;
          changedFields?: Array<string>;
          details?: any;
          entityId: string;
          entityType: string;
          ipAddress?: string;
          metadata?: any;
          newState?: any;
          previousState?: any;
          reason?: string;
          sourceComponent?: string;
          tenantId: string;
          userEmail?: string;
          userId?: string;
          userName?: string;
        },
        { id: string }
      >;
      get: FunctionReference<"query", "internal", { id: string }, any>;
      getSummary: FunctionReference<
        "query",
        "internal",
        { periodEnd?: number; periodStart?: number; tenantId: string },
        any
      >;
      importRecord: FunctionReference<
        "mutation",
        "internal",
        {
          action: string;
          entityId: string;
          entityType: string;
          metadata?: any;
          newState?: any;
          previousState?: any;
          reason?: string;
          sourceComponent?: string;
          tenantId: string;
          timestamp: number;
          userId?: string;
        },
        { id: string }
      >;
      listByAction: FunctionReference<
        "query",
        "internal",
        { action: string; limit?: number; tenantId: string },
        Array<any>
      >;
      listByEntity: FunctionReference<
        "query",
        "internal",
        { entityId: string; entityType: string; limit?: number },
        Array<any>
      >;
      listByUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; userId: string },
        Array<any>
      >;
      listForTenant: FunctionReference<
        "query",
        "internal",
        { entityType?: string; limit?: number; tenantId: string },
        Array<any>
      >;
    };
    lifecycle: {
      onDisable: FunctionReference<
        "mutation",
        "internal",
        { tenantId: string },
        { success: boolean }
      >;
      onEnable: FunctionReference<
        "mutation",
        "internal",
        { tenantId: string },
        { success: boolean }
      >;
      onInstall: FunctionReference<
        "mutation",
        "internal",
        { tenantId: string },
        { success: boolean }
      >;
      onUninstall: FunctionReference<
        "mutation",
        "internal",
        { tenantId: string },
        { success: boolean }
      >;
    };
  };
  reviews: {
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
        { id: string }
      >;
      get: FunctionReference<"query", "internal", { id: string }, any>;
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
        { id: string }
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
        Array<any>
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
        { success: boolean }
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
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
        }
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
        { success: boolean }
      >;
    };
  };
  notifications: {
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
        { id: string }
      >;
      get: FunctionReference<"query", "internal", { id: string }, any>;
      getPreferences: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<any>
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
        { id: string }
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
        { id: string }
      >;
      listByUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; unreadOnly?: boolean; userId: string },
        Array<any>
      >;
      markAllAsRead: FunctionReference<
        "mutation",
        "internal",
        { userId: string },
        { count: number; success: boolean }
      >;
      markAsRead: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      unreadCount: FunctionReference<
        "query",
        "internal",
        { userId: string },
        { count: number }
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
        { id: string }
      >;
    };
  };
  userPrefs: {
    functions: {
      addFavorite: FunctionReference<
        "mutation",
        "internal",
        {
          metadata?: any;
          notes?: string;
          resourceId: string;
          tags?: Array<string>;
          tenantId: string;
          userId: string;
        },
        { id: string }
      >;
      createFilter: FunctionReference<
        "mutation",
        "internal",
        {
          filters: any;
          isDefault?: boolean;
          name: string;
          tenantId: string;
          type: string;
          userId: string;
        },
        { id: string }
      >;
      importFavorite: FunctionReference<
        "mutation",
        "internal",
        {
          metadata?: any;
          notes?: string;
          resourceId: string;
          tags: Array<string>;
          tenantId: string;
          userId: string;
        },
        { id: string }
      >;
      importSavedFilter: FunctionReference<
        "mutation",
        "internal",
        {
          filters?: any;
          isDefault?: boolean;
          name: string;
          tenantId: string;
          type: string;
          userId: string;
        },
        { id: string }
      >;
      isFavorite: FunctionReference<
        "query",
        "internal",
        { resourceId: string; userId: string },
        { favorite: any; isFavorite: boolean }
      >;
      listFavorites: FunctionReference<
        "query",
        "internal",
        { tags?: Array<string>; userId: string },
        Array<any>
      >;
      listFilters: FunctionReference<
        "query",
        "internal",
        { type?: string; userId: string },
        Array<any>
      >;
      removeFavorite: FunctionReference<
        "mutation",
        "internal",
        { resourceId: string; userId: string },
        { success: boolean }
      >;
      removeFilter: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      toggleFavorite: FunctionReference<
        "mutation",
        "internal",
        { resourceId: string; tenantId: string; userId: string },
        { isFavorite: boolean }
      >;
      updateFavorite: FunctionReference<
        "mutation",
        "internal",
        { id: string; metadata?: any; notes?: string; tags?: Array<string> },
        { success: boolean }
      >;
      updateFilter: FunctionReference<
        "mutation",
        "internal",
        { filters?: any; id: string; isDefault?: boolean; name?: string },
        { success: boolean }
      >;
    };
  };
  messaging: {
    import: {
      importConversation: FunctionReference<
        "mutation",
        "internal",
        {
          assignedAt?: number;
          assigneeId?: string;
          bookingId?: string;
          lastMessageAt?: number;
          metadata?: any;
          participants: Array<string>;
          priority?: string;
          reopenedAt?: number;
          resolvedAt?: number;
          resolvedBy?: string;
          resourceId?: string;
          status: string;
          subject?: string;
          tenantId: string;
          unreadCount: number;
          userId: string;
        },
        { id: string }
      >;
      importMessage: FunctionReference<
        "mutation",
        "internal",
        {
          attachments: Array<any>;
          content: string;
          conversationId: string;
          messageType: string;
          metadata?: any;
          readAt?: number;
          senderId: string;
          senderType: string;
          sentAt: number;
          tenantId: string;
        },
        { id: string }
      >;
    };
    mutations: {
      archiveConversation: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      assignConversation: FunctionReference<
        "mutation",
        "internal",
        { assigneeId: string; id: string },
        { success: boolean }
      >;
      createConversation: FunctionReference<
        "mutation",
        "internal",
        {
          bookingId?: string;
          metadata?: any;
          participants: Array<string>;
          resourceId?: string;
          subject?: string;
          tenantId: string;
          userId: string;
        },
        { id: string }
      >;
      markMessagesAsRead: FunctionReference<
        "mutation",
        "internal",
        { conversationId: string; userId: string },
        { count: number; success: boolean }
      >;
      reopenConversation: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      resolveConversation: FunctionReference<
        "mutation",
        "internal",
        { id: string; resolvedBy: string },
        { success: boolean }
      >;
      sendMessage: FunctionReference<
        "mutation",
        "internal",
        {
          attachments?: Array<any>;
          content: string;
          conversationId: string;
          messageType?: string;
          metadata?: any;
          senderId: string;
          senderType?: string;
          tenantId: string;
        },
        { id: string }
      >;
      setConversationPriority: FunctionReference<
        "mutation",
        "internal",
        { id: string; priority: string },
        { success: boolean }
      >;
      unassignConversation: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
    };
    queries: {
      getConversation: FunctionReference<
        "query",
        "internal",
        { id: string },
        any
      >;
      listConversations: FunctionReference<
        "query",
        "internal",
        { limit?: number; status?: string; userId: string },
        Array<any>
      >;
      listConversationsByAssignee: FunctionReference<
        "query",
        "internal",
        { assigneeId: string; limit?: number; status?: string },
        Array<any>
      >;
      listMessages: FunctionReference<
        "query",
        "internal",
        { conversationId: string; limit?: number },
        Array<any>
      >;
      unreadMessageCount: FunctionReference<
        "query",
        "internal",
        { userId: string },
        { count: number }
      >;
    };
  };
  catalog: {
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
        { id: string }
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
        { id: string }
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
        { id: string }
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
        { id: string }
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
        { id: string }
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
        { id: string }
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
        { id: string }
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
        { id: string }
      >;
      removeAmenity: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      removeCategory: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      removeFromResource: FunctionReference<
        "mutation",
        "internal",
        { amenityId: string; resourceId: string },
        { success: boolean }
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
        { success: boolean }
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
        { success: boolean }
      >;
    };
    queries: {
      getAmenity: FunctionReference<"query", "internal", { id: string }, any>;
      getCategory: FunctionReference<"query", "internal", { id: string }, any>;
      getCategoryByKey: FunctionReference<
        "query",
        "internal",
        { key: string; tenantId: string },
        any
      >;
      getCategoryTree: FunctionReference<
        "query",
        "internal",
        { tenantId: string },
        Array<any>
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
        Array<any>
      >;
      listAmenityGroups: FunctionReference<
        "query",
        "internal",
        { isActive?: boolean; limit?: number; tenantId: string },
        Array<any>
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
        Array<any>
      >;
      listForResource: FunctionReference<
        "query",
        "internal",
        { resourceId: string },
        Array<any>
      >;
    };
  };
  analytics: {
    functions: {
      createReportSchedule: FunctionReference<
        "mutation",
        "internal",
        {
          createdBy: string;
          cronExpression: string;
          description?: string;
          filters?: any;
          format: string;
          metadata?: any;
          name: string;
          recipients: Array<string>;
          reportType: string;
          tenantId: string;
        },
        { id: string }
      >;
      deleteReportSchedule: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      getAvailabilityMetrics: FunctionReference<
        "query",
        "internal",
        { periodEnd: number; periodStart: number; resourceId: string },
        Array<any>
      >;
      getBookingMetrics: FunctionReference<
        "query",
        "internal",
        {
          periodEnd: number;
          periodStart: number;
          resourceId?: string;
          tenantId: string;
        },
        Array<any>
      >;
      importAvailabilityMetrics: FunctionReference<
        "mutation",
        "internal",
        {
          bookedSlots: number;
          calculatedAt: number;
          metadata?: any;
          period: string;
          periodEnd: number;
          periodStart: number;
          popularTimeSlots: Array<any>;
          resourceId: string;
          tenantId: string;
          totalSlots: number;
          utilizationRate: number;
        },
        { id: string }
      >;
      importBookingMetrics: FunctionReference<
        "mutation",
        "internal",
        {
          calculatedAt: number;
          count?: number;
          metadata?: any;
          metricType: string;
          period: string;
          periodEnd: number;
          periodStart: number;
          resourceId?: string;
          tenantId: string;
          value: number;
        },
        { id: string }
      >;
      importReportSchedule: FunctionReference<
        "mutation",
        "internal",
        {
          createdBy: string;
          cronExpression: string;
          description?: string;
          enabled: boolean;
          filters?: any;
          format: string;
          lastRunAt?: number;
          metadata?: any;
          name: string;
          nextRunAt?: number;
          recipients: Array<string>;
          reportType: string;
          tenantId: string;
        },
        { id: string }
      >;
      importScheduledReport: FunctionReference<
        "mutation",
        "internal",
        {
          completedAt?: number;
          error?: string;
          fileSize?: string;
          fileUrl?: string;
          metadata?: any;
          scheduleId: string;
          startedAt?: number;
          status: string;
          tenantId: string;
        },
        { id: string }
      >;
      listReportSchedules: FunctionReference<
        "query",
        "internal",
        { enabled?: boolean; tenantId: string },
        Array<any>
      >;
      storeAvailabilityMetrics: FunctionReference<
        "mutation",
        "internal",
        {
          bookedSlots: number;
          metadata?: any;
          period: string;
          periodEnd: number;
          periodStart: number;
          popularTimeSlots: Array<any>;
          resourceId: string;
          tenantId: string;
          totalSlots: number;
          utilizationRate: number;
        },
        { id: string }
      >;
      storeBookingMetrics: FunctionReference<
        "mutation",
        "internal",
        {
          count?: number;
          metadata?: any;
          metricType: string;
          period: string;
          periodEnd: number;
          periodStart: number;
          resourceId?: string;
          tenantId: string;
          value: number;
        },
        { id: string }
      >;
      updateReportSchedule: FunctionReference<
        "mutation",
        "internal",
        {
          cronExpression?: string;
          description?: string;
          enabled?: boolean;
          filters?: any;
          format?: string;
          id: string;
          metadata?: any;
          name?: string;
          recipients?: Array<string>;
        },
        { success: boolean }
      >;
    };
  };
  compliance: {
    mutations: {
      publishPolicy: FunctionReference<
        "mutation",
        "internal",
        {
          content: string;
          metadata?: any;
          policyType: string;
          publishedBy: string;
          tenantId: string;
          title: string;
          version: string;
        },
        { id: string }
      >;
      rollbackPolicy: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      submitDSAR: FunctionReference<
        "mutation",
        "internal",
        {
          details?: string;
          metadata?: any;
          requestType: string;
          tenantId: string;
          userId: string;
        },
        { id: string }
      >;
      updateConsent: FunctionReference<
        "mutation",
        "internal",
        {
          category: string;
          ipAddress?: string;
          isConsented: boolean;
          metadata?: any;
          tenantId: string;
          userAgent?: string;
          userId: string;
          version: string;
        },
        { id: string }
      >;
      updateDSARStatus: FunctionReference<
        "mutation",
        "internal",
        { id: string; processedBy: string; responseData?: any; status: string },
        { success: boolean }
      >;
    };
    queries: {
      getConsent: FunctionReference<
        "query",
        "internal",
        { category: string; limit?: number; userId: string },
        any
      >;
      getConsentSummary: FunctionReference<
        "query",
        "internal",
        { userId: string },
        {
          analytics: boolean;
          marketing: boolean;
          necessary: boolean;
          thirdParty: boolean;
        }
      >;
      getDSAR: FunctionReference<"query", "internal", { id: string }, any>;
      getPolicy: FunctionReference<
        "query",
        "internal",
        { policyType: string; tenantId: string },
        any
      >;
      getPolicyHistory: FunctionReference<
        "query",
        "internal",
        { limit?: number; policyType: string; tenantId: string },
        Array<any>
      >;
      listConsent: FunctionReference<
        "query",
        "internal",
        { limit?: number; userId: string },
        Array<any>
      >;
      listDSARRequests: FunctionReference<
        "query",
        "internal",
        { limit?: number; status?: string; tenantId: string; userId?: string },
        Array<any>
      >;
      listPolicies: FunctionReference<
        "query",
        "internal",
        { limit?: number; tenantId: string },
        Array<any>
      >;
    };
  };
  tenantConfig: {
    mutations: {
      createFlag: FunctionReference<
        "mutation",
        "internal",
        {
          defaultValue: any;
          description?: string;
          key: string;
          metadata?: any;
          name: string;
          tenantId: string;
          type: string;
        },
        { id: string }
      >;
      createFlagRule: FunctionReference<
        "mutation",
        "internal",
        {
          flagId: string;
          priority: number;
          targetId: string;
          targetType: string;
          tenantId: string;
          value: any;
        },
        { id: string }
      >;
      deleteFlag: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      deleteFlagRule: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      removeBrandAsset: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      removeThemeOverride: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      setThemeOverride: FunctionReference<
        "mutation",
        "internal",
        {
          componentKey: string;
          property: string;
          tenantId: string;
          value: string;
        },
        { id: string }
      >;
      updateBranding: FunctionReference<
        "mutation",
        "internal",
        {
          accentColor?: string;
          borderRadius?: string;
          customCSS?: string;
          darkMode?: boolean;
          fontFamily?: string;
          metadata?: any;
          primaryColor?: string;
          secondaryColor?: string;
          tenantId: string;
        },
        { id: string }
      >;
      updateFlag: FunctionReference<
        "mutation",
        "internal",
        {
          defaultValue?: any;
          description?: string;
          id: string;
          isActive?: boolean;
          metadata?: any;
          name?: string;
        },
        { success: boolean }
      >;
      uploadBrandAsset: FunctionReference<
        "mutation",
        "internal",
        {
          alt?: string;
          assetType: string;
          metadata?: any;
          storageId?: string;
          tenantId: string;
          url: string;
        },
        { id: string }
      >;
    };
    queries: {
      evaluateAllFlags: FunctionReference<
        "query",
        "internal",
        { targetId?: string; targetType?: string; tenantId: string },
        any
      >;
      evaluateFlag: FunctionReference<
        "query",
        "internal",
        {
          key: string;
          targetId?: string;
          targetType?: string;
          tenantId: string;
        },
        any
      >;
      getBranding: FunctionReference<
        "query",
        "internal",
        { tenantId: string },
        any
      >;
      getFlag: FunctionReference<
        "query",
        "internal",
        { key: string; tenantId: string },
        any
      >;
      getThemeCSS: FunctionReference<
        "query",
        "internal",
        { tenantId: string },
        string
      >;
      listBrandAssets: FunctionReference<
        "query",
        "internal",
        { limit?: number; tenantId: string },
        Array<any>
      >;
      listFlags: FunctionReference<
        "query",
        "internal",
        { limit?: number; tenantId: string },
        Array<any>
      >;
      listThemeOverrides: FunctionReference<
        "query",
        "internal",
        { limit?: number; tenantId: string },
        Array<any>
      >;
    };
  };
  resources: {
    mutations: {
      archive: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      cloneResource: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { id: string; slug: string }
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
        { id: string }
      >;
      hardDelete: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
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
        { id: string }
      >;
      publish: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      reassignTenant: FunctionReference<
        "mutation",
        "internal",
        { id: string; organizationId?: string; tenantId: string },
        { success: boolean }
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      restore: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      unpublish: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
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
        { success: boolean }
      >;
    };
    queries: {
      get: FunctionReference<"query", "internal", { id: string }, any>;
      getBySlug: FunctionReference<
        "query",
        "internal",
        { slug: string; tenantId: string },
        any
      >;
      getBySlugPublic: FunctionReference<
        "query",
        "internal",
        { slug: string },
        any
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
        Array<any>
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
        Array<any>
      >;
      listPublic: FunctionReference<
        "query",
        "internal",
        { categoryKey?: string; limit?: number; status?: string },
        Array<any>
      >;
    };
  };
  bookings: {
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
        { id: string }
      >;
      getAllocation: FunctionReference<
        "query",
        "internal",
        { id: string },
        any
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
        { id: string }
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
        { id: string }
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
        { id: string }
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
        { id: string }
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
        { id: string }
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
        Array<any>
      >;
      removeAllocation: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
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
        any
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
        any
      >;
    };
    blocks: {
      checkAvailability: FunctionReference<
        "query",
        "internal",
        { endTime: number; resourceId: string; startTime: number },
        any
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
        { id: string }
      >;
      getAvailableSlots: FunctionReference<
        "query",
        "internal",
        { date: number; resourceId: string; slotDurationMinutes?: number },
        Array<any>
      >;
      getBlock: FunctionReference<"query", "internal", { id: string }, any>;
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
        Array<any>
      >;
      removeBlock: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
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
        { success: boolean }
      >;
    };
    mutations: {
      approve: FunctionReference<
        "mutation",
        "internal",
        { approvedBy: string; id: string },
        { success: boolean }
      >;
      cancel: FunctionReference<
        "mutation",
        "internal",
        { cancelledBy: string; id: string; reason?: string },
        { success: boolean }
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
        { id: string; status: string }
      >;
      reject: FunctionReference<
        "mutation",
        "internal",
        { id: string; reason?: string; rejectedBy: string },
        { success: boolean }
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
        { success: boolean }
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
        any
      >;
      get: FunctionReference<"query", "internal", { id: string }, any>;
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
        Array<any>
      >;
    };
  };
  pricing: {
    calculations: {
      calculatePrice: FunctionReference<
        "query",
        "internal",
        {
          additionalServiceIds?: Array<string>;
          endTime: number;
          organizationId?: string;
          resourceId: string;
          startTime: number;
          userId?: string;
        },
        any
      >;
      calculatePriceWithBreakdown: FunctionReference<
        "query",
        "internal",
        {
          attendees: number;
          bookingDate?: number;
          bookingMode: string;
          bookingTime?: string;
          discountCode?: string;
          durationMinutes: number;
          organizationId?: string;
          priceGroupId?: string;
          resourceCategoryKey?: string;
          resourceId: string;
          selectedSlotMinutes?: number;
          tenantId: string;
          tickets?: number;
          userId?: string;
        },
        any
      >;
    };
    discounts: {
      applyDiscountCode: FunctionReference<
        "mutation",
        "internal",
        {
          bookingId?: string;
          discountAmount: number;
          discountCodeId: string;
          tenantId: string;
          userId: string;
        },
        { id: string; success: boolean }
      >;
      createDiscountCode: FunctionReference<
        "mutation",
        "internal",
        {
          appliesToBookingModes?: Array<string>;
          appliesToCategories?: Array<string>;
          appliesToResources?: Array<string>;
          code: string;
          description?: string;
          discountType: "percent" | "fixed" | "free_hours";
          discountValue: number;
          firstTimeBookersOnly?: boolean;
          maxDiscountAmount?: number;
          maxUsesPerUser?: number;
          maxUsesTotal?: number;
          metadata?: any;
          minBookingAmount?: number;
          minDurationMinutes?: number;
          name: string;
          restrictToOrgs?: Array<string>;
          restrictToPriceGroups?: Array<string>;
          restrictToUsers?: Array<string>;
          tenantId: string;
          validFrom?: number;
          validUntil?: number;
        },
        { id: string }
      >;
      deleteDiscountCode: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      listDiscountCodes: FunctionReference<
        "query",
        "internal",
        { isActive?: boolean; tenantId: string },
        Array<any>
      >;
      updateDiscountCode: FunctionReference<
        "mutation",
        "internal",
        {
          appliesToBookingModes?: Array<string>;
          appliesToCategories?: Array<string>;
          appliesToResources?: Array<string>;
          description?: string;
          discountType?: "percent" | "fixed" | "free_hours";
          discountValue?: number;
          firstTimeBookersOnly?: boolean;
          id: string;
          isActive?: boolean;
          maxDiscountAmount?: number;
          maxUsesPerUser?: number;
          maxUsesTotal?: number;
          metadata?: any;
          minBookingAmount?: number;
          minDurationMinutes?: number;
          name?: string;
          restrictToOrgs?: Array<string>;
          restrictToPriceGroups?: Array<string>;
          restrictToUsers?: Array<string>;
          validFrom?: number;
          validUntil?: number;
        },
        { success: boolean }
      >;
      validateDiscountCode: FunctionReference<
        "query",
        "internal",
        {
          bookingAmount?: number;
          bookingMode?: string;
          categoryKey?: string;
          code: string;
          durationMinutes?: number;
          isFirstTimeBooker?: boolean;
          organizationId?: string;
          priceGroupId?: string;
          resourceId?: string;
          tenantId: string;
          userId?: string;
        },
        any
      >;
    };
    holidays: {
      createHoliday: FunctionReference<
        "mutation",
        "internal",
        {
          appliesToCategories?: Array<string>;
          appliesToResources?: Array<string>;
          date: string;
          isRecurring: boolean;
          metadata?: any;
          name: string;
          surchargeType: "percent" | "fixed" | "multiplier";
          surchargeValue: number;
          tenantId: string;
        },
        { id: string }
      >;
      deleteHoliday: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      listHolidays: FunctionReference<
        "query",
        "internal",
        { isActive?: boolean; tenantId: string },
        Array<any>
      >;
      updateHoliday: FunctionReference<
        "mutation",
        "internal",
        {
          appliesToCategories?: Array<string>;
          appliesToResources?: Array<string>;
          date?: string;
          id: string;
          isActive?: boolean;
          isRecurring?: boolean;
          metadata?: any;
          name?: string;
          surchargeType?: "percent" | "fixed" | "multiplier";
          surchargeValue?: number;
        },
        { success: boolean }
      >;
    };
    import: {
      importAdditionalService: FunctionReference<
        "mutation",
        "internal",
        {
          currency?: string;
          description?: string;
          displayOrder?: number;
          isActive: boolean;
          isRequired?: boolean;
          metadata?: any;
          name: string;
          price: number;
          resourceId: string;
          tenantId: string;
        },
        { id: string }
      >;
      importDiscountCode: FunctionReference<
        "mutation",
        "internal",
        {
          appliesToBookingModes?: Array<string>;
          appliesToCategories?: Array<string>;
          appliesToResources?: Array<string>;
          code: string;
          currentUses: number;
          description?: string;
          discountType: "percent" | "fixed" | "free_hours";
          discountValue: number;
          firstTimeBookersOnly?: boolean;
          isActive: boolean;
          maxDiscountAmount?: number;
          maxUsesPerUser?: number;
          maxUsesTotal?: number;
          metadata?: any;
          minBookingAmount?: number;
          minDurationMinutes?: number;
          name: string;
          restrictToOrgs?: Array<string>;
          restrictToPriceGroups?: Array<string>;
          restrictToUsers?: Array<string>;
          tenantId: string;
          validFrom?: number;
          validUntil?: number;
        },
        { id: string }
      >;
      importDiscountCodeUsage: FunctionReference<
        "mutation",
        "internal",
        {
          bookingId?: string;
          discountAmount: number;
          discountCodeId: string;
          tenantId: string;
          usedAt: number;
          userId: string;
        },
        { id: string }
      >;
      importHoliday: FunctionReference<
        "mutation",
        "internal",
        {
          appliesToCategories?: Array<string>;
          appliesToResources?: Array<string>;
          date: string;
          isActive: boolean;
          isRecurring: boolean;
          metadata?: any;
          name: string;
          surchargeType: "percent" | "fixed" | "multiplier";
          surchargeValue: number;
          tenantId: string;
        },
        { id: string }
      >;
      importOrgPricingGroup: FunctionReference<
        "mutation",
        "internal",
        {
          discountPercent?: number;
          isActive: boolean;
          metadata?: any;
          organizationId: string;
          pricingGroupId: string;
          tenantId: string;
          validFrom?: number;
          validUntil?: number;
        },
        { id: string }
      >;
      importPricingGroup: FunctionReference<
        "mutation",
        "internal",
        {
          applicableBookingModes?: Array<string>;
          description?: string;
          discountAmount?: number;
          discountPercent?: number;
          groupType?: string;
          isActive: boolean;
          isDefault: boolean;
          metadata?: any;
          name: string;
          priority: number;
          tenantId: string;
          validFrom?: number;
          validUntil?: number;
        },
        { id: string }
      >;
      importResourcePricing: FunctionReference<
        "mutation",
        "internal",
        {
          advanceBookingDays?: number;
          applicableBookingModes?: Array<string>;
          basePrice: number;
          cancellationHours?: number;
          cleaningFee?: number;
          currency: string;
          depositAmount?: number;
          enableDiscountCodes?: boolean;
          enablePriceGroups?: boolean;
          enableSurcharges?: boolean;
          holidayMultiplier?: number;
          isActive: boolean;
          maxAge?: number;
          maxDuration?: number;
          maxPeople?: number;
          metadata?: any;
          minAge?: number;
          minDuration?: number;
          minPeople?: number;
          peakHoursMultiplier?: number;
          pricePerDay?: number;
          pricePerHalfDay?: number;
          pricePerHour?: number;
          pricePerPerson?: number;
          pricePerPersonHour?: number;
          priceType: string;
          pricingGroupId?: string;
          resourceId: string;
          rules?: any;
          sameDayBookingAllowed?: boolean;
          serviceFee?: number;
          slotDurationMinutes?: number;
          slotOptions?: Array<any>;
          taxIncluded?: boolean;
          taxRate?: number;
          tenantId: string;
          weekendMultiplier?: number;
        },
        { id: string }
      >;
      importUserPricingGroup: FunctionReference<
        "mutation",
        "internal",
        {
          isActive: boolean;
          metadata?: any;
          pricingGroupId: string;
          tenantId: string;
          userId: string;
          validFrom?: number;
          validUntil?: number;
        },
        { id: string }
      >;
      importWeekdayPricing: FunctionReference<
        "mutation",
        "internal",
        {
          dayOfWeek: number;
          endTime?: string;
          isActive: boolean;
          label?: string;
          metadata?: any;
          resourceId?: string;
          startTime?: string;
          surchargeType: "percent" | "fixed" | "multiplier";
          surchargeValue: number;
          tenantId: string;
        },
        { id: string }
      >;
    };
    mutations: {
      assignOrgPricingGroup: FunctionReference<
        "mutation",
        "internal",
        {
          discountPercent?: number;
          metadata?: any;
          organizationId: string;
          pricingGroupId: string;
          tenantId: string;
          validFrom?: number;
          validUntil?: number;
        },
        { id: string }
      >;
      assignUserPricingGroup: FunctionReference<
        "mutation",
        "internal",
        {
          metadata?: any;
          pricingGroupId: string;
          tenantId: string;
          userId: string;
          validFrom?: number;
          validUntil?: number;
        },
        { id: string }
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          advanceBookingDays?: number;
          applicableBookingModes?: Array<string>;
          basePrice: number;
          cancellationHours?: number;
          cleaningFee?: number;
          currency: string;
          depositAmount?: number;
          enableDiscountCodes?: boolean;
          enablePriceGroups?: boolean;
          enableSurcharges?: boolean;
          holidayMultiplier?: number;
          maxAge?: number;
          maxDuration?: number;
          maxPeople?: number;
          metadata?: any;
          minAge?: number;
          minDuration?: number;
          minPeople?: number;
          peakHoursMultiplier?: number;
          pricePerDay?: number;
          pricePerHalfDay?: number;
          pricePerHour?: number;
          pricePerPerson?: number;
          pricePerPersonHour?: number;
          priceType: string;
          pricingGroupId?: string;
          resourceId: string;
          rules?: any;
          sameDayBookingAllowed?: boolean;
          serviceFee?: number;
          slotDurationMinutes?: number;
          slotOptions?: Array<any>;
          taxIncluded?: boolean;
          taxRate?: number;
          tenantId: string;
          weekendMultiplier?: number;
        },
        { id: string }
      >;
      createAdditionalService: FunctionReference<
        "mutation",
        "internal",
        {
          currency?: string;
          description?: string;
          displayOrder?: number;
          isRequired?: boolean;
          metadata?: any;
          name: string;
          price: number;
          resourceId: string;
          tenantId: string;
        },
        { id: string }
      >;
      createGroup: FunctionReference<
        "mutation",
        "internal",
        {
          applicableBookingModes?: Array<string>;
          description?: string;
          discountAmount?: number;
          discountPercent?: number;
          groupType?: string;
          isDefault?: boolean;
          metadata?: any;
          name: string;
          priority?: number;
          tenantId: string;
          validFrom?: number;
          validUntil?: number;
        },
        { id: string }
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      removeAdditionalService: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      removeGroup: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      removeOrgPricingGroup: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      removeUserPricingGroup: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      update: FunctionReference<
        "mutation",
        "internal",
        {
          advanceBookingDays?: number;
          applicableBookingModes?: Array<string>;
          basePrice?: number;
          cancellationHours?: number;
          cleaningFee?: number;
          currency?: string;
          depositAmount?: number;
          enableDiscountCodes?: boolean;
          enablePriceGroups?: boolean;
          enableSurcharges?: boolean;
          holidayMultiplier?: number;
          id: string;
          isActive?: boolean;
          maxAge?: number;
          maxDuration?: number;
          maxPeople?: number;
          metadata?: any;
          minAge?: number;
          minDuration?: number;
          minPeople?: number;
          peakHoursMultiplier?: number;
          pricePerDay?: number;
          pricePerHalfDay?: number;
          pricePerHour?: number;
          pricePerPerson?: number;
          pricePerPersonHour?: number;
          priceType?: string;
          pricingGroupId?: string;
          rules?: any;
          sameDayBookingAllowed?: boolean;
          serviceFee?: number;
          slotDurationMinutes?: number;
          slotOptions?: Array<any>;
          taxIncluded?: boolean;
          taxRate?: number;
          weekendMultiplier?: number;
        },
        { success: boolean }
      >;
      updateAdditionalService: FunctionReference<
        "mutation",
        "internal",
        {
          currency?: string;
          description?: string;
          displayOrder?: number;
          id: string;
          isActive?: boolean;
          isRequired?: boolean;
          metadata?: any;
          name?: string;
          price?: number;
        },
        { success: boolean }
      >;
      updateGroup: FunctionReference<
        "mutation",
        "internal",
        {
          applicableBookingModes?: Array<string>;
          description?: string;
          discountAmount?: number;
          discountPercent?: number;
          groupType?: string;
          id: string;
          isActive?: boolean;
          isDefault?: boolean;
          metadata?: any;
          name?: string;
          priority?: number;
          validFrom?: number;
          validUntil?: number;
        },
        { success: boolean }
      >;
    };
    queries: {
      get: FunctionReference<"query", "internal", { id: string }, any>;
      getGroup: FunctionReference<"query", "internal", { id: string }, any>;
      getResourcePriceGroups: FunctionReference<
        "query",
        "internal",
        { bookingMode?: string; resourceId: string; tenantId: string },
        Array<any>
      >;
      getResourcePricingConfig: FunctionReference<
        "query",
        "internal",
        { bookingMode?: string; resourceId: string },
        any
      >;
      listAdditionalServices: FunctionReference<
        "query",
        "internal",
        { isActive?: boolean; limit?: number; resourceId: string },
        Array<any>
      >;
      listAdditionalServicesByTenant: FunctionReference<
        "query",
        "internal",
        { isActive?: boolean; limit?: number; tenantId: string },
        Array<any>
      >;
      listByTenant: FunctionReference<
        "query",
        "internal",
        { isActive?: boolean; limit?: number; tenantId: string },
        Array<any>
      >;
      listForResource: FunctionReference<
        "query",
        "internal",
        { isActive?: boolean; limit?: number; resourceId: string },
        Array<any>
      >;
      listGroups: FunctionReference<
        "query",
        "internal",
        { isActive?: boolean; limit?: number; tenantId: string },
        Array<any>
      >;
      listOrgPricingGroups: FunctionReference<
        "query",
        "internal",
        {
          isActive?: boolean;
          limit?: number;
          organizationId?: string;
          tenantId: string;
        },
        Array<any>
      >;
      listUserPricingGroups: FunctionReference<
        "query",
        "internal",
        {
          isActive?: boolean;
          limit?: number;
          tenantId: string;
          userId?: string;
        },
        Array<any>
      >;
    };
    surcharges: {
      createWeekdayPricing: FunctionReference<
        "mutation",
        "internal",
        {
          dayOfWeek: number;
          endTime?: string;
          label?: string;
          metadata?: any;
          resourceId?: string;
          startTime?: string;
          surchargeType: "percent" | "fixed" | "multiplier";
          surchargeValue: number;
          tenantId: string;
        },
        { id: string }
      >;
      deleteWeekdayPricing: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      getApplicableSurcharges: FunctionReference<
        "query",
        "internal",
        {
          bookingDate: number;
          bookingTime?: string;
          resourceCategoryKey?: string;
          resourceId: string;
          tenantId: string;
        },
        Array<any>
      >;
      listWeekdayPricing: FunctionReference<
        "query",
        "internal",
        {
          dayOfWeek?: number;
          isActive?: boolean;
          resourceId?: string;
          tenantId: string;
        },
        Array<any>
      >;
      updateWeekdayPricing: FunctionReference<
        "mutation",
        "internal",
        {
          dayOfWeek?: number;
          endTime?: string;
          id: string;
          isActive?: boolean;
          label?: string;
          metadata?: any;
          startTime?: string;
          surchargeType?: "percent" | "fixed" | "multiplier";
          surchargeValue?: number;
        },
        { success: boolean }
      >;
    };
  };
  addons: {
    import: {
      importAddon: FunctionReference<
        "mutation",
        "internal",
        {
          category?: string;
          currency: string;
          description?: string;
          displayOrder: number;
          icon?: string;
          images: Array<any>;
          isActive: boolean;
          leadTimeHours?: number;
          maxQuantity?: number;
          metadata?: any;
          name: string;
          price: number;
          priceType: string;
          requiresApproval: boolean;
          slug: string;
          tenantId: string;
        },
        { id: string }
      >;
      importBookingAddon: FunctionReference<
        "mutation",
        "internal",
        {
          addonId: string;
          bookingId: string;
          currency: string;
          metadata?: any;
          notes?: string;
          quantity: number;
          status: string;
          tenantId: string;
          totalPrice: number;
          unitPrice: number;
        },
        { id: string }
      >;
      importResourceAddon: FunctionReference<
        "mutation",
        "internal",
        {
          addonId: string;
          customPrice?: number;
          displayOrder: number;
          isActive: boolean;
          isRecommended: boolean;
          isRequired: boolean;
          metadata?: any;
          resourceId: string;
          tenantId: string;
        },
        { id: string }
      >;
    };
    mutations: {
      addToBooking: FunctionReference<
        "mutation",
        "internal",
        {
          addonId: string;
          bookingId: string;
          metadata?: any;
          notes?: string;
          quantity: number;
          tenantId: string;
        },
        { id: string }
      >;
      addToResource: FunctionReference<
        "mutation",
        "internal",
        {
          addonId: string;
          customPrice?: number;
          displayOrder?: number;
          isRecommended?: boolean;
          isRequired?: boolean;
          metadata?: any;
          resourceId: string;
          tenantId: string;
        },
        { id: string }
      >;
      approve: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          category?: string;
          currency: string;
          description?: string;
          displayOrder?: number;
          icon?: string;
          images?: Array<any>;
          leadTimeHours?: number;
          maxQuantity?: number;
          metadata?: any;
          name: string;
          price: number;
          priceType: string;
          requiresApproval?: boolean;
          slug: string;
          tenantId: string;
        },
        { id: string }
      >;
      reject: FunctionReference<
        "mutation",
        "internal",
        { id: string; reason?: string },
        { success: boolean }
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      removeFromBooking: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      removeFromResource: FunctionReference<
        "mutation",
        "internal",
        { addonId: string; resourceId: string },
        { success: boolean }
      >;
      update: FunctionReference<
        "mutation",
        "internal",
        {
          category?: string;
          currency?: string;
          description?: string;
          displayOrder?: number;
          icon?: string;
          id: string;
          images?: Array<any>;
          isActive?: boolean;
          leadTimeHours?: number;
          maxQuantity?: number;
          metadata?: any;
          name?: string;
          price?: number;
          priceType?: string;
          requiresApproval?: boolean;
        },
        { success: boolean }
      >;
      updateBookingAddon: FunctionReference<
        "mutation",
        "internal",
        { id: string; metadata?: any; notes?: string; quantity?: number },
        { success: boolean }
      >;
    };
    queries: {
      get: FunctionReference<"query", "internal", { id: string }, any>;
      list: FunctionReference<
        "query",
        "internal",
        {
          category?: string;
          isActive?: boolean;
          limit?: number;
          tenantId: string;
        },
        Array<any>
      >;
      listForBooking: FunctionReference<
        "query",
        "internal",
        { bookingId: string; limit?: number },
        Array<any>
      >;
      listForResource: FunctionReference<
        "query",
        "internal",
        { limit?: number; resourceId: string },
        Array<any>
      >;
    };
  };
  seasons: {
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
        { id: string }
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
        { id: string }
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
        { id: string }
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
        { id: string }
      >;
    };
    mutations: {
      cancelLease: FunctionReference<
        "mutation",
        "internal",
        { id: string; reason?: string },
        { success: boolean }
      >;
      close: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
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
        { id: string }
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
        { id: string }
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
        { id: string }
      >;
      publish: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      removeAllocation: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
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
        { success: boolean }
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
        { id: string }
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
        { success: boolean }
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
        { success: boolean }
      >;
    };
    queries: {
      get: FunctionReference<"query", "internal", { id: string }, any>;
      list: FunctionReference<
        "query",
        "internal",
        {
          isActive?: boolean;
          limit?: number;
          status?: string;
          tenantId: string;
        },
        Array<any>
      >;
      listAllocations: FunctionReference<
        "query",
        "internal",
        { limit?: number; seasonId?: string; tenantId: string },
        Array<any>
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
        Array<any>
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
        Array<any>
      >;
    };
  };
  auth: {
    mutations: {
      cleanupExpired: FunctionReference<
        "mutation",
        "internal",
        {},
        { magicLinks: number; oauthStates: number; sessions: number }
      >;
      consumeMagicLink: FunctionReference<
        "mutation",
        "internal",
        { token: string },
        any
      >;
      consumeOAuthState: FunctionReference<
        "mutation",
        "internal",
        { state: string },
        any
      >;
      createDemoToken: FunctionReference<
        "mutation",
        "internal",
        {
          expiresAt?: number;
          key: string;
          organizationId?: string;
          tenantId: string;
          tokenHash: string;
          userId: string;
        },
        { id: string }
      >;
      createMagicLink: FunctionReference<
        "mutation",
        "internal",
        {
          appId: string;
          appOrigin: string;
          email: string;
          expiresAt: number;
          returnPath: string;
          token: string;
        },
        { id: string }
      >;
      createOAuthState: FunctionReference<
        "mutation",
        "internal",
        {
          appId: string;
          appOrigin: string;
          expiresAt: number;
          provider: string;
          returnPath: string;
          signicatSessionId?: string;
          state: string;
        },
        { id: string }
      >;
      createSession: FunctionReference<
        "mutation",
        "internal",
        {
          appId?: string;
          expiresAt: number;
          provider: string;
          token: string;
          userId: string;
        },
        { id: string }
      >;
      importDemoToken: FunctionReference<
        "mutation",
        "internal",
        {
          expiresAt?: number;
          isActive: boolean;
          key: string;
          organizationId?: string;
          tenantId: string;
          tokenHash: string;
          userId: string;
        },
        { id: string }
      >;
      importMagicLink: FunctionReference<
        "mutation",
        "internal",
        {
          appId: string;
          appOrigin: string;
          consumed: boolean;
          consumedAt?: number;
          createdAt: number;
          email: string;
          expiresAt: number;
          returnPath: string;
          token: string;
        },
        { id: string }
      >;
      importOAuthState: FunctionReference<
        "mutation",
        "internal",
        {
          appId: string;
          appOrigin: string;
          consumed: boolean;
          createdAt: number;
          expiresAt: number;
          provider: string;
          returnPath: string;
          signicatSessionId?: string;
          state: string;
        },
        { id: string }
      >;
      importSession: FunctionReference<
        "mutation",
        "internal",
        {
          appId?: string;
          expiresAt: number;
          isActive: boolean;
          lastActiveAt: number;
          provider: string;
          token: string;
          userId: string;
        },
        { id: string }
      >;
      invalidateSession: FunctionReference<
        "mutation",
        "internal",
        { token: string },
        { success: boolean }
      >;
    };
    queries: {
      getSessionByToken: FunctionReference<
        "query",
        "internal",
        { token: string },
        any
      >;
      validateDemoToken: FunctionReference<
        "query",
        "internal",
        { key: string },
        any
      >;
      validateSession: FunctionReference<
        "query",
        "internal",
        { token: string },
        any
      >;
    };
  };
  rbac: {
    import: {
      importRole: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          isDefault: boolean;
          isSystem: boolean;
          name: string;
          permissions: Array<string>;
          tenantId: string;
        },
        { id: string }
      >;
      importUserRole: FunctionReference<
        "mutation",
        "internal",
        {
          assignedAt: number;
          roleId: string;
          tenantId: string;
          userId: string;
        },
        { id: string }
      >;
    };
    mutations: {
      assignRole: FunctionReference<
        "mutation",
        "internal",
        { roleId: string; tenantId: string; userId: string },
        { id: string }
      >;
      createRole: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          isDefault?: boolean;
          isSystem?: boolean;
          name: string;
          permissions: Array<string>;
          tenantId: string;
        },
        { id: string }
      >;
      deleteRole: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      revokeRole: FunctionReference<
        "mutation",
        "internal",
        { roleId: string; tenantId: string; userId: string },
        { success: boolean }
      >;
      updateRole: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          id: string;
          isDefault?: boolean;
          name?: string;
          permissions?: Array<string>;
        },
        { success: boolean }
      >;
    };
    queries: {
      checkPermission: FunctionReference<
        "query",
        "internal",
        { permission: string; tenantId: string; userId: string },
        { hasPermission: boolean }
      >;
      getRole: FunctionReference<"query", "internal", { id: string }, any>;
      getUserPermissions: FunctionReference<
        "query",
        "internal",
        { tenantId: string; userId: string },
        { permissions: Array<string> }
      >;
      listRoles: FunctionReference<
        "query",
        "internal",
        { limit?: number; tenantId: string },
        Array<any>
      >;
      listUserRoles: FunctionReference<
        "query",
        "internal",
        { limit?: number; tenantId?: string; userId?: string },
        Array<any>
      >;
    };
  };
  billing: {
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
        { id: string }
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
        { id: string }
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
        { id: string; invoiceNumber: string }
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
        { id: string }
      >;
      creditInvoice: FunctionReference<
        "mutation",
        "internal",
        { id: string; reason?: string },
        { success: boolean }
      >;
      markInvoicePaid: FunctionReference<
        "mutation",
        "internal",
        { id: string; paymentId?: string; paymentMethod?: string },
        { success: boolean }
      >;
      sendInvoice: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      storeInvoicePdf: FunctionReference<
        "mutation",
        "internal",
        { id: string; storageId: string },
        { success: boolean }
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
        { success: boolean }
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
        { success: boolean }
      >;
    };
    queries: {
      getInvoice: FunctionReference<"query", "internal", { id: string }, any>;
      getInvoiceDownloadUrl: FunctionReference<
        "query",
        "internal",
        { id: string },
        any
      >;
      getOrgBillingSummary: FunctionReference<
        "query",
        "internal",
        { organizationId: string; period?: string },
        any
      >;
      getPayment: FunctionReference<"query", "internal", { id: string }, any>;
      getSummary: FunctionReference<
        "query",
        "internal",
        { limit?: number; period?: string; userId: string },
        any
      >;
      listInvoices: FunctionReference<
        "query",
        "internal",
        { limit?: number; status?: string; userId: string },
        Array<any>
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
        any
      >;
      listPayments: FunctionReference<
        "query",
        "internal",
        { limit?: number; status?: string; tenantId: string },
        Array<any>
      >;
      listUserInvoices: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit?: number; status?: string; userId: string },
        any
      >;
      pendingCount: FunctionReference<
        "query",
        "internal",
        { limit?: number; userId: string },
        { count: number }
      >;
    };
  };
  integrations: {
    mutations: {
      completeSyncLog: FunctionReference<
        "mutation",
        "internal",
        {
          error?: string;
          id: string;
          metadata?: any;
          recordsFailed?: number;
          recordsProcessed?: number;
          status: string;
        },
        { success: boolean }
      >;
      configure: FunctionReference<
        "mutation",
        "internal",
        {
          apiKey?: string;
          config: any;
          environment?: string;
          integrationType: string;
          metadata?: any;
          name: string;
          secretKey?: string;
          tenantId: string;
          webhookSecret?: string;
        },
        { id: string }
      >;
      deleteWebhook: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      disableIntegration: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      enableIntegration: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      registerWebhook: FunctionReference<
        "mutation",
        "internal",
        {
          callbackUrl: string;
          events: Array<string>;
          integrationId: string;
          metadata?: any;
          secret?: string;
          tenantId: string;
        },
        { id: string }
      >;
      removeIntegration: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean }
      >;
      startSync: FunctionReference<
        "mutation",
        "internal",
        { integrationId: string; syncType: string; tenantId: string },
        { id: string }
      >;
      testConnection: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { status: string; success: boolean }
      >;
      updateConfig: FunctionReference<
        "mutation",
        "internal",
        {
          apiKey?: string;
          config?: any;
          environment?: string;
          id: string;
          metadata?: any;
          name?: string;
          secretKey?: string;
          webhookSecret?: string;
        },
        { success: boolean }
      >;
      updateWebhook: FunctionReference<
        "mutation",
        "internal",
        {
          callbackUrl?: string;
          events?: Array<string>;
          id: string;
          isActive?: boolean;
          metadata?: any;
          secret?: string;
        },
        { success: boolean }
      >;
    };
    queries: {
      getConfig: FunctionReference<
        "query",
        "internal",
        { integrationType: string; tenantId: string },
        any
      >;
      getSyncLog: FunctionReference<"query", "internal", { id: string }, any>;
      listConfigs: FunctionReference<
        "query",
        "internal",
        { limit?: number; tenantId: string },
        Array<any>
      >;
      listSyncLogs: FunctionReference<
        "query",
        "internal",
        { integrationId?: string; limit?: number; tenantId: string },
        Array<any>
      >;
      listWebhooks: FunctionReference<
        "query",
        "internal",
        { integrationId?: string; limit?: number; tenantId: string },
        Array<any>
      >;
    };
  };
};
