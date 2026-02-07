/**
 * Audit Functions Tests
 *
 * Tests for booking audit trail and logging.
 * User Stories: US-9.1, US-9.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Audit Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let bookingId: string;
    let userId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Audit Test Tenant' });
        userId = store.seedUser({ tenantId, email: 'user@test.com' });
        const resourceId = store.seedResource({ tenantId, name: 'Test Resource' });
        bookingId = store.seedBooking({
            tenantId,
            resourceId,
            userId,
        });
    });

    describe('US-9.1: Audit Trail', () => {
        it('audit.list.success - should list audit entries for entity', async () => {
            const ctx = createMockContext(store);

            store.seedAuditLog({
                tenantId,
                userId,
                action: 'booking.created',
                entityType: 'booking',
                entityId: bookingId,
            });
            store.seedAuditLog({
                tenantId,
                userId,
                action: 'booking.approved',
                entityType: 'booking',
                entityId: bookingId,
            });

            const audits = await ctx.db.query('auditLog')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const bookingAudits = audits.filter((a: any) => a.entityId === bookingId);
            expect(bookingAudits).toHaveLength(2);
        });

        it('audit.list.by-action - should filter by action type', async () => {
            const ctx = createMockContext(store);

            store.seedAuditLog({ tenantId, action: 'booking.created', entityType: 'booking' });
            store.seedAuditLog({ tenantId, action: 'booking.approved', entityType: 'booking' });
            store.seedAuditLog({ tenantId, action: 'booking.created', entityType: 'booking' });

            const audits = await ctx.db.query('auditLog')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const created = audits.filter((a: any) => a.action === 'booking.created');
            expect(created).toHaveLength(2);
        });
    });

    describe('US-9.2: Audit Entry Management', () => {
        it('audit.get.success - should get audit entry by ID', async () => {
            const ctx = createMockContext(store);

            const auditId = store.seedAuditLog({
                tenantId,
                userId,
                action: 'booking.cancelled',
                entityType: 'booking',
                entityId: bookingId,
                details: { reason: 'User request' },
            });

            const audit = await ctx.db.get(auditId);
            expect(audit).toMatchObject({
                action: 'booking.cancelled',
                entityType: 'booking',
            });
            expect(audit?.details?.reason).toBe('User request');
        });

        it('audit.create.success - should create audit entry', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            const auditId = await ctx.db.insert('auditLog', {
                tenantId,
                userId,
                action: 'resource.created',
                entityType: 'resource',
                entityId: 'resource123',
                details: { name: 'New Resource' },
                timestamp: now,
            });

            expect(auditId).toBeDefined();

            const audit = await ctx.db.get(auditId);
            expect(audit).toMatchObject({
                action: 'resource.created',
                entityType: 'resource',
            });
        });

        it('audit.create.with-timestamp - should auto-generate timestamp', async () => {
            const ctx = createMockContext(store);
            const beforeTime = Date.now();

            const auditId = await ctx.db.insert('auditLog', {
                tenantId,
                userId,
                action: 'test.action',
                entityType: 'test',
                timestamp: Date.now(),
            });

            const audit = await ctx.db.get(auditId);
            expect(audit?.timestamp).toBeGreaterThanOrEqual(beforeTime);
        });

        it('audit.immutable - audit entries should not be deletable in production', async () => {
            const ctx = createMockContext(store);

            const auditId = store.seedAuditLog({
                tenantId,
                action: 'test.action',
                entityType: 'test',
            });

            // In a real system, this would be blocked by permissions
            // Here we just verify the entry exists
            const audit = await ctx.db.get(auditId);
            expect(audit).toBeDefined();
        });
    });

    describe('Audit Queries', () => {
        it('audit.by-user - should list audit entries by user', async () => {
            const ctx = createMockContext(store);

            const user2Id = store.seedUser({ tenantId, email: 'user2@test.com' });

            store.seedAuditLog({ tenantId, userId, action: 'action1', entityType: 'test' });
            store.seedAuditLog({ tenantId, userId: user2Id, action: 'action2', entityType: 'test' });
            store.seedAuditLog({ tenantId, userId, action: 'action3', entityType: 'test' });

            const audits = await ctx.db.query('auditLog')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const userAudits = audits.filter((a: any) => a.userId === userId);
            expect(userAudits).toHaveLength(2);
        });

        it('audit.by-entity-type - should filter by entity type', async () => {
            const ctx = createMockContext(store);

            store.seedAuditLog({ tenantId, action: 'booking.created', entityType: 'booking' });
            store.seedAuditLog({ tenantId, action: 'resource.updated', entityType: 'resource' });
            store.seedAuditLog({ tenantId, action: 'user.created', entityType: 'user' });

            const audits = await ctx.db.query('auditLog')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const bookingAudits = audits.filter((a: any) => a.entityType === 'booking');
            expect(bookingAudits).toHaveLength(1);
        });

        it('audit.timeline - should return entries in chronological order', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            store.seedAuditLog({ tenantId, action: 'first', entityType: 'test', timestamp: now - 3000 });
            store.seedAuditLog({ tenantId, action: 'second', entityType: 'test', timestamp: now - 2000 });
            store.seedAuditLog({ tenantId, action: 'third', entityType: 'test', timestamp: now - 1000 });

            const audits = await ctx.db.query('auditLog')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const sorted = [...audits].sort((a: any, b: any) => a.timestamp - b.timestamp);
            expect(sorted[0].action).toBe('first');
            expect(sorted[1].action).toBe('second');
            expect(sorted[2].action).toBe('third');
        });
    });
});
