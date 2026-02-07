/**
 * Module Functions Tests
 *
 * Tests for module installation and management.
 * User Stories: US-16.1, US-16.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Module Functions', () => {
    let store: TestDataStore;
    let tenantId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Module Test Tenant' });
    });

    describe('US-16.1: Module Catalog', () => {
        it('module.list.success - should list available modules', async () => {
            const ctx = createMockContext(store);

            store.seedModule({ key: 'advanced-booking', name: 'Advanced Booking', isCore: false });
            store.seedModule({ key: 'payment-gateway', name: 'Payment Gateway', isCore: false });

            const modules = await ctx.db.query('modules')
                .collect();

            expect(modules).toHaveLength(2);
        });

        it('module.list.core - should identify core modules', async () => {
            const ctx = createMockContext(store);

            store.seedModule({ key: 'booking', name: 'Booking', isCore: true });
            store.seedModule({ key: 'messaging', name: 'Messaging', isCore: false });

            const modules = await ctx.db.query('modules')
                .collect();

            const core = modules.filter((m: any) => m.isCore);
            expect(core).toHaveLength(1);
            expect(core[0].key).toBe('booking');
        });

        it('module.get.success - should get module by key', async () => {
            const ctx = createMockContext(store);

            const moduleId = store.seedModule({
                key: 'advanced-booking',
                name: 'Advanced Booking',
                description: 'Advanced booking features',
            });

            const module = await ctx.db.get(moduleId);
            expect(module).toMatchObject({
                key: 'advanced-booking',
                name: 'Advanced Booking',
            });
        });
    });

    describe('US-16.2: Module Management', () => {
        it('module.install.success - should install module for tenant', async () => {
            const ctx = createMockContext(store);

            store.seedModule({ key: 'messaging', name: 'Messaging' });

            // Install module for tenant
            const installId = await ctx.db.insert('tenantModules', {
                tenantId,
                moduleKey: 'messaging',
                isEnabled: true,
                installedAt: Date.now(),
            });

            expect(installId).toBeDefined();

            const installed = await ctx.db.get(installId);
            expect(installed?.moduleKey).toBe('messaging');
            expect(installed?.isEnabled).toBe(true);
        });

        it('module.uninstall.success - should uninstall module', async () => {
            const ctx = createMockContext(store);

            store.seedModule({ key: 'messaging', name: 'Messaging' });

            const installId = await ctx.db.insert('tenantModules', {
                tenantId,
                moduleKey: 'messaging',
                isEnabled: true,
                installedAt: Date.now(),
            });

            await ctx.db.delete(installId);

            const installed = await ctx.db.get(installId);
            expect(installed).toBeNull();
        });

        it('module.enable.success - should enable installed module', async () => {
            const ctx = createMockContext(store);

            const installId = await ctx.db.insert('tenantModules', {
                tenantId,
                moduleKey: 'messaging',
                isEnabled: false,
                installedAt: Date.now(),
            });

            await ctx.db.patch(installId, { isEnabled: true });

            const installed = await ctx.db.get(installId);
            expect(installed?.isEnabled).toBe(true);
        });

        it('module.disable.success - should disable installed module', async () => {
            const ctx = createMockContext(store);

            const installId = await ctx.db.insert('tenantModules', {
                tenantId,
                moduleKey: 'messaging',
                isEnabled: true,
                installedAt: Date.now(),
            });

            await ctx.db.patch(installId, { isEnabled: false });

            const installed = await ctx.db.get(installId);
            expect(installed?.isEnabled).toBe(false);
        });
    });

    describe('Module Queries', () => {
        it('module.tenant-modules - should list modules for tenant', async () => {
            const ctx = createMockContext(store);

            await ctx.db.insert('tenantModules', { tenantId, moduleKey: 'messaging', isEnabled: true, installedAt: Date.now() });
            await ctx.db.insert('tenantModules', { tenantId, moduleKey: 'billing', isEnabled: true, installedAt: Date.now() });

            const tenantModules = await ctx.db.query('tenantModules')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(tenantModules).toHaveLength(2);
        });

        it('module.is-enabled - should check if module is enabled for tenant', async () => {
            const ctx = createMockContext(store);

            await ctx.db.insert('tenantModules', { tenantId, moduleKey: 'messaging', isEnabled: true, installedAt: Date.now() });
            await ctx.db.insert('tenantModules', { tenantId, moduleKey: 'billing', isEnabled: false, installedAt: Date.now() });

            const tenantModules = await ctx.db.query('tenantModules')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const messagingEnabled = tenantModules.find((m: any) => m.moduleKey === 'messaging')?.isEnabled;
            const billingEnabled = tenantModules.find((m: any) => m.moduleKey === 'billing')?.isEnabled;

            expect(messagingEnabled).toBe(true);
            expect(billingEnabled).toBe(false);
        });

        it('module.active-only - should filter active modules', async () => {
            const ctx = createMockContext(store);

            store.seedModule({ key: 'active-mod', name: 'Active', isActive: true });
            store.seedModule({ key: 'inactive-mod', name: 'Inactive', isActive: false });

            const modules = await ctx.db.query('modules')
                .collect();

            const active = modules.filter((m: any) => m.isActive);
            expect(active).toHaveLength(1);
            expect(active[0].key).toBe('active-mod');
        });
    });
});
