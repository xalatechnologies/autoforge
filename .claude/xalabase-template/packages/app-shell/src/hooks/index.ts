/**
 * Hooks - App Shell
 *
 * Exports all hooks for XalaBaaS applications.
 */

export { useAuditLog } from './useAuditLog';
export { useDashboardStats } from './useDashboardStats';
export { useUsers } from './useUsers';

// Re-export from SDK for backward compatibility (saas-admin imports useModules from @xalabaas/app-shell)
export { useModules } from '@xalabaas/sdk';
