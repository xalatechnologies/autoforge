/**
 * XalaBaaS SDK - Feature Flags & Module Registry Hooks
 *
 * React hooks for feature flag evaluation, module gating, and admin CRUD.
 * Query hooks: { data, isLoading, error }
 * Mutation hooks: { mutate, mutateAsync, isLoading, error, isSuccess }
 */

import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "../../_shared/hooks/convex-api";
import type { Id } from "../../_shared/hooks/convex-api";
import { useResolveTenantId } from "./use-tenant-id";

// ============================================================================
// Types
// ============================================================================

export interface FlagDefinition {
    _id: string;
    tenantId: string;
    key: string;
    name: string;
    description?: string;
    type: string;
    defaultValue: unknown;
    isActive: boolean;
    metadata?: Record<string, unknown>;
    _creationTime: number;
}

export interface FlagEvaluation {
    key: string;
    value: unknown;
    source: "default" | "rule";
    ruleId?: string;
}

export interface FlagRule {
    _id: string;
    tenantId: string;
    flagId: string;
    targetType: string;
    targetId: string;
    value: unknown;
    priority: number;
}

export interface ModuleEntry {
    _id: string;
    tenantId: string; // Actually Id<"tenants"> but displayed as string
    componentId: string;
    name: string;
    category: string;
    version: string;
    contractVersion: string;
    isCore: boolean;
    isEnabled: boolean;
    isInstalled: boolean;
    features: string[];
    installedAt: number;
    updatedAt: number;
}

// ============================================================================
// Feature Flag Hooks
// ============================================================================

/**
 * Evaluate a single feature flag for the current tenant.
 * Returns the resolved value respecting targeting rules.
 */
export function useFeatureFlag(
    key: string,
    tenantId?: Id<"tenants">
) {
    const resolvedTenantId = useResolveTenantId(tenantId);

    const data = useConvexQuery(
        api.domain.featureFlags.evaluateFlag,
        resolvedTenantId ? { tenantId: resolvedTenantId, key } : "skip"
    );

    const isLoading = resolvedTenantId !== undefined && data === undefined;

    return {
        data: data as FlagEvaluation | undefined,
        value: data?.value,
        isEnabled: data?.value === true,
        isLoading,
        error: null,
    };
}

/**
 * Evaluate all feature flags for the current tenant.
 * Returns a map of flag key -> evaluation result.
 */
export function useFeatureFlags(tenantId?: Id<"tenants">) {
    const resolvedTenantId = useResolveTenantId(tenantId);

    const data = useConvexQuery(
        api.domain.featureFlags.evaluateAllFlags,
        resolvedTenantId ? { tenantId: resolvedTenantId } : "skip"
    );

    const isLoading = resolvedTenantId !== undefined && data === undefined;
    const flags = (data ?? {}) as Record<string, FlagEvaluation>;

    return {
        data: flags,
        flags,
        isLoading,
        error: null,
    };
}

/**
 * Check if a module is enabled via the componentRegistry.
 */
export function useModuleEnabled(
    moduleId: string,
    tenantId?: Id<"tenants">
) {
    const resolvedTenantId = useResolveTenantId(tenantId);

    const data = useConvexQuery(
        api.domain.moduleRegistry.listEnabledModuleIds,
        resolvedTenantId ? { tenantId: resolvedTenantId } : "skip"
    );

    const isLoading = resolvedTenantId !== undefined && data === undefined;
    const enabledIds = (data ?? []) as string[];

    return {
        isEnabled: enabledIds.includes(moduleId),
        isLoading,
        error: null,
    };
}

/**
 * List all modules for the current tenant (for saas-admin module management UI).
 * Returns full module entries from the componentRegistry.
 */
export function useModules(tenantId?: Id<"tenants">) {
    const resolvedTenantId = useResolveTenantId(tenantId);

    const data = useConvexQuery(
        api.domain.moduleRegistry.listModules,
        resolvedTenantId ? { tenantId: resolvedTenantId } : "skip"
    );

    const isLoading = resolvedTenantId !== undefined && data === undefined;
    const modules = (data ?? []) as ModuleEntry[];

    return {
        data: modules,
        modules,
        isLoading,
        error: null,
    };
}

