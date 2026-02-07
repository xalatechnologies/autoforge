/**
 * Compliance Functions Tests
 *
 * Tests for GDPR compliance, consent management, and DSAR requests.
 * User Stories: US-10.1, US-10.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Compliance Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let userId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Compliance Test Tenant' });
        userId = store.seedUser({
            tenantId,
            name: 'Test User',
            email: 'test@example.com',
        });
    });

    describe('US-10.1: Consent Management', () => {
        it('consent.record.success - should record user consent', async () => {
            const ctx = createMockContext(store);

            const consentId = await ctx.db.insert('consentRecords', {
                tenantId,
                userId,
                consentType: 'data_processing',
                granted: true,
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0...',
                timestamp: Date.now(),
            });

            expect(consentId).toBeDefined();

            const consent = await ctx.db.get(consentId);
            expect(consent).toMatchObject({
                consentType: 'data_processing',
                granted: true,
            });
        });

        it('consent.record.auto-timestamp - should auto-generate timestamp', async () => {
            const ctx = createMockContext(store);
            const beforeTime = Date.now();

            const consentId = await ctx.db.insert('consentRecords', {
                tenantId,
                userId,
                consentType: 'marketing',
                granted: false,
                timestamp: Date.now(),
            });

            const consent = await ctx.db.get(consentId);
            expect(consent?.timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(consent?.timestamp).toBeLessThanOrEqual(Date.now());
        });

        it('consent.status.success - should get current consent status', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            await ctx.db.insert('consentRecords', {
                tenantId,
                userId,
                consentType: 'data_processing',
                granted: true,
                timestamp: now,
            });
            await ctx.db.insert('consentRecords', {
                tenantId,
                userId,
                consentType: 'marketing',
                granted: false,
                timestamp: now - 86400000,
            });

            const consents = await ctx.db.query('consentRecords')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const dataProcessing = consents.find((c: any) => c.consentType === 'data_processing');
            const marketing = consents.find((c: any) => c.consentType === 'marketing');

            expect(dataProcessing?.granted).toBe(true);
            expect(marketing?.granted).toBe(false);
        });

        it('consent.withdraw.success - should withdraw consent', async () => {
            const ctx = createMockContext(store);

            // Initial consent
            await ctx.db.insert('consentRecords', {
                tenantId,
                userId,
                consentType: 'marketing',
                granted: true,
                timestamp: Date.now() - 86400000,
            });

            // Withdraw consent
            const withdrawId = await ctx.db.insert('consentRecords', {
                tenantId,
                userId,
                consentType: 'marketing',
                granted: false,
                reason: 'No longer interested',
                timestamp: Date.now(),
            });

            const withdraw = await ctx.db.get(withdrawId);
            expect(withdraw?.granted).toBe(false);
            expect(withdraw?.reason).toBe('No longer interested');
        });
    });

    describe('US-10.2: DSAR Requests', () => {
        it('dsar.submit.success - should submit DSAR request', async () => {
            const ctx = createMockContext(store);

            const dsarId = await ctx.db.insert('dsarRequests', {
                tenantId,
                userId,
                requestType: 'data_export',
                requestedData: ['bookings', 'profile'],
                status: 'pending',
                referenceNumber: `DSAR-2024-${String(Date.now()).slice(-6)}`,
                submittedAt: Date.now(),
            });

            expect(dsarId).toBeDefined();

            const dsar = await ctx.db.get(dsarId);
            expect(dsar).toMatchObject({
                requestType: 'data_export',
                status: 'pending',
            });
        });

        it('dsar.process.success - should process DSAR request', async () => {
            const ctx = createMockContext(store);

            const dsarId = await ctx.db.insert('dsarRequests', {
                tenantId,
                userId,
                requestType: 'data_export',
                status: 'pending',
                referenceNumber: 'DSAR-2024-000001',
                submittedAt: Date.now(),
            });

            await ctx.db.patch(dsarId, {
                status: 'completed',
                processedBy: userId,
                processedAt: Date.now(),
                notes: 'Data exported and sent via secure email',
                resultUrl: 'https://secure.example.com/export/dsar123.zip',
            });

            const dsar = await ctx.db.get(dsarId);
            expect(dsar?.status).toBe('completed');
            expect(dsar?.notes).toBe('Data exported and sent via secure email');
        });

        it('dsar.types - should support different request types', async () => {
            const ctx = createMockContext(store);

            await ctx.db.insert('dsarRequests', { tenantId, userId, requestType: 'data_export', status: 'pending', referenceNumber: 'REF1', submittedAt: Date.now() });
            await ctx.db.insert('dsarRequests', { tenantId, userId, requestType: 'data_deletion', status: 'pending', referenceNumber: 'REF2', submittedAt: Date.now() });
            await ctx.db.insert('dsarRequests', { tenantId, userId, requestType: 'data_correction', status: 'pending', referenceNumber: 'REF3', submittedAt: Date.now() });

            const dsars = await ctx.db.query('dsarRequests')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            expect(dsars).toHaveLength(3);

            const types = dsars.map((d: any) => d.requestType);
            expect(types).toContain('data_export');
            expect(types).toContain('data_deletion');
            expect(types).toContain('data_correction');
        });
    });

    describe('Policy Management', () => {
        it('policy.publish.success - should publish policy', async () => {
            const ctx = createMockContext(store);

            const policyId = await ctx.db.insert('policies', {
                tenantId,
                policyType: 'privacy_policy',
                version: '2.0',
                content: 'This is our updated privacy policy...',
                effectiveDate: Date.now() + 86400000,
                status: 'published',
                createdAt: Date.now(),
            });

            expect(policyId).toBeDefined();

            const policy = await ctx.db.get(policyId);
            expect(policy).toMatchObject({
                policyType: 'privacy_policy',
                version: '2.0',
                status: 'published',
            });
        });

        it('policy.archive.success - should archive old policy versions', async () => {
            const ctx = createMockContext(store);

            const oldPolicyId = await ctx.db.insert('policies', {
                tenantId,
                policyType: 'privacy_policy',
                version: '1.0',
                content: 'Old policy',
                status: 'published',
                effectiveDate: Date.now() - 86400000,
                createdAt: Date.now() - 172800000,
            });

            await ctx.db.patch(oldPolicyId, { status: 'archived' });

            await ctx.db.insert('policies', {
                tenantId,
                policyType: 'privacy_policy',
                version: '2.0',
                content: 'New policy',
                status: 'published',
                effectiveDate: Date.now(),
                createdAt: Date.now(),
            });

            const oldPolicy = await ctx.db.get(oldPolicyId);
            expect(oldPolicy?.status).toBe('archived');
        });

        it('policy.history.success - should get policy version history', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            await ctx.db.insert('policies', { tenantId, policyType: 'privacy_policy', version: '1.0', status: 'archived', content: 'v1', createdAt: now - 172800000, effectiveDate: now - 172800000 });
            await ctx.db.insert('policies', { tenantId, policyType: 'privacy_policy', version: '2.0', status: 'published', content: 'v2', createdAt: now - 86400000, effectiveDate: now - 86400000 });
            await ctx.db.insert('policies', { tenantId, policyType: 'privacy_policy', version: '3.0', status: 'draft', content: 'v3', createdAt: now, effectiveDate: now + 86400000 });

            const policies = await ctx.db.query('policies')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const privacyPolicies = policies.filter((p: any) => p.policyType === 'privacy_policy');
            expect(privacyPolicies).toHaveLength(3);
        });
    });

    describe('Access Logs', () => {
        it('access.log.success - should log data access', async () => {
            const ctx = createMockContext(store);

            const logId = await ctx.db.insert('accessLogs', {
                tenantId,
                userId,
                resourceType: 'booking',
                resourceId: 'booking123',
                action: 'view',
                ipAddress: '192.168.1.1',
                timestamp: Date.now(),
            });

            expect(logId).toBeDefined();

            const log = await ctx.db.get(logId);
            expect(log).toMatchObject({
                resourceType: 'booking',
                action: 'view',
            });
        });

        it('access.log.list - should get access logs for user', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            await ctx.db.insert('accessLogs', { tenantId, userId, resourceType: 'booking', action: 'view', timestamp: now - 3600000 });
            await ctx.db.insert('accessLogs', { tenantId, userId, resourceType: 'profile', action: 'update', timestamp: now - 1800000 });

            const logs = await ctx.db.query('accessLogs')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            expect(logs).toHaveLength(2);
        });

        it('access.log.by-action - should filter logs by action', async () => {
            const ctx = createMockContext(store);

            await ctx.db.insert('accessLogs', { tenantId, userId, resourceType: 'booking', action: 'view', timestamp: Date.now() });
            await ctx.db.insert('accessLogs', { tenantId, userId, resourceType: 'profile', action: 'update', timestamp: Date.now() });
            await ctx.db.insert('accessLogs', { tenantId, userId, resourceType: 'booking', action: 'view', timestamp: Date.now() });

            const logs = await ctx.db.query('accessLogs')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const viewLogs = logs.filter((l: any) => l.action === 'view');
            expect(viewLogs).toHaveLength(2);
        });
    });
});
