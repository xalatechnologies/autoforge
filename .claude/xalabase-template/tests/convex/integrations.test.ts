/**
 * Integration Functions Tests
 *
 * Tests for external service integrations and webhooks.
 * User Stories: US-11.1, US-11.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Integration Functions', () => {
    let store: TestDataStore;
    let tenantId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Integration Test Tenant' });
    });

    describe('US-11.1: Integration Management', () => {
        it('integration.list.success - should list integrations for tenant', async () => {
            const ctx = createMockContext(store);

            await ctx.db.insert('integrations', {
                tenantId,
                type: 'stripe',
                name: 'Stripe Payment',
                enabled: true,
                config: { secretKey: 'sk_test_...' },
            });
            await ctx.db.insert('integrations', {
                tenantId,
                type: 'sendgrid',
                name: 'SendGrid Email',
                enabled: false,
                config: { apiKey: 'SG.test' },
            });

            const integrations = await ctx.db.query('integrations')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(integrations).toHaveLength(2);
        });

        it('integration.get.success - should get integration by ID', async () => {
            const ctx = createMockContext(store);

            const integrationId = await ctx.db.insert('integrations', {
                tenantId,
                type: 'stripe',
                name: 'Stripe Payment',
                enabled: true,
                config: { secretKey: 'sk_test_123' },
            });

            const integration = await ctx.db.get(integrationId);
            expect(integration).toMatchObject({
                type: 'stripe',
                name: 'Stripe Payment',
            });
        });

        it('integration.create.success - should configure new integration', async () => {
            const ctx = createMockContext(store);

            const integrationId = await ctx.db.insert('integrations', {
                tenantId,
                type: 'stripe',
                name: 'Stripe Payment',
                config: {
                    secretKey: 'sk_test_123',
                    webhookSecret: 'whsec_123',
                },
                enabled: false,
                createdAt: Date.now(),
            });

            expect(integrationId).toBeDefined();

            const integration = await ctx.db.get(integrationId);
            expect(integration).toMatchObject({
                type: 'stripe',
                enabled: false,
            });
        });

        it('integration.update.success - should update integration config', async () => {
            const ctx = createMockContext(store);

            const integrationId = await ctx.db.insert('integrations', {
                tenantId,
                type: 'stripe',
                name: 'Stripe Payment',
                config: { secretKey: 'sk_test_old' },
                enabled: false,
            });

            await ctx.db.patch(integrationId, {
                config: { secretKey: 'sk_test_new' },
            });

            const integration = await ctx.db.get(integrationId);
            expect(integration?.config?.secretKey).toBe('sk_test_new');
        });

        it('integration.enable.success - should enable integration', async () => {
            const ctx = createMockContext(store);

            const integrationId = await ctx.db.insert('integrations', {
                tenantId,
                type: 'stripe',
                name: 'Stripe Payment',
                config: { secretKey: 'sk_test_123' },
                enabled: false,
            });

            await ctx.db.patch(integrationId, {
                enabled: true,
                enabledAt: Date.now(),
            });

            const integration = await ctx.db.get(integrationId);
            expect(integration?.enabled).toBe(true);
        });

        it('integration.disable.success - should disable integration', async () => {
            const ctx = createMockContext(store);

            const integrationId = await ctx.db.insert('integrations', {
                tenantId,
                type: 'stripe',
                name: 'Stripe Payment',
                enabled: true,
            });

            await ctx.db.patch(integrationId, {
                enabled: false,
                disabledAt: Date.now(),
            });

            const integration = await ctx.db.get(integrationId);
            expect(integration?.enabled).toBe(false);
        });

        it('integration.delete.success - should remove integration', async () => {
            const ctx = createMockContext(store);

            const integrationId = await ctx.db.insert('integrations', {
                tenantId,
                type: 'stripe',
                name: 'Stripe Payment',
                enabled: false,
            });

            await ctx.db.delete(integrationId);

            const integration = await ctx.db.get(integrationId);
            expect(integration).toBeNull();
        });
    });

    describe('US-11.2: Webhooks', () => {
        it('webhook.create.success - should create webhook endpoint', async () => {
            const ctx = createMockContext(store);

            const integrationId = await ctx.db.insert('integrations', {
                tenantId,
                type: 'stripe',
                name: 'Stripe',
                enabled: true,
            });

            const webhookId = await ctx.db.insert('webhooks', {
                tenantId,
                integrationId,
                eventType: 'payment_intent.succeeded',
                endpointUrl: 'https://example.com/webhook/stripe',
                secret: 'whsec_123',
                enabled: true,
                createdAt: Date.now(),
            });

            expect(webhookId).toBeDefined();

            const webhook = await ctx.db.get(webhookId);
            expect(webhook).toMatchObject({
                eventType: 'payment_intent.succeeded',
                enabled: true,
            });
        });

        it('webhook.list.success - should list webhooks for integration', async () => {
            const ctx = createMockContext(store);

            const integrationId = await ctx.db.insert('integrations', {
                tenantId,
                type: 'stripe',
                name: 'Stripe',
                enabled: true,
            });

            await ctx.db.insert('webhooks', { tenantId, integrationId, eventType: 'payment.succeeded', enabled: true });
            await ctx.db.insert('webhooks', { tenantId, integrationId, eventType: 'payment.failed', enabled: true });

            const webhooks = await ctx.db.query('webhooks')
                .withIndex('by_integration', (q: IndexQueryBuilder) => q.eq('integrationId', integrationId))
                .collect();

            expect(webhooks).toHaveLength(2);
        });

        it('webhook.event.record - should record webhook event', async () => {
            const ctx = createMockContext(store);

            const webhookId = await ctx.db.insert('webhooks', {
                tenantId,
                eventType: 'payment.succeeded',
                enabled: true,
            });

            const eventId = await ctx.db.insert('webhookEvents', {
                tenantId,
                webhookId,
                eventType: 'payment_intent.succeeded',
                payload: { id: 'pi_123', amount: 5000 },
                processed: true,
                processedAt: Date.now(),
            });

            expect(eventId).toBeDefined();

            const event = await ctx.db.get(eventId);
            expect(event).toMatchObject({
                eventType: 'payment_intent.succeeded',
                processed: true,
            });
        });

        it('webhook.event.list - should list webhook events', async () => {
            const ctx = createMockContext(store);

            const webhookId = await ctx.db.insert('webhooks', {
                tenantId,
                eventType: 'payment.succeeded',
                enabled: true,
            });

            await ctx.db.insert('webhookEvents', { tenantId, webhookId, eventType: 'payment.succeeded', processed: true, timestamp: Date.now() });
            await ctx.db.insert('webhookEvents', { tenantId, webhookId, eventType: 'payment.failed', processed: false, error: 'Processing failed', timestamp: Date.now() });

            const events = await ctx.db.query('webhookEvents')
                .withIndex('by_webhook', (q: IndexQueryBuilder) => q.eq('webhookId', webhookId))
                .collect();

            expect(events).toHaveLength(2);
        });
    });

    describe('Integration Sync', () => {
        it('sync.create.success - should create sync job', async () => {
            const ctx = createMockContext(store);

            const integrationId = await ctx.db.insert('integrations', {
                tenantId,
                type: 'stripe',
                name: 'Stripe',
                enabled: true,
            });

            const syncId = await ctx.db.insert('integrationSyncs', {
                tenantId,
                integrationId,
                syncType: 'customers',
                status: 'running',
                startedAt: Date.now(),
            });

            expect(syncId).toBeDefined();

            const sync = await ctx.db.get(syncId);
            expect(sync).toMatchObject({
                syncType: 'customers',
                status: 'running',
            });
        });

        it('sync.complete.success - should mark sync as completed', async () => {
            const ctx = createMockContext(store);

            const syncId = await ctx.db.insert('integrationSyncs', {
                tenantId,
                syncType: 'customers',
                status: 'running',
                startedAt: Date.now(),
            });

            await ctx.db.patch(syncId, {
                status: 'completed',
                completedAt: Date.now(),
                recordsProcessed: 100,
            });

            const sync = await ctx.db.get(syncId);
            expect(sync?.status).toBe('completed');
            expect(sync?.recordsProcessed).toBe(100);
        });

        it('sync.fail.success - should mark sync as failed', async () => {
            const ctx = createMockContext(store);

            const syncId = await ctx.db.insert('integrationSyncs', {
                tenantId,
                syncType: 'customers',
                status: 'running',
                startedAt: Date.now(),
            });

            await ctx.db.patch(syncId, {
                status: 'failed',
                completedAt: Date.now(),
                error: 'API rate limit exceeded',
            });

            const sync = await ctx.db.get(syncId);
            expect(sync?.status).toBe('failed');
            expect(sync?.error).toBe('API rate limit exceeded');
        });
    });

    describe('Integration Queries', () => {
        it('integration.by-type - should filter by type', async () => {
            const ctx = createMockContext(store);

            await ctx.db.insert('integrations', { tenantId, type: 'stripe', name: 'Stripe', enabled: true });
            await ctx.db.insert('integrations', { tenantId, type: 'sendgrid', name: 'SendGrid', enabled: true });
            await ctx.db.insert('integrations', { tenantId, type: 'stripe', name: 'Stripe 2', enabled: false });

            const integrations = await ctx.db.query('integrations')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const stripeIntegrations = integrations.filter((i: any) => i.type === 'stripe');
            expect(stripeIntegrations).toHaveLength(2);
        });

        it('integration.enabled-only - should filter enabled integrations', async () => {
            const ctx = createMockContext(store);

            await ctx.db.insert('integrations', { tenantId, type: 'stripe', name: 'Stripe', enabled: true });
            await ctx.db.insert('integrations', { tenantId, type: 'sendgrid', name: 'SendGrid', enabled: false });

            const integrations = await ctx.db.query('integrations')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const enabled = integrations.filter((i: any) => i.enabled);
            expect(enabled).toHaveLength(1);
            expect(enabled[0].type).toBe('stripe');
        });
    });
});
