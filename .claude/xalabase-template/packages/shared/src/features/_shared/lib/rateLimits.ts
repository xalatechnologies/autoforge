/**
 * Rate Limits — Per-tenant and per-user API rate limiting
 *
 * Uses convex-helpers/server/rateLimit for token bucket and fixed window patterns.
 * Integrated into the facade middleware chain.
 *
 * @see https://github.com/get-convex/convex-helpers#rate-limiting
 */

import { defineRateLimits } from "convex-helpers/server/rateLimit";

// =============================================================================
// RATE LIMIT DEFINITIONS
// =============================================================================

/**
 * Rate limit configuration.
 * Each entry defines a named rate limit with its algorithm and parameters.
 *
 * Usage in facade mutations:
 *   await rateLimit(ctx, { name: "createBooking", key: rateLimitKeys.tenant(tenantId) });
 */
export const RATE_LIMITS = {
    // -------------------------------------------------------------------------
    // Booking operations (per-tenant)
    // -------------------------------------------------------------------------
    createBooking: {
        kind: "token bucket" as const,
        rate: 10,        // 10 tokens per period
        period: 60_000,  // 1 minute
        capacity: 20,    // Burst capacity of 20
    },
    cancelBooking: {
        kind: "token bucket" as const,
        rate: 5,
        period: 60_000,
        capacity: 10,
    },

    // -------------------------------------------------------------------------
    // Review operations (per-user)
    // -------------------------------------------------------------------------
    createReview: {
        kind: "token bucket" as const,
        rate: 5,
        period: 60_000,
        capacity: 10,
    },
    moderateReview: {
        kind: "token bucket" as const,
        rate: 20,
        period: 60_000,
        capacity: 50,
    },

    // -------------------------------------------------------------------------
    // Messaging (per-user)
    // -------------------------------------------------------------------------
    sendMessage: {
        kind: "token bucket" as const,
        rate: 20,
        period: 60_000,
        capacity: 50,
    },

    // -------------------------------------------------------------------------
    // Auth operations (per-IP or per-user — fixed window)
    // -------------------------------------------------------------------------
    loginAttempt: {
        kind: "fixed window" as const,
        rate: 5,
        period: 300_000,  // 5 minutes
    },
    passwordReset: {
        kind: "fixed window" as const,
        rate: 3,
        period: 3_600_000, // 1 hour
    },
    magicLinkRequest: {
        kind: "fixed window" as const,
        rate: 5,
        period: 600_000,  // 10 minutes
    },

    // -------------------------------------------------------------------------
    // Admin operations (per-tenant)
    // -------------------------------------------------------------------------
    bulkExport: {
        kind: "token bucket" as const,
        rate: 1,
        period: 60_000,
        capacity: 3,
    },
    bulkImport: {
        kind: "token bucket" as const,
        rate: 1,
        period: 60_000,
        capacity: 2,
    },

    // -------------------------------------------------------------------------
    // General API (per-tenant)
    // -------------------------------------------------------------------------
    apiGeneral: {
        kind: "token bucket" as const,
        rate: 100,
        period: 60_000,
        capacity: 200,
    },

    // -------------------------------------------------------------------------
    // Notification operations (per-user)
    // -------------------------------------------------------------------------
    createNotification: {
        kind: "token bucket" as const,
        rate: 30,
        period: 60_000,
        capacity: 60,
    },

    // -------------------------------------------------------------------------
    // Search operations (per-tenant)
    // -------------------------------------------------------------------------
    searchQuery: {
        kind: "token bucket" as const,
        rate: 30,
        period: 60_000,
        capacity: 60,
    },
} as const;

// =============================================================================
// TYPED RATE LIMIT FUNCTIONS
// =============================================================================

/**
 * Typed rate limit functions derived from RATE_LIMITS definitions.
 *
 * - rateLimit(ctx, { name, key, throws? }) — Consume a token, throw or return { ok, retryAt }
 * - checkRateLimit(ctx, { name, key }) — Check without consuming (read-only)
 * - resetRateLimit(ctx, { name, key }) — Reset a rate limit bucket
 */
export const { rateLimit, checkRateLimit, resetRateLimit } =
    defineRateLimits(RATE_LIMITS);

// =============================================================================
// KEY BUILDERS
// =============================================================================

/**
 * Rate limit key builder helpers.
 * Use these to construct the rate limit key for each request.
 */
export const rateLimitKeys = {
    /** Key scoped to a tenant */
    tenant: (tenantId: string) => `tenant:${tenantId}`,
    /** Key scoped to a user */
    user: (userId: string) => `user:${userId}`,
    /** Key scoped to a tenant + user */
    tenantUser: (tenantId: string, userId: string) => `tenant:${tenantId}:user:${userId}`,
    /** Key scoped to an IP address */
    ip: (ipAddress: string) => `ip:${ipAddress}`,
};
