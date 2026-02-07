/**
 * Auth Sessions Facade — delegates to auth component.
 * Preserves api.domain.authSessions.* for SDK compatibility.
 */

import { mutation, query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";
import { rateLimit, rateLimitKeys } from "../lib/rateLimits";

// =============================================================================
// SESSION FUNCTIONS
// =============================================================================

export const createSession = mutation({
    args: {
        userId: v.id("users"),
        token: v.string(),
        appId: v.optional(v.string()),
        provider: v.string(),
        expiresAt: v.number(),
    },
    handler: async (ctx, args) => {
        // Rate limit: per-user login attempts
        await rateLimit(ctx, {
            name: "loginAttempt",
            key: rateLimitKeys.user(args.userId as string),
            throws: true,
        });

        return ctx.runMutation(components.auth.mutations.createSession, {
            ...args,
            userId: args.userId as string,
        });
    },
});

export const validateSession = query({
    args: { token: v.string() },
    handler: async (ctx, { token }) => {
        return ctx.runQuery(components.auth.queries.validateSession, { token });
    },
});

export const invalidateSession = mutation({
    args: { token: v.string() },
    handler: async (ctx, { token }) => {
        return ctx.runMutation(components.auth.mutations.invalidateSession, { token });
    },
});

export const getSessionByToken = query({
    args: { token: v.string() },
    handler: async (ctx, { token }) => {
        return ctx.runQuery(components.auth.queries.getSessionByToken, { token });
    },
});

// =============================================================================
// OAUTH STATE FUNCTIONS
// =============================================================================

export const createOAuthState = mutation({
    args: {
        state: v.string(),
        provider: v.string(),
        appOrigin: v.string(),
        returnPath: v.string(),
        appId: v.string(),
        signicatSessionId: v.optional(v.string()),
        expiresAt: v.number(),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.auth.mutations.createOAuthState, args);
    },
});

export const consumeOAuthState = mutation({
    args: { state: v.string() },
    handler: async (ctx, { state }) => {
        return ctx.runMutation(components.auth.mutations.consumeOAuthState, { state });
    },
});

// =============================================================================
// MAGIC LINK FUNCTIONS
// =============================================================================

export const createMagicLink = mutation({
    args: {
        email: v.string(),
        token: v.string(),
        appOrigin: v.string(),
        returnPath: v.string(),
        appId: v.string(),
        expiresAt: v.number(),
    },
    handler: async (ctx, args) => {
        // Rate limit: per-email magic link requests
        await rateLimit(ctx, {
            name: "magicLinkRequest",
            key: rateLimitKeys.user(args.email),
            throws: true,
        });

        return ctx.runMutation(components.auth.mutations.createMagicLink, args);
    },
});

export const consumeMagicLink = mutation({
    args: { token: v.string() },
    handler: async (ctx, { token }) => {
        return ctx.runMutation(components.auth.mutations.consumeMagicLink, { token });
    },
});

// =============================================================================
// DEMO TOKEN FUNCTIONS
// =============================================================================

export const createDemoToken = mutation({
    args: {
        key: v.string(),
        tenantId: v.id("tenants"),
        organizationId: v.optional(v.id("organizations")),
        userId: v.id("users"),
        tokenHash: v.string(),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return ctx.runMutation(components.auth.mutations.createDemoToken, {
            ...args,
            tenantId: args.tenantId as string,
            organizationId: args.organizationId ? (args.organizationId as string) : undefined,
            userId: args.userId as string,
        });
    },
});

export const validateDemoToken = query({
    args: { key: v.string() },
    handler: async (ctx, { key }) => {
        return ctx.runQuery(components.auth.queries.validateDemoToken, { key });
    },
});

// =============================================================================
// CLEANUP
// =============================================================================

export const cleanupExpired = mutation({
    args: {},
    handler: async (ctx) => {
        return ctx.runMutation(components.auth.mutations.cleanupExpired, {});
    },
});
