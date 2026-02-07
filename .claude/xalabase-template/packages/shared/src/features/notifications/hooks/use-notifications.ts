/**
 * XalaBaaS SDK - Notification Hooks (Tier 2)
 *
 * React hooks for in-app notifications, push subscriptions, and
 * notification preferences. Connected to Convex notification functions.
 *
 * Queries:  { data, isLoading, error }
 * Mutations: { mutate, mutateAsync, isLoading, error, isSuccess }
 */

import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "../../_shared/hooks/convex-api";
import { useResolveTenantId } from "../../tenant-config/hooks/use-tenant-id";
import type { Id } from "../../_shared/hooks/convex-api";

// =============================================================================
// Query Key Factory (inert -- kept for future React Query migration)
// =============================================================================

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params?: Record<string, unknown>) => [...notificationKeys.all, "list", params] as const,
  my: (params?: Record<string, unknown>) => [...notificationKeys.all, "my", params] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
  templates: () => [...notificationKeys.all, "templates"] as const,
  push: () => [...notificationKeys.all, "push"] as const,
  pushSubscriptions: () => [...notificationKeys.all, "push", "subscriptions"] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
  permission: () => [...notificationKeys.all, "push", "permission"] as const,
};

// =============================================================================
// Types
// =============================================================================

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  readAt?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  type: string;
  titleTemplate: string;
  bodyTemplate: string;
  channels: string[];
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  provider: "web" | "fcm" | "apns";
  createdAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  categories: Record<string, { email: boolean; push: boolean; inApp: boolean }>;
}

// =============================================================================
// Stub helpers (for features not yet wired)
// =============================================================================

function useStubQuery<T>(emptyValue: T): { data: { data: T }; isLoading: false; error: null } {
  return { data: { data: emptyValue }, isLoading: false, error: null };
}

function useStubMutation<TArgs = void, TResult = void>(): {
  mutate: (args: TArgs) => void;
  mutateAsync: (args: TArgs) => Promise<TResult>;
  isLoading: false;
  error: null;
  isSuccess: false;
} {
  return {
    mutate: (_args: TArgs) => { },
    mutateAsync: (_args: TArgs) => Promise.resolve(undefined as unknown as TResult),
    isLoading: false,
    error: null,
    isSuccess: false,
  };
}

// =============================================================================
// Notification Query Hooks (Wired to Convex)
// =============================================================================

/**
 * Get all notifications (admin view).
 * Stub: returns empty array (needs admin-level query).
 */
export function useNotifications(params?: { type?: string; limit?: number; cursor?: string }) {
  return useStubQuery<Notification[]>([]);
}

/**
 * Get current user's notifications.
 * Connected to Convex: api.domain.notifications.listByUser
 */
export function useMyNotifications(
  userId: Id<"users"> | undefined,
  params?: { unreadOnly?: boolean; limit?: number }
) {
  const data = useConvexQuery(
    api.domain.notifications.listByUser,
    userId ? { userId, limit: params?.limit, unreadOnly: params?.unreadOnly } : "skip"
  );

  const isLoading = userId !== undefined && data === undefined;

  // Transform to SDK format
  const notifications: Notification[] = (data ?? []).map((n) => ({
    id: n._id as string,
    tenantId: n.tenantId as string,
    userId: n.userId as string,
    type: n.type,
    title: n.title,
    body: n.body ?? "",
    readAt: n.readAt ? new Date(n.readAt).toISOString() : undefined,
    actionUrl: n.link,
    metadata: n.metadata as Record<string, unknown>,
    createdAt: new Date(n._creationTime).toISOString(),
  }));

  return {
    data: { data: notifications },
    notifications,
    isLoading,
    error: null,
  };
}

/**
 * Get unread notification count for the current user.
 * Connected to Convex: api.domain.notifications.unreadCount
 */
export function useNotificationUnreadCount(userId?: Id<"users">) {
  const data = useConvexQuery(
    api.domain.notifications.unreadCount,
    userId ? { userId } : "skip"
  );

  const isLoading = userId !== undefined && data === undefined;

  return {
    data: { data: data ?? { count: 0 } },
    isLoading,
    error: null,
  };
}

/**
 * Get notification templates (admin view).
 * Stub: returns empty array until templates are implemented.
 */
export function useNotificationTemplates() {
  return useStubQuery<NotificationTemplate[]>([]);
}

// =============================================================================
// Notification Mutation Hooks (Wired to Convex)
// =============================================================================

/**
 * Mark a single notification as read.
 * Connected to Convex: api.domain.notifications.markAsRead
 */
export function useMarkNotificationRead() {
  const mutation = useConvexMutation(api.domain.notifications.markAsRead);

  return {
    mutate: (args: { id: Id<"notifications"> }) => {
      mutation(args);
    },
    mutateAsync: async (args: { id: Id<"notifications"> }) => {
      await mutation(args);
      return { success: true };
    },
    isLoading: false,
    error: null,
    isSuccess: false,
  };
}

