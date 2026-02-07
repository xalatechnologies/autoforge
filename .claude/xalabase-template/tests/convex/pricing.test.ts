/**
 * Pricing Functions Tests
 *
 * Tests for pricing groups, resource pricing, and price calculation.
 * User Stories: US-8.1, US-8.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Pricing Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let resourceId: string;
    let userId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Pricing Test Tenant' });
        resourceId = store.seedResource({
            tenantId,
            name: 'Test Resource',
            slug: 'test-resource',
        });
        userId = store.seedUser({
            tenantId,
            name: 'Test User',
            email: 'test@example.com',
        });
    });

    describe('US-8.1: Pricing Groups', () => {
        it('group.list.success - should list pricing groups for tenant', async () => {
            const ctx = createMockContext(store);

            store.seedPricingGroup({ tenantId, name: 'Standard' });
            store.seedPricingGroup({ tenantId, name: 'Premium' });

            const groups = await ctx.db.query('pricingGroups')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(groups).toHaveLength(2);
        });

        it('group.get.success - should get pricing group by ID', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedPricingGroup({
                tenantId,
                name: 'Standard',
                code: 'STD',
                multiplier: 1.0,
            });

            const group = await ctx.db.get(groupId);
            expect(group).toMatchObject({
                name: 'Standard',
                code: 'STD',
                multiplier: 1.0,
            });
        });

        it('group.create.success - should create pricing group', async () => {
            const ctx = createMockContext(store);

            const groupId = await ctx.db.insert('pricingGroups', {
                tenantId,
                name: 'New Group',
                code: 'NEW',
                description: 'Test pricing group',
                multiplier: 1.0,
                isActive: true,
                isDefault: false,
                priority: 0,
            });

            expect(groupId).toBeDefined();

            const group = await ctx.db.get(groupId);
            expect(group).toMatchObject({
                name: 'New Group',
                code: 'NEW',
            });
        });

        it('group.update.success - should update pricing group', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedPricingGroup({
                tenantId,
                name: 'Old Name',
            });

            await ctx.db.patch(groupId, {
                name: 'New Name',
                multiplier: 1.5,
            });

            const group = await ctx.db.get(groupId);
            expect(group?.name).toBe('New Name');
            expect(group?.multiplier).toBe(1.5);
        });

        it('group.delete.success - should delete pricing group', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedPricingGroup({
                tenantId,
                name: 'To Delete',
            });

            await ctx.db.delete(groupId);

            const group = await ctx.db.get(groupId);
            expect(group).toBeNull();
        });
    });

    describe('US-8.2: Resource Pricing', () => {
        it('pricing.list.success - should list pricing for resource', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedPricingGroup({ tenantId, name: 'Standard' });

            store.seedResourcePricing({
                tenantId,
                resourceId,
                pricingGroupId: groupId,
                basePrice: 500,
            });

            const pricing = await ctx.db.query('resourcePricing')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            expect(pricing).toHaveLength(1);
            expect(pricing[0].basePrice).toBe(500);
        });

        it('pricing.create.success - should create resource pricing', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedPricingGroup({ tenantId, name: 'Standard' });

            const pricingId = await ctx.db.insert('resourcePricing', {
                tenantId,
                resourceId,
                pricingGroupId: groupId,
                basePrice: 600,
                pricePerHour: 100,
                currency: 'NOK',
                isActive: true,
            });

            expect(pricingId).toBeDefined();

            const pricing = await ctx.db.get(pricingId);
            expect(pricing).toMatchObject({
                basePrice: 600,
                pricePerHour: 100,
            });
        });

        it('pricing.update.success - should update pricing', async () => {
            const ctx = createMockContext(store);

            const pricingId = store.seedResourcePricing({
                tenantId,
                resourceId,
                basePrice: 500,
            });

            await ctx.db.patch(pricingId, {
                basePrice: 550,
            });

            const pricing = await ctx.db.get(pricingId);
            expect(pricing?.basePrice).toBe(550);
        });

        it('pricing.delete.success - should delete pricing', async () => {
            const ctx = createMockContext(store);

            const pricingId = store.seedResourcePricing({
                tenantId,
                resourceId,
                basePrice: 500,
            });

            await ctx.db.delete(pricingId);

            const pricing = await ctx.db.get(pricingId);
            expect(pricing).toBeNull();
        });
    });

    describe('User Pricing Groups', () => {
        it('user.pricing.assign - should assign user to pricing group', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedPricingGroup({
                tenantId,
                name: 'Discount Group',
                multiplier: 0.9,
            });

            const userPricingId = await ctx.db.insert('userPricingGroups', {
                tenantId,
                userId,
                pricingGroupId: groupId,
                discountPercent: 10,
                isActive: true,
            });

            expect(userPricingId).toBeDefined();

            const userPricing = await ctx.db.get(userPricingId);
            expect(userPricing?.discountPercent).toBe(10);
        });

        it('user.pricing.list - should list user pricing groups', async () => {
            const ctx = createMockContext(store);

            const group1 = store.seedPricingGroup({ tenantId, name: 'Group 1' });
            const group2 = store.seedPricingGroup({ tenantId, name: 'Group 2' });

            await ctx.db.insert('userPricingGroups', { tenantId, userId, pricingGroupId: group1, isActive: true });
            await ctx.db.insert('userPricingGroups', { tenantId, userId, pricingGroupId: group2, isActive: true });

            const userPricingGroups = await ctx.db.query('userPricingGroups')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            expect(userPricingGroups).toHaveLength(2);
        });

        it('user.pricing.remove - should remove user from pricing group', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedPricingGroup({ tenantId, name: 'Group' });

            const userPricingId = await ctx.db.insert('userPricingGroups', {
                tenantId,
                userId,
                pricingGroupId: groupId,
                isActive: true,
            });

            await ctx.db.delete(userPricingId);

            const userPricing = await ctx.db.get(userPricingId);
            expect(userPricing).toBeNull();
        });
    });

    describe('Pricing Queries', () => {
        it('pricing.active-only - should filter active pricing', async () => {
            const ctx = createMockContext(store);

            store.seedResourcePricing({ tenantId, resourceId, basePrice: 500, isActive: true });
            store.seedResourcePricing({ tenantId, resourceId, basePrice: 400, isActive: false });

            const pricing = await ctx.db.query('resourcePricing')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            const active = pricing.filter((p: any) => p.isActive);
            expect(active).toHaveLength(1);
            expect(active[0].basePrice).toBe(500);
        });

        it('pricing.by-group - should filter pricing by group', async () => {
            const ctx = createMockContext(store);

            const standardGroup = store.seedPricingGroup({ tenantId, name: 'Standard' });
            const premiumGroup = store.seedPricingGroup({ tenantId, name: 'Premium' });

            store.seedResourcePricing({ tenantId, resourceId, pricingGroupId: standardGroup, basePrice: 500 });
            store.seedResourcePricing({ tenantId, resourceId, pricingGroupId: premiumGroup, basePrice: 750 });

            const pricing = await ctx.db.query('resourcePricing')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            const standard = pricing.filter((p: any) => p.pricingGroupId === standardGroup);
            expect(standard).toHaveLength(1);
            expect(standard[0].basePrice).toBe(500);
        });

        it('pricing.default-group - should find default pricing group', async () => {
            const ctx = createMockContext(store);

            store.seedPricingGroup({ tenantId, name: 'Standard', isDefault: true });
            store.seedPricingGroup({ tenantId, name: 'Premium', isDefault: false });

            const groups = await ctx.db.query('pricingGroups')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const defaultGroup = groups.find((g: any) => g.isDefault);
            expect(defaultGroup).toBeDefined();
            expect(defaultGroup.name).toBe('Standard');
        });
    });
});
