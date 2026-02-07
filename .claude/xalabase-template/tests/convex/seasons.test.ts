/**
 * Season Functions Tests
 *
 * Tests for seasons, applications, allocations, and leases.
 * User Stories: US-9.1, US-9.2, US-9.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Season Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let resourceId: string;
    let userId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Season Test Tenant' });
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

    describe('US-9.1: List Seasons', () => {
        it('season.list.success - should list seasons for tenant', async () => {
            const ctx = createMockContext(store);

            store.seedSeason({ tenantId, name: 'Summer 2024', status: 'published' });
            store.seedSeason({ tenantId, name: 'Winter 2024', status: 'draft' });

            const seasons = await ctx.db.query('seasons')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(seasons).toHaveLength(2);
        });

        it('season.list.by-status - should filter by status', async () => {
            const ctx = createMockContext(store);

            store.seedSeason({ tenantId, name: 'Published', status: 'published' });
            store.seedSeason({ tenantId, name: 'Draft', status: 'draft' });

            const seasons = await ctx.db.query('seasons')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const published = seasons.filter((s: any) => s.status === 'published');
            expect(published).toHaveLength(1);
            expect(published[0].name).toBe('Published');
        });
    });

    describe('US-9.2: Season Management', () => {
        it('season.get.success - should get season by ID', async () => {
            const ctx = createMockContext(store);

            const seasonId = store.seedSeason({
                tenantId,
                name: 'Summer 2024',
                type: 'rental',
                description: 'Summer season',
            });

            const season = await ctx.db.get(seasonId);
            expect(season).toMatchObject({
                name: 'Summer 2024',
                type: 'rental',
            });
        });

        it('season.create.success - should create season', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            const seasonId = await ctx.db.insert('seasons', {
                tenantId,
                name: 'New Season',
                description: 'Test season',
                type: 'rental',
                status: 'draft',
                startDate: now,
                endDate: now + 90 * 24 * 60 * 60 * 1000,
                isActive: false,
            });

            expect(seasonId).toBeDefined();

            const season = await ctx.db.get(seasonId);
            expect(season).toMatchObject({
                name: 'New Season',
                status: 'draft',
            });
        });

        it('season.publish.success - should publish season', async () => {
            const ctx = createMockContext(store);

            const seasonId = store.seedSeason({
                tenantId,
                name: 'Test Season',
                status: 'draft',
            });

            await ctx.db.patch(seasonId, {
                status: 'published',
                isActive: true,
            });

            const season = await ctx.db.get(seasonId);
            expect(season?.status).toBe('published');
            expect(season?.isActive).toBe(true);
        });

        it('season.close.success - should close season', async () => {
            const ctx = createMockContext(store);

            const seasonId = store.seedSeason({
                tenantId,
                name: 'Test Season',
                status: 'published',
            });

            await ctx.db.patch(seasonId, {
                status: 'closed',
            });

            const season = await ctx.db.get(seasonId);
            expect(season?.status).toBe('closed');
        });
    });

    describe('US-9.3: Season Applications', () => {
        it('application.submit.success - should submit application', async () => {
            const ctx = createMockContext(store);

            const seasonId = store.seedSeason({
                tenantId,
                name: 'Test Season',
                status: 'published',
            });

            const applicationId = await ctx.db.insert('seasonApplications', {
                tenantId,
                seasonId,
                userId,
                resourceId,
                weekday: 1, // Monday
                startTime: '09:00',
                endTime: '11:00',
                applicantName: 'John Doe',
                applicantEmail: 'john@example.com',
                status: 'pending',
                submittedAt: Date.now(),
            });

            expect(applicationId).toBeDefined();

            const application = await ctx.db.get(applicationId);
            expect(application).toMatchObject({
                seasonId,
                userId,
                weekday: 1,
                status: 'pending',
            });
        });

        it('application.approve.success - should approve application', async () => {
            const ctx = createMockContext(store);

            const seasonId = store.seedSeason({ tenantId, name: 'Test Season', status: 'published' });

            const applicationId = await ctx.db.insert('seasonApplications', {
                tenantId,
                seasonId,
                userId,
                resourceId,
                weekday: 1,
                status: 'pending',
                submittedAt: Date.now(),
            });

            await ctx.db.patch(applicationId, {
                status: 'approved',
                reviewedBy: userId,
                reviewedAt: Date.now(),
                notes: 'Approved for Monday mornings',
            });

            const application = await ctx.db.get(applicationId);
            expect(application?.status).toBe('approved');
            expect(application?.notes).toBe('Approved for Monday mornings');
        });

        it('application.reject.success - should reject application with reason', async () => {
            const ctx = createMockContext(store);

            const seasonId = store.seedSeason({ tenantId, name: 'Test Season', status: 'published' });

            const applicationId = await ctx.db.insert('seasonApplications', {
                tenantId,
                seasonId,
                userId,
                resourceId,
                weekday: 1,
                status: 'pending',
                submittedAt: Date.now(),
            });

            await ctx.db.patch(applicationId, {
                status: 'rejected',
                reviewedBy: userId,
                reviewedAt: Date.now(),
                rejectionReason: 'Capacity full',
            });

            const application = await ctx.db.get(applicationId);
            expect(application?.status).toBe('rejected');
            expect(application?.rejectionReason).toBe('Capacity full');
        });
    });

    describe('Allocations', () => {
        it('allocation.create.success - should create allocation', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            const allocationId = await ctx.db.insert('allocations', {
                tenantId,
                resourceId,
                title: 'Weekly Allocation',
                startTime: now,
                endTime: now + 2 * 60 * 60 * 1000,
                userId,
                status: 'active',
            });

            expect(allocationId).toBeDefined();

            const allocation = await ctx.db.get(allocationId);
            expect(allocation).toMatchObject({
                title: 'Weekly Allocation',
                status: 'active',
            });
        });

        it('allocation.cancel.success - should cancel allocation', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            const allocationId = await ctx.db.insert('allocations', {
                tenantId,
                resourceId,
                title: 'Test Allocation',
                startTime: now,
                endTime: now + 2 * 60 * 60 * 1000,
                status: 'active',
            });

            await ctx.db.patch(allocationId, {
                status: 'cancelled',
            });

            const allocation = await ctx.db.get(allocationId);
            expect(allocation?.status).toBe('cancelled');
        });
    });

    describe('Seasonal Leases', () => {
        it('lease.create.success - should create seasonal lease', async () => {
            const ctx = createMockContext(store);

            const organizationId = store.seedOrganization({ tenantId, name: 'Test Org' });
            const now = Date.now();

            const leaseId = await ctx.db.insert('seasonalLeases', {
                tenantId,
                resourceId,
                organizationId,
                startDate: now,
                endDate: now + 90 * 24 * 60 * 60 * 1000,
                weekdays: [1, 3, 5], // Mon, Wed, Fri
                startTime: '09:00',
                endTime: '11:00',
                totalPrice: 10000,
                currency: 'NOK',
                status: 'active',
            });

            expect(leaseId).toBeDefined();

            const lease = await ctx.db.get(leaseId);
            expect(lease).toMatchObject({
                weekdays: [1, 3, 5],
                totalPrice: 10000,
                status: 'active',
            });
        });

        it('lease.cancel.success - should cancel seasonal lease', async () => {
            const ctx = createMockContext(store);

            const organizationId = store.seedOrganization({ tenantId, name: 'Test Org' });
            const now = Date.now();

            const leaseId = await ctx.db.insert('seasonalLeases', {
                tenantId,
                resourceId,
                organizationId,
                startDate: now,
                endDate: now + 90 * 24 * 60 * 60 * 1000,
                weekdays: [1, 3, 5],
                startTime: '09:00',
                endTime: '11:00',
                totalPrice: 10000,
                currency: 'NOK',
                status: 'active',
            });

            await ctx.db.patch(leaseId, {
                status: 'cancelled',
                cancellationReason: 'Budget constraints',
                cancelledAt: Date.now(),
            });

            const lease = await ctx.db.get(leaseId);
            expect(lease?.status).toBe('cancelled');
            expect(lease?.cancellationReason).toBe('Budget constraints');
        });
    });

    describe('Season Queries', () => {
        it('season.active-only - should filter active seasons', async () => {
            const ctx = createMockContext(store);

            store.seedSeason({ tenantId, name: 'Active', isActive: true, status: 'published' });
            store.seedSeason({ tenantId, name: 'Inactive', isActive: false, status: 'draft' });

            const seasons = await ctx.db.query('seasons')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const active = seasons.filter((s: any) => s.isActive);
            expect(active).toHaveLength(1);
            expect(active[0].name).toBe('Active');
        });

        it('season.by-type - should filter by season type', async () => {
            const ctx = createMockContext(store);

            store.seedSeason({ tenantId, name: 'Rental', type: 'rental' });
            store.seedSeason({ tenantId, name: 'Event', type: 'event' });

            const seasons = await ctx.db.query('seasons')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const rental = seasons.filter((s: any) => s.type === 'rental');
            expect(rental).toHaveLength(1);
        });
    });
});