/**
 * Mark all notifications as read for the current user.
 * Connected to Convex: api.domain.notifications.markAllAsRead
 */
export function useMarkAllNotificationsRead() {
  const mutation = useConvexMutation(api.domain.notifications.markAllAsRead);

  return {
    mutate: (args: { userId: Id<"users"> }) => {
      mutation(args);
    },
    mutateAsync: async (args: { userId: Id<"users"> }) => {
      await mutation(args);
      return { success: true };
    },
    isLoading: false,
    error: null,
    isSuccess: false,
  };
}

/**
 * Delete a notification.
 * Connected to Convex: api.domain.notifications.remove
 */
export function useDeleteNotification() {
  const mutation = useConvexMutation(api.domain.notifications.remove);

  return {
    mutate: (args: { id: Id<"notifications"> }) => {
      mutation(args);
    },
    mutateAsync: async (args: { id: Id<"notifications"> }) => {
      await mutation(args);
      return { success: true };
    },
    isLoading: false,
    error: null,
    isSuccess: false,
  };
}

// =============================================================================
// Push Notification Query Hooks (Stubs - needs push infrastructure)
// =============================================================================

/**
 * Get push subscriptions for the current user.
 * Stub: returns empty array until push infrastructure exists.
 */
export function usePushSubscriptions() {
  return useStubQuery<PushSubscription[]>([]);
}

/**
 * Get notification preferences for the current user.
 * Connected to Convex: api.domain.notifications.getPreferences
 */
export function useNotificationPreferences(userId?: Id<"users">) {
  const data = useConvexQuery(
    api.domain.notifications.getPreferences,
    userId ? { userId } : "skip"
  );

  const isLoading = userId !== undefined && data === undefined;

  // Transform to preferences object
  const prefs: NotificationPreferences = {
    email: true,
    push: true,
    inApp: true,
    categories: {},
  };

  // Build preferences from array
  (data ?? []).forEach((p) => {
    if (!prefs.categories[p.category]) {
      prefs.categories[p.category] = { email: true, push: true, inApp: true };
    }
    if (p.channel === "email") prefs.categories[p.category].email = p.enabled;
    if (p.channel === "push") prefs.categories[p.category].push = p.enabled;
    if (p.channel === "in_app") prefs.categories[p.category].inApp = p.enabled;
  });

  return {
    data: { data: prefs },
    isLoading,
    error: null,
  };
}

/**
 * Get current push permission status from the browser.
 * Stub: returns "default" until push infrastructure exists.
 */
export function usePushPermission() {
  return useStubQuery<"granted" | "denied" | "default">("default");
}

// =============================================================================
// Push Notification Mutation Hooks (Stubs - needs push infrastructure)
// =============================================================================

/**
 * Register a new push subscription.
 * Stub: returns noop mutation until push infrastructure exists.
 */
export function useRegisterPushSubscription() {
  return useStubMutation<
    { endpoint: string; keys: { p256dh: string; auth: string } },
    { id: string }
  >();
}

/**
 * Unsubscribe from push notifications.
 * Stub: returns noop mutation until push infrastructure exists.
 */
export function useUnsubscribePush() {
  return useStubMutation<void, { success: boolean }>();
}

/**
 * Delete a specific push subscription by ID.
 * Stub: returns noop mutation until push infrastructure exists.
 */
export function useDeletePushSubscription() {
  return useStubMutation<{ id: string }, { success: boolean }>();
}

/**
 * Update notification preferences for the current user.
 * Connected to Convex: api.domain.notifications.updatePreference
 */
export function useUpdateNotificationPreferences() {
  const mutation = useConvexMutation(api.domain.notifications.updatePreference);

  return {
    mutate: (args: {
      tenantId: Id<"tenants">;
      userId: Id<"users">;
      channel: string;
      category: string;
      enabled: boolean;
    }) => {
      mutation(args);
    },
    mutateAsync: async (args: {
      tenantId: Id<"tenants">;
      userId: Id<"users">;
      channel: string;
      category: string;
      enabled: boolean;
    }) => {
      await mutation(args);
      return { success: true };
    },
    isLoading: false,
    error: null,
    isSuccess: false,
  };
}

/**
 * Send a test push notification to the current user.
 * Stub: returns noop mutation until push infrastructure exists.
 */
export function useTestPushNotification() {
  return useStubMutation<void, { success: boolean }>();
}

/**
 * Combined push subscription flow: request permission, subscribe, register.
 * Stub: returns noop mutation until push infrastructure exists.
 */
export function usePushSubscriptionFlow() {
  return useStubMutation<void, { subscribed: boolean; permission: string }>();
}
