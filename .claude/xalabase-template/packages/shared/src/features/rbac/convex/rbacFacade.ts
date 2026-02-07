/**
 * RBAC Facade — delegates to rbac component.
 * Preserves api.domain.rbacFacade.* for SDK compatibility.
 * Does NOT overwrite convex/rbac/index.ts.
 */

import { mutation, query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";
import { requireActiveUser } from "../lib/auth";

// =============================================================================
// ROLE QUERIES
// =============================================================================

export const listRoles = query({
    args: { tenantId: v.id("tenants") },
    handler: async (ctx, { tenantId }) => {
        return ctx.runQuery(components.rbac.queries.listRoles, { tenantId: tenantId as string });
    },
});

export const getRole = query({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        return ctx.runQuery(components.rbac.queries.getRole, { id });
    },
});

// =============================================================================
// ROLE MUTATIONS
// =============================================================================

export const createRole = mutation({
    args: {
        tenantId: v.id("tenants"),
        name: v.string(),
        description: v.optional(v.string()),
        permissions: v.array(v.string()),
        isDefault: v.optional(v.boolean()),
        isSystem: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runMutation(components.rbac.mutations.createRole, { ...args, tenantId: args.tenantId as string });

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: args.tenantId as string,
            entityType: "role",
            entityId: result.id as string,
            action: "created",
            sourceComponent: "rbac",
            newState: { name: args.name, permissions: args.permissions },
        });

        return result;
    },
});

export const updateRole = mutation({
    args: {
        id: v.string(),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        permissions: v.optional(v.array(v.string())),
        isDefault: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const result = await ctx.runMutation(components.rbac.mutations.updateRole, args);

        // Audit — get role to find tenantId
        const role = await ctx.runQuery(components.rbac.queries.getRole, { id: args.id });
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: (role as any)?.tenantId ?? "",
            entityType: "role",
            entityId: args.id as string,
            action: "updated",
            sourceComponent: "rbac",
        });

        return result;
    },
});

export const deleteRole = mutation({
    args: { id: v.string() },
    handler: async (ctx, { id }) => {
        // Get role before deletion for audit
        const role = await ctx.runQuery(components.rbac.queries.getRole, { id });

        const result = await ctx.runMutation(components.rbac.mutations.deleteRole, { id });

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: (role as any)?.tenantId ?? "",
            entityType: "role",
            entityId: id as string,
            action: "deleted",
            sourceComponent: "rbac",
        });

        return result;
    },
});

// =============================================================================
// USER-ROLE QUERIES & MUTATIONS
// =============================================================================

export const listUserRoles = query({
    args: { userId: v.optional(v.id("users")), tenantId: v.optional(v.id("tenants")) },
    handler: async (ctx, { userId, tenantId }) => {
        return ctx.runQuery(components.rbac.queries.listUserRoles, {
            userId: userId ? (userId as string) : undefined,
            tenantId: tenantId ? (tenantId as string) : undefined,
        });
    },
});

export const assignRole = mutation({
    args: {
        userId: v.id("users"),
        roleId: v.string(),
        tenantId: v.id("tenants"),
    },
    handler: async (ctx, args) => {
        await requireActiveUser(ctx, args.userId);

        const result = await ctx.runMutation(components.rbac.mutations.assignRole, {
            userId: args.userId as string,
            roleId: args.roleId,
            tenantId: args.tenantId as string,
        });

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: args.tenantId as string,
            userId: args.userId as string,
            entityType: "userRole",
            entityId: args.roleId as string,
            action: "role_assigned",
            sourceComponent: "rbac",
            newState: { userId: args.userId as string, roleId: args.roleId as string },
        });

        return result;
    },
});

export const revokeRole = mutation({
    args: {
        userId: v.id("users"),
        roleId: v.string(),
        tenantId: v.id("tenants"),
    },
    handler: async (ctx, args) => {
        await requireActiveUser(ctx, args.userId);

        const result = await ctx.runMutation(components.rbac.mutations.revokeRole, {
            userId: args.userId as string,
            roleId: args.roleId,
            tenantId: args.tenantId as string,
        });

        // Audit
        await ctx.runMutation(components.audit.functions.create, {
            tenantId: args.tenantId as string,
            userId: args.userId as string,
            entityType: "userRole",
            entityId: args.roleId as string,
            action: "role_revoked",
            sourceComponent: "rbac",
            newState: { userId: args.userId as string, roleId: args.roleId as string },
        });

        return result;
    },
});

// =============================================================================
// PERMISSION CHECKS
// =============================================================================

export const checkPermission = query({
    args: {
        userId: v.id("users"),
        tenantId: v.id("tenants"),
        permission: v.string(),
    },
    handler: async (ctx, { userId, tenantId, permission }) => {
        return ctx.runQuery(components.rbac.queries.checkPermission, {
            userId: userId as string,
            tenantId: tenantId as string,
            permission,
        });
    },
});

export const getUserPermissions = query({
    args: {
        userId: v.id("users"),
        tenantId: v.id("tenants"),
    },
    handler: async (ctx, { userId, tenantId }) => {
        return ctx.runQuery(components.rbac.queries.getUserPermissions, {
            userId: userId as string,
            tenantId: tenantId as string,
        });
    },
});
