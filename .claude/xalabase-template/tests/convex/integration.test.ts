/**
 * Integration Tests
 *
 * End-to-end tests for cross-domain workflows.
 * User Stories: US-INT-001, US-INT-002
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Integration Tests', () => {
    let store: TestDataStore;
    let tenantId: string;
    let userId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Integration Test Tenant' });
        userId = store.seedUser({ tenantId, email: 'test@example.com', name: 'Test User' });
    });

    describe('Booking Lifecycle', () => {
        it('should handle full booking lifecycle', async () => {
            const ctx = createMockContext(store);

            // 1. Create resource with pricing
            const resourceId = store.seedResource({
                tenantId,
                name: 'Meeting Room',
                slug: 'meeting-room',
                status: 'published',
            });

            const pricingGroupId = store.seedPricingGroup({ tenantId, name: 'Standard' });
            store.seedResourcePricing({
                tenantId,
                resourceId,
                pricingGroupId,
                basePrice: 500,
                currency: 'NOK',
            });

            // 2. Check availability - verify no blocks exist
            const now = Date.now();
            const startTime = now + 86400000; // Tomorrow
            const endTime = startTime + 3600000; // 1 hour

            const existingBlocks = await ctx.db.query('blocks')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            const hasConflict = existingBlocks.some((block: any) =>
                block.startTime < endTime && block.endTime > startTime
            );

            expect(hasConflict).toBe(false);

            // 3. Create booking
            const bookingId = await ctx.db.insert('bookings', {
                tenantId,
                resourceId,
                userId,
                startTime,
                endTime,
                status: 'pending',
                totalPrice: 500,
                currency: 'NOK',
                createdAt: Date.now(),
            });

            expect(bookingId).toBeDefined();

            // 4. Approve booking
            await ctx.db.patch(bookingId, {
                status: 'confirmed',
                approvedAt: Date.now(),
                approvedBy: userId,
            });

            const confirmedBooking = await ctx.db.get(bookingId);
            expect(confirmedBooking?.status).toBe('confirmed');

            // 5. Create audit entry
            const auditId = await ctx.db.insert('auditLog', {
                tenantId,
                entityType: 'booking',
                entityId: bookingId,
                action: 'approved',
                userId,
                metadata: { reason: 'Manual approval' },
                timestamp: Date.now(),
            });

            const auditEntry = await ctx.db.get(auditId);
            expect(auditEntry?.action).toBe('approved');
        });

        it('should detect booking conflicts', async () => {
            const ctx = createMockContext(store);

            const resourceId = store.seedResource({ tenantId, name: 'Conference Room' });

            const now = Date.now();
            const startTime = now + 86400000;
            const endTime = startTime + 3600000;

            // Create existing booking
            store.seedBooking({
                tenantId,
                resourceId,
                userId,
                startTime,
                endTime,
                status: 'confirmed',
            });

            // Check for conflicts
            const existingBookings = await ctx.db.query('bookings')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            const conflictingBookings = existingBookings.filter((booking: any) =>
                booking.status !== 'cancelled' &&
                booking.startTime < endTime &&
                booking.endTime > startTime
            );

            expect(conflictingBookings.length).toBeGreaterThan(0);
        });

        it('should calculate booking price with discounts', async () => {
            const ctx = createMockContext(store);

            const resourceId = store.seedResource({ tenantId, name: 'Studio' });
            const pricingGroupId = store.seedPricingGroup({
                tenantId,
                name: 'Member Discount',
                multiplier: 0.9, // 10% discount
            });

            store.seedResourcePricing({
                tenantId,
                resourceId,
                pricingGroupId,
                basePrice: 1000,
            });

            // Calculate price with discount
            const basePrice = 1000;
            const multiplier = 0.9;
            const finalPrice = basePrice * multiplier;

            expect(finalPrice).toBe(900);

            // Create booking with discounted price
            const bookingId = await ctx.db.insert('bookings', {
                tenantId,
                resourceId,
                userId,
                startTime: Date.now() + 86400000,
                endTime: Date.now() + 86400000 + 3600000,
                status: 'pending',
                totalPrice: finalPrice,
                currency: 'NOK',
                pricingGroupId,
            });

            const booking = await ctx.db.get(bookingId);
            expect(booking?.totalPrice).toBe(900);
        });
    });

    describe('Resource Management', () => {
        it('should handle complete resource setup', async () => {
            const ctx = createMockContext(store);

            // 1. Create resource
            const resourceId = await ctx.db.insert('resources', {
                tenantId,
                name: 'Conference Room',
                slug: 'conference-room',
                categoryKey: 'LOKALER',
                capacity: 10,
                features: ['projector', 'whiteboard'],
                status: 'draft',
                createdAt: Date.now(),
            });

            expect(resourceId).toBeDefined();

            // 2. Add amenities
            const amenityGroupId = store.seedAmenityGroup({ tenantId, name: 'Equipment' });
            const amenityId = store.seedAmenity({
                tenantId,
                groupId: amenityGroupId,
                name: 'Projector',
            });

            const resourceAmenityId = await ctx.db.insert('resourceAmenities', {
                tenantId,
                resourceId,
                amenityId,
                quantity: 1,
            });

            expect(resourceAmenityId).toBeDefined();

            // 3. Set pricing
            const pricingGroupId = store.seedPricingGroup({ tenantId, name: 'Standard' });
            const pricingId = await ctx.db.insert('resourcePricing', {
                tenantId,
                resourceId,
                pricingGroupId,
                basePrice: 500,
                pricePerHour: 100,
                currency: 'NOK',
                isActive: true,
            });

            expect(pricingId).toBeDefined();

            // 4. Publish resource
            await ctx.db.patch(resourceId, {
                status: 'published',
                publishedAt: Date.now(),
            });

            const resource = await ctx.db.get(resourceId);
            expect(resource?.status).toBe('published');
            expect(resource?.publishedAt).toBeDefined();
        });

        it('should manage resource availability blocks', async () => {
            const ctx = createMockContext(store);

            const resourceId = store.seedResource({ tenantId, name: 'Meeting Room' });
            const now = Date.now();

            // Create maintenance block
            const blockId = await ctx.db.insert('blocks', {
                tenantId,
                resourceId,
                type: 'maintenance',
                reason: 'Scheduled maintenance',
                startTime: now + 7 * 24 * 60 * 60 * 1000, // 1 week from now
                endTime: now + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000, // 4 hours
                createdBy: userId,
                createdAt: now,
            });

            const block = await ctx.db.get(blockId);
            expect(block?.type).toBe('maintenance');
            expect(block?.reason).toBe('Scheduled maintenance');
        });

        it('should handle resource categories and search', async () => {
            const ctx = createMockContext(store);

            // Create resources in different categories
            const room1 = store.seedResource({
                tenantId,
                name: 'Small Meeting Room',
                categoryKey: 'LOKALER',
                capacity: 4,
                status: 'published',
            });
            const room2 = store.seedResource({
                tenantId,
                name: 'Large Conference Room',
                categoryKey: 'LOKALER',
                capacity: 20,
                status: 'published',
            });
            const equipment = store.seedResource({
                tenantId,
                name: 'Projector',
                categoryKey: 'UTSTYR',
                status: 'published',
            });

            // Query resources by category
            const rooms = await ctx.db.query('resources')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const lokalerResources = rooms.filter((r: any) => r.categoryKey === 'LOKALER');
            const utstyrResources = rooms.filter((r: any) => r.categoryKey === 'UTSTYR');

            expect(lokalerResources).toHaveLength(2);
            expect(utstyrResources).toHaveLength(1);
        });
    });

    describe('User Management', () => {
        it('should handle user onboarding flow', async () => {
            const ctx = createMockContext(store);

            // 1. Create organization
            const organizationId = await ctx.db.insert('organizations', {
                tenantId,
                name: 'Test Company',
                slug: 'test-company',
                status: 'active',
                createdAt: Date.now(),
            });

            expect(organizationId).toBeDefined();

            // 2. Create role
            const roleId = await ctx.db.insert('roles', {
                tenantId,
                name: 'Resource Manager',
                permissions: ['resource:read', 'resource:write', 'booking:read', 'booking:write'],
                isDefault: false,
                isSystem: false,
            });

            expect(roleId).toBeDefined();

            // 3. Create new user
            const newUserId = await ctx.db.insert('users', {
                tenantId,
                email: 'manager@test.com',
                name: 'Test Manager',
                organizationId,
                status: 'active',
                createdAt: Date.now(),
            });

            expect(newUserId).toBeDefined();

            // 4. Assign role
            const userRoleId = await ctx.db.insert('userRoles', {
                tenantId,
                userId: newUserId,
                roleId,
                assignedAt: Date.now(),
            });

            expect(userRoleId).toBeDefined();

            // Verify assignment
            const userRoles = await ctx.db.query('userRoles')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', newUserId))
                .collect();

            expect(userRoles).toHaveLength(1);
            expect(userRoles[0].roleId).toBe(roleId);
        });

        it('should handle user permissions aggregation', async () => {
            const ctx = createMockContext(store);

            // Create multiple roles
            const role1 = store.seedRole({
                tenantId,
                name: 'Resource Viewer',
                permissions: ['resource:read'],
            });
            const role2 = store.seedRole({
                tenantId,
                name: 'Booking Manager',
                permissions: ['booking:read', 'booking:write'],
            });

            // Assign both roles to user
            await ctx.db.insert('userRoles', { tenantId, userId, roleId: role1, assignedAt: Date.now() });
            await ctx.db.insert('userRoles', { tenantId, userId, roleId: role2, assignedAt: Date.now() });

            // Aggregate permissions
            const userRoles = await ctx.db.query('userRoles')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const allPermissions: Set<string> = new Set();
            for (const ur of userRoles) {
                const role = await ctx.db.get(ur.roleId);
                if (role?.permissions) {
                    (role.permissions as string[]).forEach((p: string) => allPermissions.add(p));
                }
            }

            expect(allPermissions.has('resource:read')).toBe(true);
            expect(allPermissions.has('booking:read')).toBe(true);
            expect(allPermissions.has('booking:write')).toBe(true);
            expect(allPermissions.size).toBe(3);
        });

        it('should handle organization hierarchy', async () => {
            const ctx = createMockContext(store);

            // Create parent organization
            const parentOrgId = await ctx.db.insert('organizations', {
                tenantId,
                name: 'Parent Company',
                slug: 'parent-company',
                status: 'active',
                createdAt: Date.now(),
            });

            // Create child organization
            const childOrgId = await ctx.db.insert('organizations', {
                tenantId,
                name: 'Child Division',
                slug: 'child-division',
                parentId: parentOrgId,
                status: 'active',
                createdAt: Date.now(),
            });

            const childOrg = await ctx.db.get(childOrgId);
            expect(childOrg?.parentId).toBe(parentOrgId);

            // Query children
            const children = await ctx.db.query('organizations')
                .withIndex('by_parent', (q: IndexQueryBuilder) => q.eq('parentId', parentOrgId))
                .collect();

            expect(children).toHaveLength(1);
            expect(children[0].name).toBe('Child Division');
        });
    });

    describe('Billing Integration', () => {
        it('should create invoice from bookings', async () => {
            const ctx = createMockContext(store);

            const resourceId = store.seedResource({ tenantId, name: 'Room A' });

            // Create completed bookings
            const booking1 = store.seedBooking({
                tenantId,
                resourceId,
                userId,
                status: 'completed',
                totalPrice: 500,
            });
            const booking2 = store.seedBooking({
                tenantId,
                resourceId,
                userId,
                status: 'completed',
                totalPrice: 750,
            });

            // Create invoice from bookings
            const lineItems = [
                { id: 'li1', bookingId: booking1, description: 'Room A - Booking 1', amount: 500 },
                { id: 'li2', bookingId: booking2, description: 'Room A - Booking 2', amount: 750 },
            ];

            const invoiceId = await ctx.db.insert('invoices', {
                tenantId,
                userId,
                invoiceNumber: 'INV-2024-0001',
                status: 'draft',
                lineItems,
                subtotal: 1250,
                taxAmount: 312.5,
                totalAmount: 1562.5,
                currency: 'NOK',
                createdAt: Date.now(),
            });

            const invoice = await ctx.db.get(invoiceId);
            expect(invoice?.totalAmount).toBe(1562.5);
            expect(invoice?.lineItems).toHaveLength(2);
        });
    });

    describe('Notification Flow', () => {
        it('should create notifications for booking events', async () => {
            const ctx = createMockContext(store);

            const resourceId = store.seedResource({ tenantId, name: 'Test Resource' });

            // Create booking
            const bookingId = store.seedBooking({
                tenantId,
                resourceId,
                userId,
                status: 'confirmed',
            });

            // Create notification for booking confirmation
            const notificationId = await ctx.db.insert('notifications', {
                tenantId,
                userId,
                type: 'booking_confirmed',
                title: 'Booking Confirmed',
                message: 'Your booking has been confirmed.',
                entityType: 'booking',
                entityId: bookingId,
                read: false,
                createdAt: Date.now(),
            });

            const notification = await ctx.db.get(notificationId);
            expect(notification?.type).toBe('booking_confirmed');
            expect(notification?.read).toBe(false);
        });

        it('should aggregate unread notifications', async () => {
            const ctx = createMockContext(store);

            // Create multiple notifications
            await ctx.db.insert('notifications', {
                tenantId,
                userId,
                type: 'booking_confirmed',
                title: 'Booking 1',
                read: false,
                createdAt: Date.now(),
            });
            await ctx.db.insert('notifications', {
                tenantId,
                userId,
                type: 'booking_reminder',
                title: 'Reminder',
                read: false,
                createdAt: Date.now(),
            });
            await ctx.db.insert('notifications', {
                tenantId,
                userId,
                type: 'system',
                title: 'System Notice',
                read: true, // Already read
                createdAt: Date.now(),
            });

            const notifications = await ctx.db.query('notifications')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const unreadCount = notifications.filter((n: any) => !n.read).length;
            expect(unreadCount).toBe(2);
        });
    });
});
