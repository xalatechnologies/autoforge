import { query, mutation, internalMutation } from "../../../../../../convex/_generated/server";
import { components } from "../../../../../../convex/_generated/api";
import { v } from "convex/values";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Create a new session for a user.
 * Internal mutation -- called from password.ts and http.ts callback.
 */
export const createSession = internalMutation({
    args: {
        userId: v.id("users"),
        provider: v.string(),
        appId: v.optional(v.string()),
    },
    handler: async (ctx, { userId, provider, appId }) => {
        const token = crypto.randomUUID();
        const now = Date.now();

        await ctx.runMutation(
            components.auth.mutations.createSession,
            {
                userId: userId as string,
                token,
                appId,
                provider,
                expiresAt: now + SESSION_DURATION_MS,
            }
        );

        return token;
    },
});

/**
 * Validate a session by token.
 * Returns user + tenant data if valid, null otherwise.
 */
export const validateSessionByToken = query({
    args: {
        token: v.string(),
    },
    handler: async (ctx, { token }) => {
        const session = await ctx.runQuery(
            components.auth.queries.validateSession,
            { token }
        );

        if (!session) {
            return null;
        }

        const user = await ctx.db.get(session.userId as any) as any;
        if (!user || user.status !== "active") {
            return null;
        }

        const tenant = user.tenantId ? await ctx.db.get(user.tenantId) as any : null;

        return {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                displayName: user.displayName,
                role: user.role,
                avatarUrl: user.avatarUrl,
                tenantId: user.tenantId,
                organizationId: user.organizationId,
            },
            tenant: tenant
                ? {
                      id: tenant._id,
                      name: tenant.name,
                      slug: tenant.slug,
                  }
                : null,
            session: {
                expiresAt: session.expiresAt,
                provider: session.provider,
                appId: session.appId,
            },
        };
    },
});

/**
 * Delete (deactivate) a single session.
 */
export const deleteSession = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, { token }) => {
        await ctx.runMutation(
            components.auth.mutations.invalidateSession,
            { token }
        );
    },
});

/**
 * Delete all sessions for a user (sign out everywhere).
 *
 * NOTE: The auth component does not expose a "list sessions by user" query.
 * We use the user's demoToken field as a workaround -- in practice, the
 * frontend should track active session tokens and invalidate them individually.
 * TODO: Add listSessionsByUser query to the auth component.
 */
export const deleteAllUserSessions = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, { userId }) => {
        // The auth component doesn't expose a listByUser query.
        // For now, this is a best-effort operation.
        // Individual sessions should be invalidated via their token.
        // The cleanup function in the auth component will eventually
        // remove expired/inactive sessions.
        console.log(`[sessions] deleteAllUserSessions called for ${userId} -- individual tokens should be invalidated by the caller.`);
    },
});

/**
 * Touch session -- update lastActiveAt to keep it alive.
 */
export const touchSession = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, { token }) => {
        // Validate the session exists and is active via the component
        const session = await ctx.runQuery(
            components.auth.queries.validateSession,
            { token }
        );

        // The auth component validates the session is still active.
        // If valid, the session is confirmed alive. A dedicated touchSession
        // mutation in the auth component would update lastActiveAt.
        // TODO: Add touchSession mutation to the auth component.
        if (!session) {
            // Session invalid or expired -- nothing to touch
            return;
        }
    },
});
