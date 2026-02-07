/**
 * Notification Functions Tests
 *
 * Tests for notification management.
 * User Stories: US-11.1, US-11.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Notification Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let userId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Notification Test Tenant' });
        userId = store.seedUser({
            tenantId,
            name: 'Test User',
            email: 'test@example.com',
        });
    });

    describe('US-11.1: List Notifications', () => {
        it('notification.list.success - should list notifications for user', async () => {
            const ctx = createMockContext(store);

            // Create test notifications
            store.seedNotification({
                tenantId,
                userId,
                type: 'booking_confirmed',
                title: 'Booking Confirmed',
                body: 'Your booking has been confirmed',
                status: 'unread',
            });
            store.seedNotification({
                tenantId,
                userId,
                type: 'booking_reminder',
                title: 'Booking Reminder',
                body: 'Your booking is tomorrow',
                status: 'read',
                readAt: Date.now() - 3600000,
            });

            const notifications = await ctx.db.query('notifications')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            expect(notifications).toHaveLength(2);
        });

        it('notification.list.filter-unread - should filter by unread status', async () => {
            const ctx = createMockContext(store);

            store.seedNotification({
                tenantId,
                userId,
                status: 'unread',
            });
            store.seedNotification({
                tenantId,
                userId,
                status: 'read',
                readAt: Date.now(),
            });

            const notifications = await ctx.db.query('notifications')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const unread = notifications.filter((n: any) => n.status === 'unread');
            expect(unread).toHaveLength(1);
        });
    });

    describe('US-11.2: Notification Management', () => {
        it('notification.count.unread - should return unread notification count', async () => {
            const ctx = createMockContext(store);

            store.seedNotification({ tenantId, userId, status: 'unread' });
            store.seedNotification({ tenantId, userId, status: 'unread' });
            store.seedNotification({ tenantId, userId, status: 'read', readAt: Date.now() });

            const notifications = await ctx.db.query('notifications')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const unreadCount = notifications.filter((n: any) => n.status === 'unread').length;
            expect(unreadCount).toBe(2);
        });

        it('notification.count.zero - should return 0 when no notifications', async () => {
            const ctx = createMockContext(store);

            const notifications = await ctx.db.query('notifications')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            expect(notifications.length).toBe(0);
        });

        it('notification.create.success - should create notification', async () => {
            const ctx = createMockContext(store);

            const notificationId = await ctx.db.insert('notifications', {
                tenantId,
                userId,
                type: 'booking_confirmed',
                title: 'Booking Confirmed',
                body: 'Your booking has been confirmed',
                channel: 'in_app',
                status: 'unread',
                metadata: { bookingId: 'booking123' },
                createdAt: Date.now(),
            });

            expect(notificationId).toBeDefined();

            const notification = await ctx.db.get(notificationId);
            expect(notification).toMatchObject({
                type: 'booking_confirmed',
                title: 'Booking Confirmed',
                status: 'unread',
            });
        });

        it('notification.read.mark - should mark notification as read', async () => {
            const ctx = createMockContext(store);

            const notificationId = store.seedNotification({
                tenantId,
                userId,
                status: 'unread',
            });

            await ctx.db.patch(notificationId, {
                status: 'read',
                readAt: Date.now(),
            });

            const notification = await ctx.db.get(notificationId);
            expect(notification?.status).toBe('read');
            expect(notification?.readAt).toBeDefined();
        });

        it('notification.read.all - should mark all notifications as read', async () => {
            const ctx = createMockContext(store);

            const id1 = store.seedNotification({ tenantId, userId, status: 'unread' });
            const id2 = store.seedNotification({ tenantId, userId, status: 'unread' });

            // Mark all as read
            const now = Date.now();
            await ctx.db.patch(id1, { status: 'read', readAt: now });
            await ctx.db.patch(id2, { status: 'read', readAt: now });

            const notifications = await ctx.db.query('notifications')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const allRead = notifications.every((n: any) => n.status === 'read');
            expect(allRead).toBe(true);
        });

        it('notification.delete.success - should delete notification', async () => {
            const ctx = createMockContext(store);

            const notificationId = store.seedNotification({
                tenantId,
                userId,
            });

            await ctx.db.delete(notificationId);

            const notification = await ctx.db.get(notificationId);
            expect(notification).toBeNull();
        });

        it('notification.delete.read - should delete all read notifications', async () => {
            const ctx = createMockContext(store);

            const readId1 = store.seedNotification({ tenantId, userId, status: 'read', readAt: Date.now() });
            const readId2 = store.seedNotification({ tenantId, userId, status: 'read', readAt: Date.now() });
            store.seedNotification({ tenantId, userId, status: 'unread' });

            // Delete read notifications
            await ctx.db.delete(readId1);
            await ctx.db.delete(readId2);

            const notifications = await ctx.db.query('notifications')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            expect(notifications).toHaveLength(1);
            const typedN = notifications[0] as { status: string };
            expect(typedN.status).toBe('unread');
        });
    });

    describe('Notification Types', () => {
        it('notification.booking.confirmed - should create booking confirmed notification', async () => {
            const ctx = createMockContext(store);

            const resourceId = store.seedResource({
                tenantId,
                name: 'Meeting Room A',
            });

            const bookingId = store.seedBooking({
                tenantId,
                resourceId,
                userId,
                status: 'confirmed',
            });

            const notificationId = await ctx.db.insert('notifications', {
                tenantId,
                userId,
                type: 'booking_confirmed',
                title: 'Booking Confirmed',
                body: 'Your booking for Meeting Room A has been confirmed',
                channel: 'in_app',
                status: 'unread',
                metadata: { bookingId, resourceId },
                createdAt: Date.now(),
            });

            const notification = await ctx.db.get(notificationId);
            expect(notification?.type).toBe('booking_confirmed');
            expect(notification?.metadata?.bookingId).toBe(bookingId);
        });

        it('notification.booking.cancelled - should create booking cancelled notification', async () => {
            const ctx = createMockContext(store);

            const bookingId = store.seedBooking({
                tenantId,
                userId,
                status: 'cancelled',
            });

            const notificationId = await ctx.db.insert('notifications', {
                tenantId,
                userId,
                type: 'booking_cancelled',
                title: 'Booking Cancelled',
                body: 'Your booking has been cancelled',
                channel: 'in_app',
                status: 'unread',
                metadata: { bookingId },
                createdAt: Date.now(),
            });

            const notification = await ctx.db.get(notificationId);
            expect(notification?.type).toBe('booking_cancelled');
        });

        it('notification.booking.reminder - should create booking reminder notification', async () => {
            const ctx = createMockContext(store);

            const tomorrow = Date.now() + 86400000;
            const bookingId = store.seedBooking({
                tenantId,
                userId,
                startTime: tomorrow,
                status: 'confirmed',
            });

            const notificationId = await ctx.db.insert('notifications', {
                tenantId,
                userId,
                type: 'booking_reminder',
                title: 'Upcoming Booking',
                body: 'You have a booking tomorrow',
                channel: 'in_app',
                status: 'unread',
                metadata: { bookingId },
                createdAt: Date.now(),
            });

            const notification = await ctx.db.get(notificationId);
            expect(notification?.type).toBe('booking_reminder');
        });
    });
});
