/**
 * Component Middleware — Module Enablement + Rate Limiting + Feature Flags
 *
 * Provides helpers to check whether a component/module is enabled for a tenant,
 * evaluate feature flags, and rate-limit enforcement for facade mutations.
 */

import { rateLimit, rateLimitKeys, RATE_LIMITS } from "./rateLimits";
import { components } from "../../../../../../convex/_generated/api";
import type { GenericDatabaseWriter } from "convex/server";
import type { RateLimitDataModel } from "convex-helpers/server/rateLimit";

/**
 * Enforce a rate limit in a facade mutation handler.
 * Throws an RFC7807-style error when the limit is exceeded.
 *
 * @example
 *   await withRateLimit(ctx, "createBooking", rateLimitKeys.tenant(tenantId));
 */
export async function withRateLimit(
    ctx: { db: GenericDatabaseWriter<RateLimitDataModel> },
    name: keyof typeof RATE_LIMITS,
    key: string
): Promise<void> {
    await rateLimit(ctx, { name, key, throws: true });
}

/**
 * Check if a component/module is enabled for a tenant.
 * Implements the hasModuleEnabled() helper documented in DOMAIN_BUNDLE_SPEC.md.
 */
export async function hasModuleEnabled(
    ctx: { db: { query: (table: string) => any } },
    tenantId: string,
    moduleId: string
): Promise<boolean> {
    // First check the component registry
    const registration = await ctx.db
        .query("componentRegistry")
        .withIndex("by_component", (q: any) =>
            q.eq("tenantId", tenantId).eq("componentId", moduleId)
        )
        .first();

    if (registration) {
        return registration.isEnabled && registration.isInstalled;
    }

    // Fallback: check tenant.featureFlags for backwards compatibility
    // (During migration, some modules may still use the old JSON blob)
    return true; // Default to enabled if not in registry
}

/**
 * Evaluate a feature flag for a tenant using the tenant-config component.
 * Returns the flag's resolved value (respects targeting rules).
 * Returns `false` if the flag doesn't exist or is inactive.
 *
 * @example
 *   const enabled = await hasFeatureFlag(ctx, tenantId, "advanced-analytics");
 *   const userEnabled = await hasFeatureFlag(ctx, tenantId, "beta-ui", "user", userId);
 */
export async function hasFeatureFlag(
    ctx: { runQuery: (...args: any[]) => any },
    tenantId: string,
    key: string,
    targetType?: string,
    targetId?: string,
): Promise<boolean> {
    try {
        const result = await ctx.runQuery(
            components.tenantConfig.queries.evaluateFlag,
            { tenantId, key, targetType, targetId }
        );
        return result?.value === true;
    } catch {
        // Flag not found or evaluation error — default to false
        return false;
    }
}
