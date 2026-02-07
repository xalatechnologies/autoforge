import type { MutationCtx, QueryCtx } from "../../../../../../convex/_generated/server";
import type { Id } from "../../../../../../convex/_generated/dataModel";

/**
 * Validate that a userId refers to an active user in the core users table.
 * Use in facade mutations that accept a userId arg.
 *
 * This replaces the broken `ctx.auth.getUserIdentity()` pattern which always
 * returns null because the app uses a custom session system (not Convex built-in auth).
 */
export async function requireActiveUser(
    ctx: MutationCtx | QueryCtx,
    userId: Id<"users">
): Promise<{ userId: Id<"users">; email: string }> {
    const user = await ctx.db.get(userId);
    if (!user || user.status !== "active") {
        throw new Error("User not found or inactive");
    }
    return { userId: user._id, email: user.email };
}

/**
 * @deprecated Uses ctx.auth.getUserIdentity() which always returns null
 * because the app uses a custom session system, not Convex built-in auth.
 * Use requireActiveUser(ctx, userId) instead for mutations with a userId arg,
 * or simply remove the auth check for admin-only mutations.
 */
export async function requireAuth(ctx: MutationCtx | QueryCtx): Promise<{ userId: string; email?: string }> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Authentication required");
    }
    const user = await ctx.db
        .query("users")
        .withIndex("by_authUserId", (q: any) => q.eq("authUserId", identity.subject))
        .first();

    if (!user) {
        throw new Error("User not found");
    }

    return { userId: user._id as string, email: user.email };
}
