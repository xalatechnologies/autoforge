/**
 * Block Functions Tests
 *
 * Tests for resource block management and availability checking.
 * User Stories: US-4.1, US-4.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Block Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let resourceId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Block Test Tenant' });
        resourceId = store.seedResource({
            tenantId,
            name: 'Test Resource',
            slug: 'test-resource',
        });
    });

    describe('US-4.1: List Blocks', () => {
        it('block.list.success - should list blocks for resource', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            store.seedBlock({
                tenantId,
                resourceId,
                startDate: now,
                endDate: now + 3600000,
                reason: 'Maintenance',
            });
            store.seedBlock({
                tenantId,
                resourceId,
                startDate: now + 7200000,
                endDate: now + 10800000,
                reason: 'Reserved',
            });

            const blocks = await ctx.db.query('blocks')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            expect(blocks).toHaveLength(2);
        });

        it('block.list.empty - should return empty for no blocks', async () => {
            const ctx = createMockContext(store);

            const blocks = await ctx.db.query('blocks')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            expect(blocks).toHaveLength(0);
        });
    });

    describe('US-4.2: Block Management', () => {
        it('block.get.success - should get block by ID', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            const blockId = store.seedBlock({
                tenantId,
                resourceId,
                startDate: now,
                endDate: now + 3600000,
                reason: 'Maintenance',
            });

            const block = await ctx.db.get(blockId);
            expect(block).toMatchObject({
                resourceId,
                reason: 'Maintenance',
            });
        });

        it('block.create.success - should create block', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            const blockId = await ctx.db.insert('blocks', {
                tenantId,
                resourceId,
                startDate: now,
                endDate: now + 3600000,
                reason: 'Maintenance',
                status: 'active',
                allDay: false,
                metadata: {},
            });

            expect(blockId).toBeDefined();

            const block = await ctx.db.get(blockId);
            expect(block).toMatchObject({
                resourceId,
                reason: 'Maintenance',
            });
        });

        it('block.update.success - should update block', async () => {
            const ctx = createMockContext(store);

            const blockId = store.seedBlock({
                tenantId,
                resourceId,
                reason: 'Old reason',
            });

            await ctx.db.patch(blockId, {
                reason: 'Updated reason',
            });

            const block = await ctx.db.get(blockId);
            expect(block?.reason).toBe('Updated reason');
        });

        it('block.delete.success - should delete block', async () => {
            const ctx = createMockContext(store);

            const blockId = store.seedBlock({
                tenantId,
                resourceId,
            });

            await ctx.db.delete(blockId);

            const block = await ctx.db.get(blockId);
            expect(block).toBeNull();
        });
    });

    describe('Availability Checking', () => {
        it('block.availability.no-conflicts - should be available when no overlapping blocks', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            // Block in the past
            store.seedBlock({
                tenantId,
                resourceId,
                startDate: now - 7200000,
                endDate: now - 3600000,
            });

            const blocks = await ctx.db.query('blocks')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            // Check if any block overlaps with requested time
            const requestedStart = now;
            const requestedEnd = now + 3600000;

            const conflicts = blocks.filter((b: any) => {
                return b.startDate < requestedEnd && b.endDate > requestedStart;
            });

            expect(conflicts).toHaveLength(0);
        });

        it('block.availability.with-conflicts - should detect overlapping blocks', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            // Overlapping block
            store.seedBlock({
                tenantId,
                resourceId,
                startDate: now + 1800000,
                endDate: now + 5400000,
                reason: 'Maintenance',
            });

            const blocks = await ctx.db.query('blocks')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            // Check overlap with requested time
            const requestedStart = now;
            const requestedEnd = now + 3600000;

            const conflicts = blocks.filter((b: any) => {
                return b.startDate < requestedEnd && b.endDate > requestedStart;
            });

            expect(conflicts).toHaveLength(1);
            expect(conflicts[0].reason).toBe('Maintenance');
        });

        it('block.all-day - should handle all-day blocks', async () => {
            const ctx = createMockContext(store);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dayStart = today.getTime();
            const dayEnd = dayStart + 24 * 60 * 60 * 1000;

            store.seedBlock({
                tenantId,
                resourceId,
                startDate: dayStart,
                endDate: dayEnd,
                allDay: true,
                reason: 'Closed',
            });

            const blocks = await ctx.db.query('blocks')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            const allDayBlocks = blocks.filter((b: any) => b.allDay);
            expect(allDayBlocks).toHaveLength(1);
        });
    });

    describe('Block Queries', () => {
        it('block.by-date-range - should filter blocks by date range', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            store.seedBlock({ tenantId, resourceId, startDate: now - 86400000, endDate: now - 82800000 });
            store.seedBlock({ tenantId, resourceId, startDate: now, endDate: now + 3600000 });
            store.seedBlock({ tenantId, resourceId, startDate: now + 86400000, endDate: now + 90000000 });

            const blocks = await ctx.db.query('blocks')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            // Filter to only today's blocks
            const todayBlocks = blocks.filter((b: any) => {
                return b.startDate >= now - 3600000 && b.startDate <= now + 3600000;
            });

            expect(todayBlocks).toHaveLength(1);
        });

        it('block.active-only - should filter active blocks', async () => {
            const ctx = createMockContext(store);

            store.seedBlock({ tenantId, resourceId, status: 'active' });
            store.seedBlock({ tenantId, resourceId, status: 'cancelled' });

            const blocks = await ctx.db.query('blocks')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            const active = blocks.filter((b: any) => b.status === 'active');
            expect(active).toHaveLength(1);
        });
    });
});
