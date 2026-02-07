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
        { id: string },
        Name
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
        { id: string },
        Name
      >;
    };
    mutations: {
      archiveConversation: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      assignConversation: FunctionReference<
        "mutation",
        "internal",
        { assigneeId: string; id: string },
        { success: boolean },
        Name
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
        { id: string },
        Name
      >;
      markMessagesAsRead: FunctionReference<
        "mutation",
        "internal",
        { conversationId: string; userId: string },
        { count: number; success: boolean },
        Name
      >;
      reopenConversation: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
      resolveConversation: FunctionReference<
        "mutation",
        "internal",
        { id: string; resolvedBy: string },
        { success: boolean },
        Name
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
        { id: string },
        Name
      >;
      setConversationPriority: FunctionReference<
        "mutation",
        "internal",
        { id: string; priority: string },
        { success: boolean },
        Name
      >;
      unassignConversation: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        { success: boolean },
        Name
      >;
    };
    queries: {
      getConversation: FunctionReference<
        "query",
        "internal",
        { id: string },
        any,
        Name
      >;
      listConversations: FunctionReference<
        "query",
        "internal",
        { limit?: number; status?: string; userId: string },
        Array<any>,
        Name
      >;
      listConversationsByAssignee: FunctionReference<
        "query",
        "internal",
        { assigneeId: string; limit?: number; status?: string },
        Array<any>,
        Name
      >;
      listMessages: FunctionReference<
        "query",
        "internal",
        { conversationId: string; limit?: number },
        Array<any>,
        Name
      >;
      unreadMessageCount: FunctionReference<
        "query",
        "internal",
        { userId: string },
        { count: number },
        Name
      >;
    };
  };
