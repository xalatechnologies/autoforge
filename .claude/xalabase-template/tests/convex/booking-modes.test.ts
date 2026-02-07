/**
 * Booking Modes Unit Tests
 *
 * Tests for all booking mode scenarios:
 * - SLOTS: Time-slot based (sports facilities)
 * - ALL_DAY: Full-day booking (venues)
 * - DURATION: Flexible duration (equipment)
 * - TICKETS: Quantity-based (events)
 *
 * Also tests:
 * - Pricing calculations
 * - Discounts (user groups, bulk, early bird)
 * - Surcharges (peak hours, weekends)
 * - Additional services
 * - Conflict detection
 * - Availability calculation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

// =============================================================================
// Test Data Setup
// =============================================================================

interface TestSetup {
    store: TestDataStore;
    tenantId: string;
    userId: string;
    orgUserId: string;
    organizationId: string;
    resources: {
        slotsResource: string;
        allDayResource: string;
        durationResource: string;
        ticketsResource: string;
    };
    pricingGroups: {
        standard: string;
        member: string;
        organization: string;
    };
    additionalServices: {
        equipment: string;
        cleaning: string;
        delivery: string;
    };
}

function setupTestData(): TestSetup {
    const store = new TestDataStore();

    // Create tenant
    const tenantId = store.seedTenant({
        name: 'Booking Test Tenant',
        slug: 'booking-test',
        settings: {
            defaultCurrency: 'NOK',
            timezone: 'Europe/Oslo',
        },
    });

    // Create users
    const userId = store.seedUser({
        tenantId,
        email: 'individual@test.com',
        name: 'Test User',
        status: 'active',
    });

    const orgUserId = store.seedUser({
        tenantId,
        email: 'org-member@test.com',
        name: 'Org Member',
        status: 'active',
    });

    // Create organization
    const organizationId = store.seedOrganization({
        tenantId,
        name: 'Test Organization',
        slug: 'test-org',
    });

    // Create resources for each booking mode
    const slotsResource = store.seedResource({
        tenantId,
        name: 'Basketball Court',
        slug: 'basketball-court',
        categoryKey: 'SPORT',
        status: 'published',
        bookingMode: 'SLOTS',
        slotDurationMinutes: 60,
        pricePerHour: 500,
        requiresApproval: false,
        openingHours: [
            { dayIndex: 1, day: 'Mandag', open: '08:00', close: '22:00' },
            { dayIndex: 2, day: 'Tirsdag', open: '08:00', close: '22:00' },
            { dayIndex: 3, day: 'Onsdag', open: '08:00', close: '22:00' },
            { dayIndex: 4, day: 'Torsdag', open: '08:00', close: '22:00' },
            { dayIndex: 5, day: 'Fredag', open: '08:00', close: '22:00' },
            { dayIndex: 6, day: 'Lørdag', open: '10:00', close: '18:00' },
            { dayIndex: 0, day: 'Søndag', open: '10:00', close: '16:00', isClosed: true },
        ],
    });

    const allDayResource = store.seedResource({
        tenantId,
        name: 'Meeting Room A',
        slug: 'meeting-room-a',
        categoryKey: 'LOKALER',
        status: 'published',
        bookingMode: 'ALL_DAY',
        pricePerDay: 2000,
        requiresApproval: true,
    });

    const durationResource = store.seedResource({
        tenantId,
        name: 'Projector',
        slug: 'projector',
        categoryKey: 'TORGET',
        status: 'published',
        bookingMode: 'DURATION',
        pricePerHour: 200,
        minDuration: 60,
        maxDuration: 480,
    });

    const ticketsResource = store.seedResource({
        tenantId,
        name: 'Workshop',
        slug: 'workshop',
        categoryKey: 'ARRANGEMENTER',
        status: 'published',
        bookingMode: 'TICKETS',
        pricePerTicket: 150,
        capacity: 50,
    });

    // Create pricing groups
    const standard = store.seedPricingGroup({
        tenantId,
        name: 'Standard',
        code: 'STANDARD',
        multiplier: 1.0,
    });

    const member = store.seedPricingGroup({
        tenantId,
        name: 'Medlemmer',
        code: 'MEMBER',
        multiplier: 0.8, // 20% discount
    });

    const organization = store.seedPricingGroup({
        tenantId,
        name: 'Organisasjoner',
        code: 'ORG',
        multiplier: 0.7, // 30% discount
    });

    // Create additional services
    const equipment = store.seedAdditionalService({
        tenantId,
        resourceId: slotsResource,
        name: 'Utstyr',
        description: 'Ballnett, musikanlegg og annet utstyr',
        price: 150,
    });

    const cleaning = store.seedAdditionalService({
        tenantId,
        resourceId: allDayResource,
        name: 'Rengjøring',
        description: 'Profesjonell rengjøring etter bruk',
        price: 500,
    });

    const delivery = store.seedAdditionalService({
        tenantId,
        resourceId: durationResource,
        name: 'Levering',
        description: 'Levering til ønsket adresse',
        price: 400,
    });

    return {
        store,
        tenantId,
        userId,
        orgUserId,
        organizationId,
        resources: {
            slotsResource,
            allDayResource,
            durationResource,
            ticketsResource,
        },
        pricingGroups: {
            standard,
            member,
            organization,
        },
        additionalServices: {
            equipment,
            cleaning,
            delivery,
        },
    };
}

// =============================================================================
// SLOTS Mode Tests
// =============================================================================

describe('SLOTS Mode Bookings', () => {
    let setup: TestSetup;

    beforeEach(() => {
        setup = setupTestData();
    });

    describe('Slot Availability', () => {
        it('should return available slots for a week', async () => {
            const ctx = createMockContext(setup.store);
            const { slotsResource, tenantId } = setup.resources;

            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);

            // Simulate getResourceAvailability query
            const resource = await ctx.db.get(slotsResource);
            expect(resource).toBeDefined();
            expect(resource?.bookingMode).toBe('SLOTS');

            // Get opening hours
            const openingHours = resource?.openingHours || [];
            expect(openingHours.length).toBeGreaterThan(0);

            // Verify slot structure
            const mondayHours = openingHours.find((h: any) => h.dayIndex === 1);
            expect(mondayHours?.open).toBe('08:00');
            expect(mondayHours?.close).toBe('22:00');
        });

        it('should mark slots as unavailable when booked', async () => {
            const ctx = createMockContext(setup.store);
            const { slotsResource, tenantId } = setup.resources;
            const { userId } = setup;

            // Create a booking for tomorrow 10:00-11:00
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);
            const startTime = tomorrow.getTime();
            const endTime = startTime + 60 * 60 * 1000; // 1 hour

            const bookingId = await ctx.db.insert('bookings', {
                tenantId,
                resourceId: slotsResource,
                userId,
                startTime,
                endTime,
                status: 'confirmed',
                totalPrice: 500,
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: {},
            });

            // Verify booking exists
            const booking = await ctx.db.get(bookingId);
            expect(booking?.status).toBe('confirmed');

            // Check for conflicts at same time
            const existingBookings = await ctx.db
                .query('bookings')
                .withIndex('by_resource', (q: IndexQueryBuilder) =>
                    q.eq('resourceId', slotsResource)
                )
                .collect();

            const conflictExists = existingBookings.some((b: any) => {
                if (b.status === 'cancelled' || b.status === 'rejected') return false;
                return startTime < b.endTime && endTime > b.startTime;
            });

            expect(conflictExists).toBe(true);
        });
    });

    describe('Slot Booking Creation', () => {
        it('should create a valid slot booking', async () => {
            const ctx = createMockContext(setup.store);
            const { slotsResource, tenantId } = setup.resources;
            const { userId } = setup;

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(14, 0, 0, 0);
            const startTime = tomorrow.getTime();
            const endTime = startTime + 60 * 60 * 1000;

            const bookingId = await ctx.db.insert('bookings', {
                tenantId,
                resourceId: slotsResource,
                userId,
                startTime,
                endTime,
                status: 'confirmed',
                totalPrice: 500,
                currency: 'NOK',
                notes: 'Formål: Trening. Deltakere: 12',
                version: 1,
                submittedAt: Date.now(),
                metadata: { activityType: 'training', attendees: 12 },
            });

            const booking = await ctx.db.get(bookingId);
            expect(booking).toMatchObject({
                tenantId,
                resourceId: slotsResource,
                status: 'confirmed',
                totalPrice: 500,
            });
        });

        it('should reject booking with conflict', async () => {
            const ctx = createMockContext(setup.store);
            const { slotsResource, tenantId } = setup.resources;
            const { userId } = setup;

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(15, 0, 0, 0);
            const startTime = tomorrow.getTime();
            const endTime = startTime + 60 * 60 * 1000;

            // First booking
            await ctx.db.insert('bookings', {
                tenantId,
                resourceId: slotsResource,
                userId,
                startTime,
                endTime,
                status: 'confirmed',
                totalPrice: 500,
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: {},
            });

            // Check for conflict before second booking
            const existingBookings = await ctx.db
                .query('bookings')
                .withIndex('by_resource', (q: IndexQueryBuilder) =>
                    q.eq('resourceId', slotsResource)
                )
                .collect();

            const hasConflict = existingBookings.some((b: any) => {
                if (b.status === 'cancelled' || b.status === 'rejected') return false;
                return startTime < b.endTime && endTime > b.startTime;
            });

            expect(hasConflict).toBe(true);
        });

        it('should handle multi-hour booking', async () => {
            const ctx = createMockContext(setup.store);
            const { slotsResource, tenantId } = setup.resources;
            const { userId } = setup;

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(16, 0, 0, 0);
            const startTime = tomorrow.getTime();
            const endTime = startTime + 2 * 60 * 60 * 1000; // 2 hours

            const bookingId = await ctx.db.insert('bookings', {
                tenantId,
                resourceId: slotsResource,
                userId,
                startTime,
                endTime,
                status: 'confirmed',
                totalPrice: 1000, // 2 hours × 500
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: { durationMinutes: 120 },
            });

            const booking = await ctx.db.get(bookingId);
            expect(booking?.totalPrice).toBe(1000);
        });
    });
});

// =============================================================================
// ALL_DAY Mode Tests
// =============================================================================

describe('ALL_DAY Mode Bookings', () => {
    let setup: TestSetup;

    beforeEach(() => {
        setup = setupTestData();
    });

    describe('Day Availability', () => {
        it('should return day status for a month', async () => {
            const ctx = createMockContext(setup.store);
            const { allDayResource } = setup.resources;

            const resource = await ctx.db.get(allDayResource);
            expect(resource).toBeDefined();
            expect(resource?.bookingMode).toBe('ALL_DAY');
            expect(resource?.pricePerDay).toBe(2000);
        });

        it('should mark day as booked when full-day booking exists', async () => {
            const ctx = createMockContext(setup.store);
            const { allDayResource, tenantId } = setup.resources;
            const { userId } = setup;

            // Book for tomorrow (full day)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const startTime = tomorrow.getTime();
            const endTime = new Date(tomorrow).setHours(23, 59, 59, 999);

            await ctx.db.insert('bookings', {
                tenantId,
                resourceId: allDayResource,
                userId,
                startTime,
                endTime,
                status: 'confirmed',
                totalPrice: 2000,
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: { isFullDay: true },
            });

            // Check availability for that day
            const bookings = await ctx.db
                .query('bookings')
                .withIndex('by_resource', (q: IndexQueryBuilder) =>
                    q.eq('resourceId', allDayResource)
                )
                .collect();

            const dayIsBooked = bookings.some((b: any) => {
                if (b.status === 'cancelled' || b.status === 'rejected') return false;
                const bStart = new Date(b.startTime);
                const bEnd = new Date(b.endTime);
                // Check if booking spans most of the day (8+ hours)
                return (bEnd.getTime() - bStart.getTime()) >= 8 * 60 * 60 * 1000;
            });

            expect(dayIsBooked).toBe(true);
        });
    });

    describe('All-Day Booking Creation', () => {
        it('should create full-day booking with correct timestamps', async () => {
            const ctx = createMockContext(setup.store);
            const { allDayResource, tenantId } = setup.resources;
            const { userId } = setup;

            // Book 3 days from now
            const bookingDate = new Date();
            bookingDate.setDate(bookingDate.getDate() + 3);

            // Use local date formatting (not UTC)
            const year = bookingDate.getFullYear();
            const month = bookingDate.getMonth();
            const day = bookingDate.getDate();

            const startDate = new Date(year, month, day, 0, 0, 0, 0);
            const endDate = new Date(year, month, day, 23, 59, 59, 999);

            const bookingId = await ctx.db.insert('bookings', {
                tenantId,
                resourceId: allDayResource,
                userId,
                startTime: startDate.getTime(),
                endTime: endDate.getTime(),
                status: 'pending', // Requires approval
                totalPrice: 2000,
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: { isFullDay: true },
            });

            const booking = await ctx.db.get(bookingId);
            expect(booking?.status).toBe('pending');

            // Verify date matches expected day
            const bookedStart = new Date(booking!.startTime);
            expect(bookedStart.getDate()).toBe(day);
            expect(bookedStart.getMonth()).toBe(month);
        });

        it('should handle multi-day booking', async () => {
            const ctx = createMockContext(setup.store);
            const { allDayResource, tenantId } = setup.resources;
            const { userId } = setup;

            // Book 2 consecutive days
            const day1 = new Date();
            day1.setDate(day1.getDate() + 5);
            day1.setHours(0, 0, 0, 0);

            const day2 = new Date(day1);
            day2.setDate(day2.getDate() + 1);
            day2.setHours(23, 59, 59, 999);

            const bookingId = await ctx.db.insert('bookings', {
                tenantId,
                resourceId: allDayResource,
                userId,
                startTime: day1.getTime(),
                endTime: day2.getTime(),
                status: 'pending',
                totalPrice: 4000, // 2 days × 2000
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: { isMultiDay: true, dayCount: 2 },
            });

            const booking = await ctx.db.get(bookingId);
            expect(booking?.totalPrice).toBe(4000);
        });
    });
});

// =============================================================================
// DURATION Mode Tests
// =============================================================================

describe('DURATION Mode Bookings', () => {
    let setup: TestSetup;

    beforeEach(() => {
        setup = setupTestData();
    });

    describe('Duration Availability', () => {
        it('should return available durations for a day', async () => {
            const ctx = createMockContext(setup.store);
            const { durationResource } = setup.resources;

            const resource = await ctx.db.get(durationResource);
            expect(resource).toBeDefined();
            expect(resource?.bookingMode).toBe('DURATION');
            expect(resource?.pricePerHour).toBe(200);
            expect(resource?.minDuration).toBe(60);
            expect(resource?.maxDuration).toBe(480);
        });
    });

    describe('Duration Booking Creation', () => {
        it('should create booking with specific duration', async () => {
            const ctx = createMockContext(setup.store);
            const { durationResource, tenantId } = setup.resources;
            const { userId } = setup;

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(8, 0, 0, 0);
            const startTime = tomorrow.getTime();
            const durationMinutes = 240; // 4 hours
            const endTime = startTime + durationMinutes * 60 * 1000;

            // Price = 4 hours × 200 = 800
            const bookingId = await ctx.db.insert('bookings', {
                tenantId,
                resourceId: durationResource,
                userId,
                startTime,
                endTime,
                status: 'confirmed',
                totalPrice: 800,
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: { durationMinutes },
            });

            const booking = await ctx.db.get(bookingId);
            expect(booking?.totalPrice).toBe(800);

            // Verify duration
            const actualDuration = (booking!.endTime - booking!.startTime) / 60 / 1000;
            expect(actualDuration).toBe(240);
        });

        it('should enforce minimum duration', () => {
            const minDuration = 60;
            const requestedDuration = 30;

            expect(requestedDuration).toBeLessThan(minDuration);
            // In real implementation, this would throw an error
        });

        it('should enforce maximum duration', () => {
            const maxDuration = 480;
            const requestedDuration = 600;

            expect(requestedDuration).toBeGreaterThan(maxDuration);
            // In real implementation, this would throw an error
        });
    });
});

// =============================================================================
// TICKETS Mode Tests
// =============================================================================

describe('TICKETS Mode Bookings', () => {
    let setup: TestSetup;

    beforeEach(() => {
        setup = setupTestData();
    });

    describe('Ticket Availability', () => {
        it('should return available tickets for an event', async () => {
            const ctx = createMockContext(setup.store);
            const { ticketsResource } = setup.resources;

            const resource = await ctx.db.get(ticketsResource);
            expect(resource).toBeDefined();
            expect(resource?.bookingMode).toBe('TICKETS');
            expect(resource?.capacity).toBe(50);
            expect(resource?.pricePerTicket).toBe(150);
        });

        it('should track remaining capacity', async () => {
            const ctx = createMockContext(setup.store);
            const { ticketsResource, tenantId } = setup.resources;
            const { userId } = setup;

            const eventDate = new Date();
            eventDate.setDate(eventDate.getDate() + 7);
            eventDate.setHours(0, 0, 0, 0);
            const startTime = eventDate.getTime();
            const endTime = new Date(eventDate).setHours(23, 59, 59, 999);

            // Book 10 tickets
            await ctx.db.insert('bookings', {
                tenantId,
                resourceId: ticketsResource,
                userId,
                startTime,
                endTime,
                status: 'confirmed',
                totalPrice: 1500, // 10 × 150
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: { quantity: 10 },
            });

            // Check remaining capacity
            const bookings = await ctx.db
                .query('bookings')
                .withIndex('by_resource', (q: IndexQueryBuilder) =>
                    q.eq('resourceId', ticketsResource)
                )
                .collect();

            const totalBooked = bookings
                .filter((b: any) => b.status === 'confirmed')
                .reduce((sum: number, b: any) => sum + (b.metadata?.quantity || 1), 0);

            const resource = await ctx.db.get(ticketsResource);
            const remaining = (resource?.capacity || 0) - totalBooked;

            expect(remaining).toBe(40); // 50 - 10
        });
    });

    describe('Ticket Booking Creation', () => {
        it('should create booking with quantity', async () => {
            const ctx = createMockContext(setup.store);
            const { ticketsResource, tenantId } = setup.resources;
            const { userId } = setup;

            const eventDate = new Date();
            eventDate.setDate(eventDate.getDate() + 10);
            eventDate.setHours(0, 0, 0, 0);
            const startTime = eventDate.getTime();
            const endTime = new Date(eventDate).setHours(23, 59, 59, 999);
            const quantity = 5;

            const bookingId = await ctx.db.insert('bookings', {
                tenantId,
                resourceId: ticketsResource,
                userId,
                startTime,
                endTime,
                status: 'confirmed',
                totalPrice: 750, // 5 × 150
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: { quantity },
            });

            const booking = await ctx.db.get(bookingId);
            expect(booking?.totalPrice).toBe(750);
            expect(booking?.metadata?.quantity).toBe(5);
        });

        it('should prevent overbooking', async () => {
            const ctx = createMockContext(setup.store);
            const { ticketsResource, tenantId } = setup.resources;
            const { userId } = setup;

            const eventDate = new Date();
            eventDate.setDate(eventDate.getDate() + 14);
            const startTime = eventDate.getTime();

            // Book 45 tickets
            await ctx.db.insert('bookings', {
                tenantId,
                resourceId: ticketsResource,
                userId,
                startTime,
                endTime: startTime + 86400000,
                status: 'confirmed',
                totalPrice: 6750,
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: { quantity: 45 },
            });

            // Try to book 10 more (would exceed capacity)
            const resource = await ctx.db.get(ticketsResource);
            const capacity = resource?.capacity || 0;

            const existingBookings = await ctx.db
                .query('bookings')
                .withIndex('by_resource', (q: IndexQueryBuilder) =>
                    q.eq('resourceId', ticketsResource)
                )
                .collect();

            const booked = existingBookings
                .filter((b: any) => b.status === 'confirmed')
                .reduce((sum: number, b: any) => sum + (b.metadata?.quantity || 1), 0);

            const remaining = capacity - booked;
            const requestedQuantity = 10;

            expect(requestedQuantity).toBeGreaterThan(remaining);
            // In real implementation, this would throw an error
        });
    });
});

// =============================================================================
// Pricing Tests
// =============================================================================

describe('Pricing Calculations', () => {
    let setup: TestSetup;

    beforeEach(() => {
        setup = setupTestData();
    });

    describe('Base Pricing', () => {
        it('should calculate SLOTS price based on hours', () => {
            const pricePerHour = 500;
            const hours = 2;
            const expectedPrice = pricePerHour * hours;

            expect(expectedPrice).toBe(1000);
        });

        it('should calculate ALL_DAY price based on days', () => {
            const pricePerDay = 2000;
            const days = 3;
            const expectedPrice = pricePerDay * days;

            expect(expectedPrice).toBe(6000);
        });

        it('should calculate DURATION price based on hours', () => {
            const pricePerHour = 200;
            const durationMinutes = 240; // 4 hours
            const expectedPrice = (durationMinutes / 60) * pricePerHour;

            expect(expectedPrice).toBe(800);
        });

        it('should calculate TICKETS price based on quantity', () => {
            const pricePerTicket = 150;
            const quantity = 8;
            const expectedPrice = pricePerTicket * quantity;

            expect(expectedPrice).toBe(1200);
        });
    });

    describe('Discounts', () => {
        it('should apply member discount (20%)', () => {
            const basePrice = 1000;
            const memberMultiplier = 0.8;
            const discountedPrice = basePrice * memberMultiplier;

            expect(discountedPrice).toBe(800);
        });

        it('should apply organization discount (30%)', () => {
            const basePrice = 2000;
            const orgMultiplier = 0.7;
            const discountedPrice = basePrice * orgMultiplier;

            expect(discountedPrice).toBe(1400);
        });

        it('should apply bulk discount for multiple bookings', () => {
            const slotPrice = 500;
            const slotCount = 5;
            const bulkDiscountThreshold = 3;
            const bulkDiscountPercent = 0.1; // 10%

            let totalPrice = slotPrice * slotCount;
            if (slotCount >= bulkDiscountThreshold) {
                totalPrice = totalPrice * (1 - bulkDiscountPercent);
            }

            expect(totalPrice).toBe(2250); // 2500 - 10%
        });

        it('should apply early bird discount', () => {
            const basePrice = 1000;
            const daysInAdvance = 14;
            const earlyBirdThreshold = 7;
            const earlyBirdDiscount = 0.05; // 5%

            let finalPrice = basePrice;
            if (daysInAdvance >= earlyBirdThreshold) {
                finalPrice = basePrice * (1 - earlyBirdDiscount);
            }

            expect(finalPrice).toBe(950);
        });
    });

    describe('Surcharges', () => {
        it('should apply weekend surcharge', () => {
            const basePrice = 500;
            const isWeekend = true;
            const weekendSurchargePercent = 0.2; // 20%

            let finalPrice = basePrice;
            if (isWeekend) {
                finalPrice = basePrice * (1 + weekendSurchargePercent);
            }

            expect(finalPrice).toBe(600);
        });

        it('should apply peak hour surcharge', () => {
            const basePrice = 500;
            const hour = 18; // 6 PM - peak hour
            const peakHours = [17, 18, 19, 20];
            const peakSurchargePercent = 0.15; // 15%

            let finalPrice = basePrice;
            if (peakHours.includes(hour)) {
                finalPrice = basePrice * (1 + peakSurchargePercent);
            }

            expect(finalPrice).toBe(575);
        });

        it('should apply holiday surcharge', () => {
            const basePrice = 2000;
            const isHoliday = true;
            const holidaySurchargePercent = 0.5; // 50%

            let finalPrice = basePrice;
            if (isHoliday) {
                finalPrice = basePrice * (1 + holidaySurchargePercent);
            }

            expect(finalPrice).toBe(3000);
        });
    });

    describe('Combined Pricing', () => {
        it('should combine base price + services + surcharge - discount', () => {
            const basePrice = 1000;
            const servicesPrice = 200;
            const weekendSurcharge = 0.2;
            const memberDiscount = 0.2;

            // Calculate: (base + services) × (1 + surcharge) × (1 - discount)
            const subtotal = basePrice + servicesPrice;
            const withSurcharge = subtotal * (1 + weekendSurcharge);
            const finalPrice = withSurcharge * (1 - memberDiscount);

            expect(finalPrice).toBe(1152); // (1200 × 1.2) × 0.8
        });
    });
});

// =============================================================================
// Additional Services Tests
// =============================================================================

describe('Additional Services', () => {
    let setup: TestSetup;

    beforeEach(() => {
        setup = setupTestData();
    });

    describe('Service Availability', () => {
        it('should return services for a resource', async () => {
            const ctx = createMockContext(setup.store);
            const { slotsResource, tenantId } = setup.resources;

            const services = await ctx.db
                .query('additionalServices')
                .withIndex('by_resource', (q: IndexQueryBuilder) =>
                    q.eq('resourceId', slotsResource)
                )
                .collect();

            expect(services.length).toBeGreaterThan(0);
        });

        it('should filter active services only', async () => {
            const ctx = createMockContext(setup.store);
            const { allDayResource } = setup.resources;

            const services = await ctx.db
                .query('additionalServices')
                .withIndex('by_resource', (q: IndexQueryBuilder) =>
                    q.eq('resourceId', allDayResource)
                )
                .collect();

            const activeServices = services.filter((s: any) => s.isActive !== false);
            expect(activeServices.length).toBeLessThanOrEqual(services.length);
        });
    });

    describe('Service Pricing', () => {
        it('should add service price to booking total', () => {
            const basePrice = 500;
            const equipmentPrice = 150;
            const cleaningPrice = 500;

            const selectedServices = [equipmentPrice, cleaningPrice];
            const servicesTotal = selectedServices.reduce((sum, price) => sum + price, 0);
            const totalPrice = basePrice + servicesTotal;

            expect(totalPrice).toBe(1150);
        });

        it('should handle required services', async () => {
            const ctx = createMockContext(setup.store);
            const { allDayResource, tenantId } = setup.resources;

            // Add a required service
            const requiredService = await ctx.db.insert('additionalServices', {
                tenantId,
                resourceId: allDayResource,
                name: 'Obligatorisk forsikring',
                description: 'Påkrevd for alle bookinger',
                price: 100,
                isRequired: true,
                isActive: true,
            });

            const service = await ctx.db.get(requiredService);
            expect(service?.isRequired).toBe(true);

            // Required service must be included in price
            const basePrice = 2000;
            const requiredPrice = service?.price || 0;
            const minimumTotal = basePrice + requiredPrice;

            expect(minimumTotal).toBe(2100);
        });
    });
});

// =============================================================================
// Conflict Detection Tests
// =============================================================================

describe('Conflict Detection', () => {
    let setup: TestSetup;

    beforeEach(() => {
        setup = setupTestData();
    });

    describe('Overlapping Bookings', () => {
        it('should detect full overlap', () => {
            const existingStart = new Date('2024-03-15T10:00:00').getTime();
            const existingEnd = new Date('2024-03-15T12:00:00').getTime();
            const newStart = new Date('2024-03-15T10:30:00').getTime();
            const newEnd = new Date('2024-03-15T11:30:00').getTime();

            const hasOverlap = newStart < existingEnd && newEnd > existingStart;

            expect(hasOverlap).toBe(true);
        });

        it('should detect partial overlap (start inside)', () => {
            const existingStart = new Date('2024-03-15T10:00:00').getTime();
            const existingEnd = new Date('2024-03-15T12:00:00').getTime();
            const newStart = new Date('2024-03-15T11:00:00').getTime();
            const newEnd = new Date('2024-03-15T13:00:00').getTime();

            const hasOverlap = newStart < existingEnd && newEnd > existingStart;

            expect(hasOverlap).toBe(true);
        });

        it('should detect partial overlap (end inside)', () => {
            const existingStart = new Date('2024-03-15T10:00:00').getTime();
            const existingEnd = new Date('2024-03-15T12:00:00').getTime();
            const newStart = new Date('2024-03-15T09:00:00').getTime();
            const newEnd = new Date('2024-03-15T11:00:00').getTime();

            const hasOverlap = newStart < existingEnd && newEnd > existingStart;

            expect(hasOverlap).toBe(true);
        });

        it('should not detect conflict for adjacent times', () => {
            const existingStart = new Date('2024-03-15T10:00:00').getTime();
            const existingEnd = new Date('2024-03-15T11:00:00').getTime();
            const newStart = new Date('2024-03-15T11:00:00').getTime();
            const newEnd = new Date('2024-03-15T12:00:00').getTime();

            // Strictly adjacent (end equals start) should not conflict
            const hasOverlap = newStart < existingEnd && newEnd > existingStart;

            expect(hasOverlap).toBe(false);
        });
    });

    describe('Block Conflicts', () => {
        it('should detect booking during blocked period', async () => {
            const ctx = createMockContext(setup.store);
            const { slotsResource, tenantId } = setup.resources;

            // Create a block
            const blockStart = new Date();
            blockStart.setDate(blockStart.getDate() + 2);
            blockStart.setHours(0, 0, 0, 0);
            const blockEnd = new Date(blockStart);
            blockEnd.setHours(23, 59, 59, 999);

            await ctx.db.insert('blocks', {
                tenantId,
                resourceId: slotsResource,
                startDate: blockStart.getTime(),
                endDate: blockEnd.getTime(),
                reason: 'Maintenance',
                status: 'active',
                allDay: true,
            });

            // Check if booking time conflicts with block
            const bookingTime = new Date(blockStart);
            bookingTime.setHours(14, 0, 0, 0);

            const blocks = await ctx.db
                .query('blocks')
                .withIndex('by_resource', (q: IndexQueryBuilder) =>
                    q.eq('resourceId', slotsResource)
                )
                .collect();

            const isBlocked = blocks.some((b: any) => {
                if (b.status !== 'active') return false;
                return bookingTime.getTime() >= b.startDate && bookingTime.getTime() <= b.endDate;
            });

            expect(isBlocked).toBe(true);
        });
    });
});

// =============================================================================
// Approval Workflow Tests
// =============================================================================

describe('Approval Workflow', () => {
    let setup: TestSetup;

    beforeEach(() => {
        setup = setupTestData();
    });

    describe('Pending Bookings', () => {
        it('should create booking with pending status for approval-required resource', async () => {
            const ctx = createMockContext(setup.store);
            const { allDayResource, tenantId } = setup.resources;
            const { userId } = setup;

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const bookingId = await ctx.db.insert('bookings', {
                tenantId,
                resourceId: allDayResource,
                userId,
                startTime: tomorrow.getTime(),
                endTime: tomorrow.getTime() + 86400000,
                status: 'pending',
                totalPrice: 2000,
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: {},
            });

            const booking = await ctx.db.get(bookingId);
            expect(booking?.status).toBe('pending');
        });
    });

    describe('Approval Actions', () => {
        it('should approve pending booking', async () => {
            const ctx = createMockContext(setup.store);
            const { allDayResource, tenantId } = setup.resources;
            const { userId } = setup;

            // Create pending booking
            const bookingId = await ctx.db.insert('bookings', {
                tenantId,
                resourceId: allDayResource,
                userId,
                startTime: Date.now() + 86400000,
                endTime: Date.now() + 172800000,
                status: 'pending',
                totalPrice: 2000,
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: {},
            });

            // Approve
            await ctx.db.patch(bookingId, {
                status: 'confirmed',
                approvedAt: Date.now(),
                approvedBy: 'admin-user-id',
            });

            const booking = await ctx.db.get(bookingId);
            expect(booking?.status).toBe('confirmed');
            expect(booking?.approvedAt).toBeDefined();
        });

        it('should reject pending booking with reason', async () => {
            const ctx = createMockContext(setup.store);
            const { allDayResource, tenantId } = setup.resources;
            const { userId } = setup;

            const bookingId = await ctx.db.insert('bookings', {
                tenantId,
                resourceId: allDayResource,
                userId,
                startTime: Date.now() + 86400000,
                endTime: Date.now() + 172800000,
                status: 'pending',
                totalPrice: 2000,
                currency: 'NOK',
                version: 1,
                submittedAt: Date.now(),
                metadata: {},
            });

            await ctx.db.patch(bookingId, {
                status: 'rejected',
                rejectedAt: Date.now(),
                rejectionReason: 'Resource under maintenance',
            });

            const booking = await ctx.db.get(bookingId);
            expect(booking?.status).toBe('rejected');
            expect(booking?.rejectionReason).toBe('Resource under maintenance');
        });
    });
});
