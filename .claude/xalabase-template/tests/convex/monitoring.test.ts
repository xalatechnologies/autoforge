/**
 * Monitoring Functions Tests
 *
 * Tests for metrics collection and monitoring dashboards.
 * User Stories: US-13.1, US-13.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Monitoring Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let resourceId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Monitoring Test Tenant' });
        resourceId = store.seedResource({ tenantId, name: 'Test Resource' });
    });

    describe('US-13.1: Booking Metrics', () => {
        it('metrics.booking.aggregate - should aggregate booking metrics', async () => {
            const ctx = createMockContext(store);
            const userId = store.seedUser({ tenantId, email: 'user@test.com' });

            store.seedBooking({ tenantId, resourceId, userId, status: 'confirmed', totalPrice: 500 });
            store.seedBooking({ tenantId, resourceId, userId, status: 'confirmed', totalPrice: 300 });
            store.seedBooking({ tenantId, resourceId, userId, status: 'pending', totalPrice: 200 });
            store.seedBooking({ tenantId, resourceId, userId, status: 'cancelled', totalPrice: 100 });

            const bookings = await ctx.db.query('bookings')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const metrics = {
                total: bookings.length,
                byStatus: {
                    confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
                    pending: bookings.filter((b: any) => b.status === 'pending').length,
                    cancelled: bookings.filter((b: any) => b.status === 'cancelled').length,
                },
                totalRevenue: bookings
                    .filter((b: any) => b.status === 'confirmed')
                    .reduce((sum: number, b: any) => sum + b.totalPrice, 0),
            };

            expect(metrics.total).toBe(4);
            expect(metrics.byStatus.confirmed).toBe(2);
            expect(metrics.byStatus.pending).toBe(1);
            expect(metrics.byStatus.cancelled).toBe(1);
            expect(metrics.totalRevenue).toBe(800);
        });

        it('metrics.booking.store - should store booking metrics', async () => {
            const ctx = createMockContext(store);

            const metricsId = await ctx.db.insert('bookingMetrics', {
                tenantId,
                date: Date.now(),
                totalBookings: 10,
                confirmedBookings: 8,
                cancelledBookings: 2,
                revenue: 5000,
                currency: 'NOK',
            });

            expect(metricsId).toBeDefined();

            const metrics = await ctx.db.get(metricsId);
            expect(metrics).toMatchObject({
                totalBookings: 10,
                revenue: 5000,
            });
        });

        it('metrics.booking.list - should list booking metrics', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            await ctx.db.insert('bookingMetrics', { tenantId, date: now, totalBookings: 10, revenue: 5000 });
            await ctx.db.insert('bookingMetrics', { tenantId, date: now - 86400000, totalBookings: 8, revenue: 4000 });

            const metrics = await ctx.db.query('bookingMetrics')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(metrics).toHaveLength(2);
        });
    });

    describe('US-13.2: Availability Metrics', () => {
        it('metrics.availability.store - should store availability metrics', async () => {
            const ctx = createMockContext(store);

            const metricsId = await ctx.db.insert('availabilityMetrics', {
                tenantId,
                resourceId,
                date: Date.now(),
                totalHours: 8,
                availableHours: 6,
                bookedHours: 2,
                utilizationRate: 25,
            });

            expect(metricsId).toBeDefined();

            const metrics = await ctx.db.get(metricsId);
            expect(metrics).toMatchObject({
                totalHours: 8,
                utilizationRate: 25,
            });
        });

        it('metrics.availability.by-resource - should filter by resource', async () => {
            const ctx = createMockContext(store);

            const resource2Id = store.seedResource({ tenantId, name: 'Resource 2' });

            await ctx.db.insert('availabilityMetrics', { tenantId, resourceId, date: Date.now(), totalHours: 8 });
            await ctx.db.insert('availabilityMetrics', { tenantId, resourceId: resource2Id, date: Date.now(), totalHours: 10 });

            const metrics = await ctx.db.query('availabilityMetrics')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            expect(metrics).toHaveLength(1);
            expect(metrics[0].totalHours).toBe(8);
        });
    });

    describe('Report Schedules', () => {
        it('schedule.create.success - should create report schedule', async () => {
            const ctx = createMockContext(store);

            const scheduleId = await ctx.db.insert('scheduledReports', {
                tenantId,
                name: 'Weekly Report',
                type: 'booking_metrics',
                frequency: 'weekly',
                recipients: ['admin@example.com', 'manager@example.com'],
                config: {
                    dayOfWeek: 1,
                    time: '09:00',
                },
                active: true,
                createdAt: Date.now(),
            });

            expect(scheduleId).toBeDefined();

            const schedule = await ctx.db.get(scheduleId);
            expect(schedule).toMatchObject({
                name: 'Weekly Report',
                frequency: 'weekly',
                active: true,
            });
        });

        it('schedule.list.success - should list report schedules', async () => {
            const ctx = createMockContext(store);

            await ctx.db.insert('scheduledReports', { tenantId, name: 'Daily Report', frequency: 'daily', active: true });
            await ctx.db.insert('scheduledReports', { tenantId, name: 'Weekly Report', frequency: 'weekly', active: false });

            const schedules = await ctx.db.query('scheduledReports')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(schedules).toHaveLength(2);
        });

        it('schedule.update.success - should update report schedule', async () => {
            const ctx = createMockContext(store);

            const scheduleId = await ctx.db.insert('scheduledReports', {
                tenantId,
                name: 'Old Name',
                frequency: 'daily',
                active: true,
            });

            await ctx.db.patch(scheduleId, {
                name: 'Updated Name',
                frequency: 'weekly',
                active: false,
            });

            const schedule = await ctx.db.get(scheduleId);
            expect(schedule?.name).toBe('Updated Name');
            expect(schedule?.frequency).toBe('weekly');
            expect(schedule?.active).toBe(false);
        });

        it('schedule.delete.success - should delete report schedule', async () => {
            const ctx = createMockContext(store);

            const scheduleId = await ctx.db.insert('scheduledReports', {
                tenantId,
                name: 'To Delete',
                frequency: 'daily',
                active: false,
            });

            await ctx.db.delete(scheduleId);

            const schedule = await ctx.db.get(scheduleId);
            expect(schedule).toBeNull();
        });
    });

    describe('Dashboard Metrics', () => {
        it('dashboard.summary - should get dashboard summary', async () => {
            const ctx = createMockContext(store);
            const userId = store.seedUser({ tenantId, email: 'user@test.com' });

            // Create some bookings
            store.seedBooking({ tenantId, resourceId, userId, status: 'confirmed', totalPrice: 500 });
            store.seedBooking({ tenantId, resourceId, userId, status: 'pending', totalPrice: 200 });

            // Query for summary
            const bookings = await ctx.db.query('bookings')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const resources = await ctx.db.query('resources')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const users = await ctx.db.query('users')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const summary = {
                bookings: {
                    total: bookings.length,
                    confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
                    revenue: bookings
                        .filter((b: any) => b.status === 'confirmed')
                        .reduce((sum: number, b: any) => sum + b.totalPrice, 0),
                },
                resources: {
                    total: resources.length,
                },
                users: {
                    total: users.length,
                    active: users.filter((u: any) => u.status === 'active').length,
                },
            };

            expect(summary.bookings.total).toBe(2);
            expect(summary.bookings.confirmed).toBe(1);
            expect(summary.bookings.revenue).toBe(500);
            expect(summary.resources.total).toBe(1);
            expect(summary.users.total).toBe(1);
        });

        it('dashboard.resource-utilization - should calculate resource utilization', async () => {
            const ctx = createMockContext(store);
            const userId = store.seedUser({ tenantId, email: 'user@test.com' });
            const now = Date.now();

            // Create bookings for utilization calculation
            store.seedBooking({
                tenantId,
                resourceId,
                userId,
                status: 'confirmed',
                startTime: now,
                endTime: now + 2 * 60 * 60 * 1000, // 2 hours
            });
            store.seedBooking({
                tenantId,
                resourceId,
                userId,
                status: 'confirmed',
                startTime: now + 4 * 60 * 60 * 1000,
                endTime: now + 6 * 60 * 60 * 1000, // 2 hours
            });

            const bookings = await ctx.db.query('bookings')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            const totalBookedHours = bookings.reduce((sum: number, b: any) => {
                const hours = (b.endTime - b.startTime) / (60 * 60 * 1000);
                return sum + hours;
            }, 0);

            expect(totalBookedHours).toBe(4); // 2 + 2 hours
        });
    });

    describe('Metric Queries', () => {
        it('metrics.by-date-range - should filter by date range', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            await ctx.db.insert('bookingMetrics', { tenantId, date: now - 172800000, totalBookings: 5 }); // 2 days ago
            await ctx.db.insert('bookingMetrics', { tenantId, date: now - 86400000, totalBookings: 8 }); // 1 day ago
            await ctx.db.insert('bookingMetrics', { tenantId, date: now, totalBookings: 10 }); // today

            const metrics = await ctx.db.query('bookingMetrics')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            // Filter for last 24 hours
            const last24h = metrics.filter((m: any) => m.date >= now - 86400000);
            expect(last24h).toHaveLength(2);
        });

        it('metrics.active-schedules - should filter active schedules', async () => {
            const ctx = createMockContext(store);

            await ctx.db.insert('scheduledReports', { tenantId, name: 'Active 1', active: true });
            await ctx.db.insert('scheduledReports', { tenantId, name: 'Active 2', active: true });
            await ctx.db.insert('scheduledReports', { tenantId, name: 'Inactive', active: false });

            const schedules = await ctx.db.query('scheduledReports')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const active = schedules.filter((s: any) => s.active);
            expect(active).toHaveLength(2);
        });
    });
});
