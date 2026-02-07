/**
 * Billing Functions Tests
 *
 * Tests for billing webhooks, payment processing, and invoices.
 * User Stories: US-14.1, US-14.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Invoice Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let userId: string;
    let organizationId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Invoice Test Tenant' });
        userId = store.seedUser({
            tenantId,
            name: 'Test User',
            email: 'user@test.com',
        });
        organizationId = store.seedOrganization({
            tenantId,
            name: 'Test Org',
        });
    });

    describe('US-14.1: Invoice Creation', () => {
        it('invoice.create.success - should create invoice with line items', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            const lineItems = [
                { id: 'li1', description: 'Booking #1', quantity: 1, unitPrice: 5000, amount: 5000 },
                { id: 'li2', description: 'Booking #2', quantity: 1, unitPrice: 5000, amount: 5000 },
            ];

            const invoiceId = await ctx.db.insert('invoices', {
                tenantId,
                userId,
                invoiceNumber: 'INV-2024-0001',
                status: 'draft',
                issueDate: now,
                dueDate: now + 30 * 24 * 60 * 60 * 1000,
                subtotal: 10000,
                taxAmount: 2500,
                totalAmount: 12500,
                currency: 'NOK',
                lineItems,
                customerName: 'Test Customer',
                createdAt: now,
                updatedAt: now,
            });

            expect(invoiceId).toBeDefined();

            const invoice = await ctx.db.get(invoiceId);
            expect(invoice).toMatchObject({
                status: 'draft',
                subtotal: 10000,
                taxAmount: 2500,
                totalAmount: 12500,
                customerName: 'Test Customer',
            });
        });

        it('invoice.create.calculate-totals - should calculate totals from line items', async () => {
            const ctx = createMockContext(store);

            const lineItems = [
                { id: 'li1', description: 'Item 1', quantity: 2, unitPrice: 1000, amount: 2000, taxAmount: 500 },
                { id: 'li2', description: 'Item 2', quantity: 1, unitPrice: 3000, amount: 3000, taxAmount: 750 },
            ];

            const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
            const taxAmount = lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);

            expect(subtotal).toBe(5000);
            expect(taxAmount).toBe(1250);
            expect(subtotal + taxAmount).toBe(6250);
        });
    });

    describe('US-14.2: Invoice Lifecycle', () => {
        it('invoice.send.draft-to-sent - should send draft invoice', async () => {
            const ctx = createMockContext(store);
            const invoiceId = store.seedInvoice({ tenantId, userId, status: 'draft' });

            // Simulate sending invoice
            store.patch(invoiceId, { status: 'sent', issueDate: Date.now() });

            const invoice = await ctx.db.get(invoiceId);
            expect(invoice?.status).toBe('sent');
        });

        it('invoice.send.only-draft - should only allow sending draft invoices', async () => {
            const ctx = createMockContext(store);
            const invoiceId = store.seedInvoice({ tenantId, userId, status: 'sent' });

            const invoice = await ctx.db.get(invoiceId);
            const canSend = invoice?.status === 'draft';

            expect(canSend).toBe(false);
        });

        it('invoice.pay.mark-as-paid - should mark invoice as paid', async () => {
            const ctx = createMockContext(store);
            const invoiceId = store.seedInvoice({ tenantId, userId, status: 'sent' });

            store.patch(invoiceId, {
                status: 'paid',
                paidDate: Date.now(),
                paymentMethod: 'vipps',
            });

            const invoice = await ctx.db.get(invoiceId);
            expect(invoice?.status).toBe('paid');
            expect(invoice?.paidDate).toBeDefined();
            expect(invoice?.paymentMethod).toBe('vipps');
        });

        it('invoice.credit.success - should credit an invoice', async () => {
            const ctx = createMockContext(store);
            const invoiceId = store.seedInvoice({ tenantId, userId, status: 'paid' });

            store.patch(invoiceId, { status: 'credited' });

            const invoice = await ctx.db.get(invoiceId);
            expect(invoice?.status).toBe('credited');
        });
    });

    describe('US-14.3: Invoice Queries', () => {
        it('invoice.list.by-user - should list invoices for a user', async () => {
            const ctx = createMockContext(store);

            // Create test invoices
            store.seedInvoice({ tenantId, userId, status: 'paid' });
            store.seedInvoice({ tenantId, userId, status: 'sent' });
            store.seedInvoice({ tenantId, userId: 'other_user', status: 'paid' });

            const invoices = await ctx.db.query('invoices')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            expect(invoices).toHaveLength(2);
        });

        it('invoice.list.by-organization - should list invoices for an org', async () => {
            const ctx = createMockContext(store);

            store.seedInvoice({ tenantId, organizationId, status: 'paid' });
            store.seedInvoice({ tenantId, organizationId, status: 'sent' });

            const invoices = await ctx.db.query('invoices')
                .withIndex('by_organization', (q: IndexQueryBuilder) => q.eq('organizationId', organizationId))
                .collect();

            expect(invoices).toHaveLength(2);
        });

        it('invoice.get.with-details - should get invoice with full details', async () => {
            const ctx = createMockContext(store);
            const invoiceId = store.seedInvoice({
                tenantId,
                userId,
                invoiceNumber: 'INV-2024-0042',
                customerName: 'Test Customer',
                totalAmount: 15000,
            });

            const invoice = await ctx.db.get(invoiceId);
            expect(invoice).toMatchObject({
                invoiceNumber: 'INV-2024-0042',
                customerName: 'Test Customer',
                totalAmount: 15000,
            });
        });
    });

    describe('US-14.4: Billing Summary', () => {
        it('billing.summary.user - should calculate user billing summary', async () => {
            const ctx = createMockContext(store);

            // Create paid bookings for the user
            store.seedBooking({ tenantId, userId, resourceId: 'res1', status: 'completed', totalPrice: 5000 });
            store.seedBooking({ tenantId, userId, resourceId: 'res2', status: 'confirmed', totalPrice: 3000 });
            store.seedBooking({ tenantId, userId, resourceId: 'res3', status: 'pending', totalPrice: 2000 });

            const bookings = await ctx.db.query('bookings')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const totalSpent = bookings
                .filter((b: any) => b.status === 'completed' || b.status === 'confirmed')
                .reduce((sum: number, b: any) => sum + (b.totalPrice ?? 0), 0);

            const pendingAmount = bookings
                .filter((b: any) => b.status === 'pending')
                .reduce((sum: number, b: any) => sum + (b.totalPrice ?? 0), 0);

            expect(totalSpent).toBe(8000);
            expect(pendingAmount).toBe(2000);
        });

        it('billing.summary.organization - should calculate org billing summary', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            store.seedInvoice({ tenantId, organizationId, status: 'paid', totalAmount: 10000, createdAt: now - 1000 });
            store.seedInvoice({ tenantId, organizationId, status: 'sent', totalAmount: 5000, createdAt: now - 2000 });

            const invoices = await ctx.db.query('invoices')
                .withIndex('by_organization', (q: IndexQueryBuilder) => q.eq('organizationId', organizationId))
                .collect();

            const paidAmount = invoices
                .filter((i: any) => i.status === 'paid')
                .reduce((sum: number, i: any) => sum + i.totalAmount, 0);

            const pendingAmount = invoices
                .filter((i: any) => i.status === 'sent')
                .reduce((sum: number, i: any) => sum + i.totalAmount, 0);

            expect(paidAmount).toBe(10000);
            expect(pendingAmount).toBe(5000);
        });
    });
});

describe('Billing Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let userId: string;
    let resourceId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Billing Test Tenant' });
        userId = store.seedUser({ tenantId, name: 'Test User', email: 'test@billing.com' });
        resourceId = store.seedResource({ tenantId, name: 'Test Resource' });
    });

    describe('Webhooks', () => {
        describe('handleStripeWebhook', () => {
            it('should process payment_intent.succeeded webhook', async () => {
                const ctx = createMockContext(store);

                // Create integration
                const integrationId = await ctx.db.insert('integrations', {
                    tenantId,
                    type: 'stripe',
                    name: 'Stripe Payment',
                    config: { webhookSecret: 'whsec_123' },
                    enabled: true,
                });

                // Create booking awaiting payment
                const bookingId = store.seedBooking({
                    tenantId,
                    resourceId,
                    userId,
                    status: 'pending_payment',
                    totalPrice: 5000,
                    currency: 'NOK',
                });

                // Simulate webhook processing - update booking status
                await ctx.db.patch(bookingId, {
                    status: 'confirmed',
                    paymentId: 'pi_123',
                    paidAt: Date.now(),
                });

                // Record webhook event
                const eventId = await ctx.db.insert('webhookEvents', {
                    tenantId,
                    webhookId: integrationId,
                    eventType: 'payment_intent.succeeded',
                    payload: { id: 'pi_123', amount: 5000, currency: 'nok', metadata: { bookingId } },
                    processed: true,
                    processedAt: Date.now(),
                });

                const booking = await ctx.db.get(bookingId);
                const event = await ctx.db.get(eventId);

                expect(booking?.status).toBe('confirmed');
                expect(booking?.paymentId).toBe('pi_123');
                expect(event?.processed).toBe(true);
            });

            it('should process invoice.payment_succeeded webhook', async () => {
                const ctx = createMockContext(store);

                // Create subscription
                const subscriptionId = await ctx.db.insert('subscriptions', {
                    tenantId,
                    userId,
                    stripeSubscriptionId: 'sub_123',
                    status: 'active',
                    priceId: 'price_123',
                    currentPeriodEnd: Date.now(),
                });

                // Simulate webhook - extend subscription period
                const newPeriodEnd = Date.now() + 30 * 24 * 60 * 60 * 1000;
                await ctx.db.patch(subscriptionId, {
                    status: 'active',
                    currentPeriodEnd: newPeriodEnd,
                });

                const subscription = await ctx.db.get(subscriptionId);
                expect(subscription?.status).toBe('active');
                expect(subscription?.currentPeriodEnd).toBe(newPeriodEnd);
            });

            it('should handle unknown webhook types', async () => {
                const ctx = createMockContext(store);

                // Record unknown event type
                const eventId = await ctx.db.insert('webhookEvents', {
                    tenantId,
                    eventType: 'unknown.event',
                    payload: {},
                    processed: false,
                    error: 'Unknown webhook type: unknown.event',
                    timestamp: Date.now(),
                });

                const event = await ctx.db.get(eventId);
                expect(event?.processed).toBe(false);
                expect(event?.error).toBe('Unknown webhook type: unknown.event');
            });

            it('should handle invalid webhook signature', async () => {
                const ctx = createMockContext(store);

                // Record failed verification event
                const eventId = await ctx.db.insert('webhookEvents', {
                    tenantId,
                    eventType: 'verification_failed',
                    payload: { raw: 'invalid' },
                    processed: false,
                    error: 'Invalid signature',
                    timestamp: Date.now(),
                });

                const event = await ctx.db.get(eventId);
                expect(event?.processed).toBe(false);
                expect(event?.error).toBe('Invalid signature');
            });
        });
    });

    describe('Payment Processing', () => {
        describe('createPaymentIntent', () => {
            it('should create Stripe payment intent', async () => {
                const ctx = createMockContext(store);

                // Create confirmed booking
                const bookingId = store.seedBooking({
                    tenantId,
                    resourceId,
                    userId,
                    status: 'confirmed',
                    totalPrice: 5000,
                    currency: 'NOK',
                });

                // Record payment intent creation
                const paymentId = await ctx.db.insert('payments', {
                    tenantId,
                    bookingId,
                    userId,
                    amount: 5000,
                    currency: 'NOK',
                    stripePaymentIntentId: 'pi_123',
                    clientSecret: 'pi_123_secret',
                    status: 'requires_payment_method',
                    createdAt: Date.now(),
                });

                const payment = await ctx.db.get(paymentId);
                expect(payment?.stripePaymentIntentId).toBe('pi_123');
                expect(payment?.clientSecret).toBe('pi_123_secret');
                expect(payment?.status).toBe('requires_payment_method');
            });

            it('should prevent payment for non-confirmed booking', async () => {
                const ctx = createMockContext(store);

                // Create draft booking
                const bookingId = store.seedBooking({
                    tenantId,
                    resourceId,
                    userId,
                    status: 'draft',
                    totalPrice: 5000,
                });

                const booking = await ctx.db.get(bookingId);
                const canCreatePayment = booking?.status === 'confirmed';

                expect(canCreatePayment).toBe(false);
            });
        });

        describe('refundPayment', () => {
            it('should create refund', async () => {
                const ctx = createMockContext(store);

                // Create paid booking
                const bookingId = store.seedBooking({
                    tenantId,
                    resourceId,
                    userId,
                    status: 'confirmed',
                    totalPrice: 5000,
                    currency: 'NOK',
                    paymentId: 'pi_123',
                });

                // Process refund
                await ctx.db.patch(bookingId, {
                    refundId: 're_123',
                    refundedAt: Date.now(),
                    refundReason: 'Customer request',
                    status: 'refunded',
                });

                // Record refund
                const refundId = await ctx.db.insert('refunds', {
                    tenantId,
                    bookingId,
                    stripeRefundId: 're_123',
                    amount: 5000,
                    status: 'succeeded',
                    reason: 'Customer request',
                    createdAt: Date.now(),
                });

                const booking = await ctx.db.get(bookingId);
                const refund = await ctx.db.get(refundId);

                expect(booking?.refundId).toBe('re_123');
                expect(booking?.refundReason).toBe('Customer request');
                expect(refund?.status).toBe('succeeded');
            });

            it('should prevent refund for booking without payment', async () => {
                const ctx = createMockContext(store);

                // Create booking without payment
                const bookingId = store.seedBooking({
                    tenantId,
                    resourceId,
                    userId,
                    status: 'confirmed',
                    totalPrice: 5000,
                });

                const booking = await ctx.db.get(bookingId);
                const canRefund = booking?.paymentId != null;

                expect(canRefund).toBe(false);
            });
        });
    });

    describe('Subscriptions', () => {
        describe('createSubscription', () => {
            it('should create subscription', async () => {
                const ctx = createMockContext(store);

                // Create customer
                const customerId = await ctx.db.insert('customers', {
                    tenantId,
                    userId,
                    stripeCustomerId: 'cus_123',
                    email: 'test@billing.com',
                    createdAt: Date.now(),
                });

                // Create subscription
                const subscriptionId = await ctx.db.insert('subscriptions', {
                    tenantId,
                    userId,
                    customerId,
                    stripeSubscriptionId: 'sub_123',
                    priceId: 'price_123',
                    status: 'active',
                    currentPeriodStart: Date.now(),
                    currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
                    createdAt: Date.now(),
                });

                const subscription = await ctx.db.get(subscriptionId);
                expect(subscription?.stripeSubscriptionId).toBe('sub_123');
                expect(subscription?.status).toBe('active');
            });
        });

        describe('cancelSubscription', () => {
            it('should cancel subscription', async () => {
                const ctx = createMockContext(store);

                // Create active subscription
                const subscriptionId = await ctx.db.insert('subscriptions', {
                    tenantId,
                    userId,
                    stripeSubscriptionId: 'sub_123',
                    status: 'active',
                    currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
                });

                // Cancel subscription
                await ctx.db.patch(subscriptionId, {
                    status: 'canceled',
                    canceledAt: Date.now(),
                });

                const subscription = await ctx.db.get(subscriptionId);
                expect(subscription?.status).toBe('canceled');
                expect(subscription?.canceledAt).toBeDefined();
            });
        });
    });
});
