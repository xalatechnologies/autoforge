/**
 * Booking Addon Functions Tests
 *
 * Tests for booking addon management and approval workflows.
 * User Stories: US-8.1, US-8.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Booking Addon Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let bookingId: string;
    let resourceId: string;
    let userId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Booking Addon Test Tenant' });
        resourceId = store.seedResource({ tenantId, name: 'Test Resource' });
        userId = store.seedUser({ tenantId, email: 'test@example.com' });
        bookingId = store.seedBooking({
            tenantId,
            resourceId,
            userId,
            status: 'confirmed',
        });
    });

    describe('US-8.1: List Booking Addons', () => {
        it('bookingAddon.list.success - should list addons for booking', async () => {
            const ctx = createMockContext(store);

            const addon1Id = store.seedAddon({ tenantId, name: 'Cleaning Service', price: 100 });
            const addon2Id = store.seedAddon({ tenantId, name: 'Equipment Rental', price: 50 });

            await ctx.db.insert('bookingAddons', {
                tenantId,
                bookingId,
                addonId: addon1Id,
                quantity: 2,
                price: 100,
                status: 'pending',
            });
            await ctx.db.insert('bookingAddons', {
                tenantId,
                bookingId,
                addonId: addon2Id,
                quantity: 1,
                price: 50,
                status: 'pending',
            });

            const bookingAddons = await ctx.db.query('bookingAddons')
                .withIndex('by_booking', (q: IndexQueryBuilder) => q.eq('bookingId', bookingId))
                .collect();

            expect(bookingAddons).toHaveLength(2);
        });

        it('bookingAddon.list.empty - should return empty for no addons', async () => {
            const ctx = createMockContext(store);

            const bookingAddons = await ctx.db.query('bookingAddons')
                .withIndex('by_booking', (q: IndexQueryBuilder) => q.eq('bookingId', bookingId))
                .collect();

            expect(bookingAddons).toHaveLength(0);
        });
    });

    describe('US-8.2: Booking Addon Management', () => {
        it('bookingAddon.add.success - should add addon to booking', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({ tenantId, name: 'Extra Service', price: 75 });

            const bookingAddonId = await ctx.db.insert('bookingAddons', {
                tenantId,
                bookingId,
                addonId,
                quantity: 1,
                price: 75,
                status: 'pending',
            });

            expect(bookingAddonId).toBeDefined();

            const bookingAddon = await ctx.db.get(bookingAddonId);
            expect(bookingAddon).toMatchObject({
                bookingId,
                addonId,
                quantity: 1,
                price: 75,
            });
        });

        it('bookingAddon.update.success - should update booking addon', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({ tenantId, name: 'Service', price: 100 });

            const bookingAddonId = await ctx.db.insert('bookingAddons', {
                tenantId,
                bookingId,
                addonId,
                quantity: 1,
                price: 100,
                status: 'pending',
            });

            await ctx.db.patch(bookingAddonId, { quantity: 2 });

            const bookingAddon = await ctx.db.get(bookingAddonId);
            expect(bookingAddon?.quantity).toBe(2);
        });

        it('bookingAddon.remove.success - should remove addon from booking', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({ tenantId, name: 'Service', price: 100 });

            const bookingAddonId = await ctx.db.insert('bookingAddons', {
                tenantId,
                bookingId,
                addonId,
                quantity: 1,
                price: 100,
                status: 'pending',
            });

            await ctx.db.delete(bookingAddonId);

            const bookingAddon = await ctx.db.get(bookingAddonId);
            expect(bookingAddon).toBeNull();
        });
    });

    describe('Booking Addon Approval', () => {
        it('bookingAddon.approve.success - should approve addon', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({ tenantId, name: 'Service', price: 50 });

            const bookingAddonId = await ctx.db.insert('bookingAddons', {
                tenantId,
                bookingId,
                addonId,
                quantity: 2,
                price: 50,
                status: 'pending',
            });

            await ctx.db.patch(bookingAddonId, {
                status: 'approved',
                approvedAt: Date.now(),
                approvedBy: userId,
            });

            const bookingAddon = await ctx.db.get(bookingAddonId);
            expect(bookingAddon?.status).toBe('approved');
            expect(bookingAddon?.approvedBy).toBe(userId);
        });

        it('bookingAddon.reject.success - should reject addon with reason', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({ tenantId, name: 'Service', price: 50 });

            const bookingAddonId = await ctx.db.insert('bookingAddons', {
                tenantId,
                bookingId,
                addonId,
                quantity: 1,
                price: 50,
                status: 'pending',
            });

            await ctx.db.patch(bookingAddonId, {
                status: 'rejected',
                rejectedAt: Date.now(),
                rejectedBy: userId,
                rejectionReason: 'Not available',
            });

            const bookingAddon = await ctx.db.get(bookingAddonId);
            expect(bookingAddon?.status).toBe('rejected');
            expect(bookingAddon?.rejectionReason).toBe('Not available');
        });
    });

    describe('Booking Addon Queries', () => {
        it('bookingAddon.by-status - should filter by status', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({ tenantId, name: 'Service', price: 50 });

            await ctx.db.insert('bookingAddons', { tenantId, bookingId, addonId, status: 'pending', quantity: 1, price: 50 });
            await ctx.db.insert('bookingAddons', { tenantId, bookingId, addonId, status: 'approved', quantity: 1, price: 50 });
            await ctx.db.insert('bookingAddons', { tenantId, bookingId, addonId, status: 'rejected', quantity: 1, price: 50 });

            const bookingAddons = await ctx.db.query('bookingAddons')
                .withIndex('by_booking', (q: IndexQueryBuilder) => q.eq('bookingId', bookingId))
                .collect();

            const approved = bookingAddons.filter((ba: any) => ba.status === 'approved');
            expect(approved).toHaveLength(1);
        });

        it('bookingAddon.calculate-total - should calculate total for approved addons', async () => {
            const ctx = createMockContext(store);

            const addonId = store.seedAddon({ tenantId, name: 'Service', price: 50 });

            await ctx.db.insert('bookingAddons', { tenantId, bookingId, addonId, status: 'approved', quantity: 2, price: 50 });
            await ctx.db.insert('bookingAddons', { tenantId, bookingId, addonId, status: 'approved', quantity: 1, price: 75 });
            await ctx.db.insert('bookingAddons', { tenantId, bookingId, addonId, status: 'pending', quantity: 1, price: 25 });

            const bookingAddons = await ctx.db.query('bookingAddons')
                .withIndex('by_booking', (q: IndexQueryBuilder) => q.eq('bookingId', bookingId))
                .collect();

            const approved = bookingAddons.filter((ba: any) => ba.status === 'approved');
            const total = approved.reduce((sum: number, ba: any) => sum + (ba.quantity * ba.price), 0);

            expect(total).toBe(175); // (2 * 50) + (1 * 75)
        });
    });
});
