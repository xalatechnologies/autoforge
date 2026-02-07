/**
 * Addon Functions Tests
 *
 * Tests for addons and resource-addon associations.
 * User Stories: US-7.1, US-7.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Addon Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let resourceId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Addon Test Tenant' });
        resourceId = store.seedResource({
            tenantId,
            name: 'Test Resource',
            slug: 'test-resource',
        });
    });

    describe('US-7.1: List Addons', () => {
        it('addon.list.success - should list addons for tenant', async () => {
            const ctx = createMockContext(store);

            store.seedAddon({ tenantId, name: 'Cleaning Service', price: 500 });
            store.seedAddon({ tenantId, name: 'Equipment Rental', price: 200 });

            const addons = await ctx.db.query('addons')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(addons).toHaveLength(2);
        });

        it('addon.list.active-only - should filter active addons', async () => {
            const ctx = createMockContext(store);

            store.seedAddon({ tenantId, name: 'Active', isActive: true });
            store.seedAddon({ tenantId, name: 'Inactive', isActive: false });

            const addons = await ctx.db.query('addons')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const active = addons.filter((a: any) => a.isActive);
            expect(active).toHaveLength(1);
            expect(active[0].name).toBe('Active');
        });
    });

    describe('US-7.2: Addon Management', () => {
        it('addon.get.success - should get addon by ID', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({
                tenantId,
                name: 'Cleaning Service',
                price: 500,
                description: 'Professional cleaning',
            });

            const addon = await ctx.db.get(addonId);
            expect(addon).toMatchObject({
                name: 'Cleaning Service',
                price: 500,
            });
        });

        it('addon.create.success - should create addon', async () => {
            const ctx = createMockContext(store);

            const addonId = await ctx.db.insert('addons', {
                tenantId,
                name: 'New Addon',
                description: 'Test addon',
                price: 300,
                priceType: 'fixed',
                isActive: true,
            });

            expect(addonId).toBeDefined();

            const addon = await ctx.db.get(addonId);
            expect(addon).toMatchObject({
                name: 'New Addon',
                price: 300,
            });
        });

        it('addon.update.success - should update addon', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({
                tenantId,
                name: 'Old Name',
                price: 300,
            });

            await ctx.db.patch(addonId, {
                name: 'New Name',
                price: 350,
            });

            const addon = await ctx.db.get(addonId);
            expect(addon?.name).toBe('New Name');
            expect(addon?.price).toBe(350);
        });

        it('addon.delete.soft - should soft delete addon', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({
                tenantId,
                name: 'To Delete',
                isActive: true,
            });

            await ctx.db.patch(addonId, {
                isActive: false,
                deletedAt: Date.now(),
            });

            const addon = await ctx.db.get(addonId);
            expect(addon?.isActive).toBe(false);
            expect(addon?.deletedAt).toBeDefined();
        });
    });

    describe('Resource Addons', () => {
        it('resource.addon.add - should add addon to resource', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({ tenantId, name: 'Cleaning Service', price: 500 });

            const resourceAddonId = await ctx.db.insert('resourceAddons', {
                tenantId,
                resourceId,
                addonId,
                price: 450, // Override price for this resource
                isActive: true,
            });

            expect(resourceAddonId).toBeDefined();

            const resourceAddon = await ctx.db.get(resourceAddonId);
            expect(resourceAddon).toMatchObject({
                resourceId,
                addonId,
                price: 450,
            });
        });

        it('resource.addon.list - should list addons for resource', async () => {
            const ctx = createMockContext(store);

            const addon1Id = store.seedAddon({ tenantId, name: 'Cleaning Service', price: 500 });
            const addon2Id = store.seedAddon({ tenantId, name: 'Equipment Rental', price: 200 });

            await ctx.db.insert('resourceAddons', {
                tenantId,
                resourceId,
                addonId: addon1Id,
                isActive: true,
            });
            await ctx.db.insert('resourceAddons', {
                tenantId,
                resourceId,
                addonId: addon2Id,
                isActive: true,
            });

            const resourceAddons = await ctx.db.query('resourceAddons')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            expect(resourceAddons).toHaveLength(2);
        });

        it('resource.addon.remove - should remove addon from resource', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({ tenantId, name: 'Cleaning Service', price: 500 });

            const resourceAddonId = await ctx.db.insert('resourceAddons', {
                tenantId,
                resourceId,
                addonId,
                isActive: true,
            });

            await ctx.db.delete(resourceAddonId);

            const resourceAddon = await ctx.db.get(resourceAddonId);
            expect(resourceAddon).toBeNull();
        });

        it('resource.addon.update-price - should update addon price for resource', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({ tenantId, name: 'Cleaning Service', price: 500 });

            const resourceAddonId = await ctx.db.insert('resourceAddons', {
                tenantId,
                resourceId,
                addonId,
                price: 450,
                isActive: true,
            });

            await ctx.db.patch(resourceAddonId, { price: 400 });

            const resourceAddon = await ctx.db.get(resourceAddonId);
            expect(resourceAddon?.price).toBe(400);
        });
    });

    describe('Addon Queries', () => {
        it('addon.by-category - should filter addons by category', async () => {
            const ctx = createMockContext(store);

            store.seedAddon({ tenantId, name: 'Cleaning', category: 'services' });
            store.seedAddon({ tenantId, name: 'Equipment', category: 'equipment' });
            store.seedAddon({ tenantId, name: 'Setup', category: 'services' });

            const addons = await ctx.db.query('addons')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const services = addons.filter((a: any) => a.category === 'services');
            expect(services).toHaveLength(2);
        });

        it('addon.by-price-type - should filter addons by price type', async () => {
            const ctx = createMockContext(store);

            store.seedAddon({ tenantId, name: 'Fixed Price', priceType: 'fixed' });
            store.seedAddon({ tenantId, name: 'Per Hour', priceType: 'per_hour' });
            store.seedAddon({ tenantId, name: 'Per Person', priceType: 'per_person' });

            const addons = await ctx.db.query('addons')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const fixed = addons.filter((a: any) => a.priceType === 'fixed');
            expect(fixed).toHaveLength(1);
        });

        it('addon.sorted-by-price - should sort addons by price', async () => {
            const ctx = createMockContext(store);

            store.seedAddon({ tenantId, name: 'Expensive', price: 1000 });
            store.seedAddon({ tenantId, name: 'Cheap', price: 100 });
            store.seedAddon({ tenantId, name: 'Medium', price: 500 });

            const addons = await ctx.db.query('addons')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const sorted = [...addons].sort((a: any, b: any) => a.price - b.price);
            expect(sorted[0].name).toBe('Cheap');
            expect(sorted[1].name).toBe('Medium');
            expect(sorted[2].name).toBe('Expensive');
        });
    });
});