// ============================================================================
// Flag Admin Mutations
// ============================================================================

/**
 * Create a new feature flag definition.
 */
export function useCreateFlag() {
    const mutation = useConvexMutation(api.domain.featureFlags.createFlag);

    return {
        mutate: (input: {
            tenantId: Id<"tenants">;
            key: string;
            name: string;
            type: string;
            defaultValue: unknown;
            description?: string;
            metadata?: Record<string, unknown>;
        }) => {
            mutation(input);
        },
        mutateAsync: async (input: {
            tenantId: Id<"tenants">;
            key: string;
            name: string;
            type: string;
            defaultValue: unknown;
            description?: string;
            metadata?: Record<string, unknown>;
        }) => {
            return mutation(input);
        },
        isLoading: false,
        error: null,
        isSuccess: false,
    };
}

/**
 * Update an existing feature flag.
 */
export function useUpdateFlag() {
    const mutation = useConvexMutation(api.domain.featureFlags.updateFlag);

    return {
        mutate: (input: {
            tenantId: Id<"tenants">;
            id: string;
            name?: string;
            defaultValue?: unknown;
            isActive?: boolean;
            description?: string;
            metadata?: Record<string, unknown>;
        }) => {
            mutation(input);
        },
        mutateAsync: async (input: {
            tenantId: Id<"tenants">;
            id: string;
            name?: string;
            defaultValue?: unknown;
            isActive?: boolean;
            description?: string;
            metadata?: Record<string, unknown>;
        }) => {
            return mutation(input);
        },
        isLoading: false,
        error: null,
        isSuccess: false,
    };
}

/**
 * Delete a feature flag and its rules.
 */
export function useDeleteFlag() {
    const mutation = useConvexMutation(api.domain.featureFlags.deleteFlag);

    return {
        mutate: (input: { tenantId: Id<"tenants">; id: string }) => {
            mutation(input);
        },
        mutateAsync: async (input: { tenantId: Id<"tenants">; id: string }) => {
            return mutation(input);
        },
        isLoading: false,
        error: null,
        isSuccess: false,
    };
}

/**
 * Enable a module for the current tenant.
 */
export function useEnableModule() {
    const mutation = useConvexMutation(api.domain.moduleRegistry.enableModule);

    return {
        mutate: (input: { tenantId: Id<"tenants">; moduleId: string }) => {
            mutation(input);
        },
        mutateAsync: async (input: { tenantId: Id<"tenants">; moduleId: string }) => {
            return mutation(input);
        },
        isLoading: false,
        error: null,
        isSuccess: false,
    };
}

/**
 * Disable a module for the current tenant.
 * Core modules cannot be disabled.
 */
export function useDisableModule() {
    const mutation = useConvexMutation(api.domain.moduleRegistry.disableModule);

    return {
        mutate: (input: { tenantId: Id<"tenants">; moduleId: string }) => {
            mutation(input);
        },
        mutateAsync: async (input: { tenantId: Id<"tenants">; moduleId: string }) => {
            return mutation(input);
        },
        isLoading: false,
        error: null,
        isSuccess: false,
    };
}

/**
 * List raw flag definitions (for admin UI that shows the config, not evaluated values).
 */
export function useFlagDefinitions(tenantId?: Id<"tenants">) {
    const resolvedTenantId = useResolveTenantId(tenantId);

    const data = useConvexQuery(
        api.domain.featureFlags.listFlags,
        resolvedTenantId ? { tenantId: resolvedTenantId } : "skip"
    );

    const isLoading = resolvedTenantId !== undefined && data === undefined;
    const flags = (data ?? []) as FlagDefinition[];

    return {
        data: flags,
        flags,
        isLoading,
        error: null,
    };
}
