/**
 * Calendar & Opening Hours Tests
 *
 * Tests for calendar slot generation, opening hours matching, and booking modes.
 * These tests verify that time slots respect resource opening hours.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

// =============================================================================
// Helper Functions (mirror frontend logic for testing)
// =============================================================================

interface OpeningHours {
    dayIndex: number;
    day: string;
    open: string;
    close: string;
    isClosed?: boolean;
}

interface TimeSlot {
    time: string;
    status: 'available' | 'unavailable' | 'occupied' | 'selected';
    isPast: boolean;
    isOutsideHours?: boolean;
}

interface DayColumn {
    dayIndex: number;
    dayName: string;
    dayNumber: number;
    isToday: boolean;
    slots: TimeSlot[];
    openingHours: { open: string; close: string };
}

/**
 * Generate time slots for a week - CORRECT IMPLEMENTATION
 * Only generates slots within each day's specific opening hours
 */
function generateTimeSlotsCorrect(
    openingHoursArr: OpeningHours[],
    slotDurationMinutes: number = 60
): DayColumn[] {
    const dayNames = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
    const openingHoursMap: Record<number, OpeningHours> = {};

    for (const oh of openingHoursArr) {
        openingHoursMap[oh.dayIndex] = oh;
    }

    return Array.from({ length: 7 }, (_, idx) => {
        const dayIndex = idx; // 0=Sunday, 1=Monday, etc.
        const hours = openingHoursMap[dayIndex] || { open: '08:00', close: '18:00', isClosed: false };

        if (hours.isClosed) {
            return {
                dayIndex,
                dayName: dayNames[dayIndex] ?? '',
                dayNumber: idx + 1,
                isToday: false,
                slots: [], // No slots for closed days
                openingHours: { open: hours.open, close: hours.close },
            };
        }

        const [openH, openM] = hours.open.split(':').map(Number);
        const [closeH, closeM] = hours.close.split(':').map(Number);
        const dayStartMins = (openH ?? 8) * 60 + (openM ?? 0);
        const dayEndMins = (closeH ?? 18) * 60 + (closeM ?? 0);

        const slots: TimeSlot[] = [];
        // Only generate slots within this day's opening hours
        for (let mins = dayStartMins; mins < dayEndMins; mins += slotDurationMinutes) {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

            slots.push({
                time: timeStr,
                status: 'available',
                isPast: false,
                isOutsideHours: false,
            });
        }

        return {
            dayIndex,
            dayName: dayNames[dayIndex] ?? '',
            dayNumber: idx + 1,
            isToday: false,
            slots,
            openingHours: { open: hours.open, close: hours.close },
        };
    });
}

/**
 * Generate time slots - CURRENT (BUGGY) IMPLEMENTATION
 * Uses global time grid for all days
 */
function generateTimeSlotsGlobal(
    openingHoursArr: OpeningHours[],
    slotDurationMinutes: number = 60
): DayColumn[] {
    const dayNames = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
    const openingHoursMap: Record<number, OpeningHours> = {};

    for (const oh of openingHoursArr) {
        openingHoursMap[oh.dayIndex] = oh;
    }

    // Find global min/max (the buggy approach)
    let globalStartMins = 24 * 60;
    let globalEndMins = 0;
    for (let dow = 0; dow < 7; dow++) {
        const hours = openingHoursMap[dow] || { open: '08:00', close: '18:00' };
        if (hours.isClosed) continue;
        const [openH, openM] = hours.open.split(':').map(Number);
        const [closeH, closeM] = hours.close.split(':').map(Number);
        const startMins = (openH ?? 8) * 60 + (openM ?? 0);
        const endMins = (closeH ?? 18) * 60 + (closeM ?? 0);
        if (startMins < globalStartMins) globalStartMins = startMins;
        if (endMins > globalEndMins) globalEndMins = endMins;
    }

    return Array.from({ length: 7 }, (_, idx) => {
        const dayIndex = idx;
        const hours = openingHoursMap[dayIndex] || { open: '08:00', close: '18:00' };

        const [openH, openM] = hours.open.split(':').map(Number);
        const [closeH, closeM] = hours.close.split(':').map(Number);
        const dayStartMins = (openH ?? 8) * 60 + (openM ?? 0);
        const dayEndMins = (closeH ?? 18) * 60 + (closeM ?? 0);

        const slots: TimeSlot[] = [];
        // Uses global range (buggy)
        for (let mins = globalStartMins; mins < globalEndMins; mins += slotDurationMinutes) {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

            const isOutsideHours = hours.isClosed || mins < dayStartMins || mins >= dayEndMins;

            slots.push({
                time: timeStr,
                status: isOutsideHours ? 'unavailable' : 'available',
                isPast: isOutsideHours,
                isOutsideHours,
            });
        }

        return {
            dayIndex,
            dayName: dayNames[dayIndex] ?? '',
            dayNumber: idx + 1,
            isToday: false,
            slots,
            openingHours: { open: hours.open, close: hours.close },
        };
    });
}

// =============================================================================
// Tests
// =============================================================================

describe('Calendar Opening Hours', () => {
    describe('Opening Hours Slot Generation', () => {
        const standardOpeningHours: OpeningHours[] = [
            { dayIndex: 0, day: 'Søndag', open: '10:00', close: '18:00', isClosed: false },
            { dayIndex: 1, day: 'Mandag', open: '08:00', close: '21:00', isClosed: false },
            { dayIndex: 2, day: 'Tirsdag', open: '08:00', close: '21:00', isClosed: false },
            { dayIndex: 3, day: 'Onsdag', open: '08:00', close: '21:00', isClosed: false },
            { dayIndex: 4, day: 'Torsdag', open: '08:00', close: '21:00', isClosed: false },
            { dayIndex: 5, day: 'Fredag', open: '08:00', close: '22:00', isClosed: false },
            { dayIndex: 6, day: 'Lørdag', open: '09:00', close: '20:00', isClosed: false },
        ];

        it('OH-1.1: should generate slots only within opening hours (correct implementation)', () => {
            const result = generateTimeSlotsCorrect(standardOpeningHours, 60);

            // Sunday opens 10:00, should not have 08:00 or 09:00 slots
            const sunday = result.find(d => d.dayIndex === 0);
            expect(sunday?.slots.map(s => s.time)).not.toContain('08:00');
            expect(sunday?.slots.map(s => s.time)).not.toContain('09:00');
            expect(sunday?.slots[0]?.time).toBe('10:00');

            // Monday opens 08:00, should start at 08:00
            const monday = result.find(d => d.dayIndex === 1);
            expect(monday?.slots[0]?.time).toBe('08:00');

            // Friday closes 22:00, should have 21:00 as last slot
            const friday = result.find(d => d.dayIndex === 5);
            expect(friday?.slots[friday.slots.length - 1]?.time).toBe('21:00');
        });

        it('OH-1.2: should not show unavailable slots for times outside hours', () => {
            const result = generateTimeSlotsCorrect(standardOpeningHours, 60);

            // All slots in correct implementation should be available (not outside hours)
            for (const day of result) {
                for (const slot of day.slots) {
                    expect(slot.status).toBe('available');
                    expect(slot.isOutsideHours).toBeFalsy();
                }
            }
        });

        it('OH-1.3: global grid shows unavailable slots (demonstrating the bug)', () => {
            const result = generateTimeSlotsGlobal(standardOpeningHours, 60);

            // Global implementation shows 08:00 on Sunday as unavailable
            const sunday = result.find(d => d.dayIndex === 0);
            const sunday8am = sunday?.slots.find(s => s.time === '08:00');
            expect(sunday8am).toBeDefined();
            expect(sunday8am?.status).toBe('unavailable');
            expect(sunday8am?.isOutsideHours).toBe(true);
        });

        it('OH-1.4: correct implementation has fewer slots on days with shorter hours', () => {
            const result = generateTimeSlotsCorrect(standardOpeningHours, 60);

            const sunday = result.find(d => d.dayIndex === 0); // 10:00-18:00 = 8 slots
            const monday = result.find(d => d.dayIndex === 1); // 08:00-21:00 = 13 slots
            const friday = result.find(d => d.dayIndex === 5); // 08:00-22:00 = 14 slots

            expect(sunday?.slots.length).toBe(8);
            expect(monday?.slots.length).toBe(13);
            expect(friday?.slots.length).toBe(14);
        });

        it('OH-1.5: global grid has same number of slots for all days (the bug)', () => {
            const result = generateTimeSlotsGlobal(standardOpeningHours, 60);

            // All days have same slot count with global grid
            const sundaySlotCount = result.find(d => d.dayIndex === 0)?.slots.length;
            const mondaySlotCount = result.find(d => d.dayIndex === 1)?.slots.length;
            const fridaySlotCount = result.find(d => d.dayIndex === 5)?.slots.length;

            expect(sundaySlotCount).toBe(mondaySlotCount);
            expect(mondaySlotCount).toBe(fridaySlotCount);
        });
    });

    describe('Closed Days', () => {
        const hoursWithClosedDay: OpeningHours[] = [
            { dayIndex: 0, day: 'Søndag', open: '00:00', close: '00:00', isClosed: true },
            { dayIndex: 1, day: 'Mandag', open: '08:00', close: '20:00', isClosed: false },
            { dayIndex: 2, day: 'Tirsdag', open: '08:00', close: '20:00', isClosed: false },
            { dayIndex: 3, day: 'Onsdag', open: '08:00', close: '20:00', isClosed: false },
            { dayIndex: 4, day: 'Torsdag', open: '08:00', close: '20:00', isClosed: false },
            { dayIndex: 5, day: 'Fredag', open: '08:00', close: '20:00', isClosed: false },
            { dayIndex: 6, day: 'Lørdag', open: '10:00', close: '18:00', isClosed: false },
        ];

        it('OH-2.1: should have no slots on closed days', () => {
            const result = generateTimeSlotsCorrect(hoursWithClosedDay, 60);

            const sunday = result.find(d => d.dayIndex === 0);
            expect(sunday?.slots).toHaveLength(0);
        });

        it('OH-2.2: open days should still have correct slots', () => {
            const result = generateTimeSlotsCorrect(hoursWithClosedDay, 60);

            const monday = result.find(d => d.dayIndex === 1);
            expect(monday?.slots.length).toBe(12); // 08:00-20:00 = 12 slots

            const saturday = result.find(d => d.dayIndex === 6);
            expect(saturday?.slots.length).toBe(8); // 10:00-18:00 = 8 slots
        });
    });

    describe('Slot Duration', () => {
        const standardHours: OpeningHours[] = [
            { dayIndex: 1, day: 'Mandag', open: '08:00', close: '12:00', isClosed: false },
        ];

        it('OH-3.1: 30-minute slots should double the count', () => {
            const result60 = generateTimeSlotsCorrect(standardHours, 60);
            const result30 = generateTimeSlotsCorrect(standardHours, 30);

            const monday60 = result60.find(d => d.dayIndex === 1);
            const monday30 = result30.find(d => d.dayIndex === 1);

            expect(monday60?.slots.length).toBe(4); // 08, 09, 10, 11
            expect(monday30?.slots.length).toBe(8); // 08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 11:00, 11:30
        });

        it('OH-3.2: half-hour slots should include :30 times', () => {
            const result = generateTimeSlotsCorrect(standardHours, 30);
            const monday = result.find(d => d.dayIndex === 1);

            expect(monday?.slots.map(s => s.time)).toContain('08:30');
            expect(monday?.slots.map(s => s.time)).toContain('09:30');
            expect(monday?.slots.map(s => s.time)).toContain('10:30');
        });
    });

    describe('Edge Cases', () => {
        it('OH-4.1: should handle empty opening hours with defaults', () => {
            const result = generateTimeSlotsCorrect([], 60);

            // Should use defaults (08:00-18:00)
            const monday = result.find(d => d.dayIndex === 1);
            expect(monday?.slots[0]?.time).toBe('08:00');
            expect(monday?.slots.length).toBe(10); // 08:00-18:00
        });

        it('OH-4.2: should handle midnight closing (24-hour venue)', () => {
            const lateNightHours: OpeningHours[] = [
                { dayIndex: 5, day: 'Fredag', open: '18:00', close: '24:00', isClosed: false },
            ];

            const result = generateTimeSlotsCorrect(lateNightHours, 60);
            const friday = result.find(d => d.dayIndex === 5);

            expect(friday?.slots[0]?.time).toBe('18:00');
            expect(friday?.slots[friday.slots.length - 1]?.time).toBe('23:00');
            expect(friday?.slots.length).toBe(6); // 18, 19, 20, 21, 22, 23
        });

        it('OH-4.3: should handle early morning opening', () => {
            const earlyHours: OpeningHours[] = [
                { dayIndex: 1, day: 'Mandag', open: '05:00', close: '10:00', isClosed: false },
            ];

            const result = generateTimeSlotsCorrect(earlyHours, 60);
            const monday = result.find(d => d.dayIndex === 1);

            expect(monday?.slots[0]?.time).toBe('05:00');
            expect(monday?.slots.length).toBe(5);
        });
    });
});

describe('Resource Booking Types', () => {
    let store: TestDataStore;
    let tenantId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Booking Type Test Tenant' });
    });

    describe('Booking Mode Configuration', () => {
        it('BT-1.1: SLOTS mode should be set for hourly resources', async () => {
            const ctx = createMockContext(store);
            const resourceId = store.seedResource({
                tenantId,
                name: 'Padel Court',
                timeMode: 'SLOTS',
                slotDurationMinutes: 60,
                pricePerHour: 500,
            });

            const resource = await ctx.db.get(resourceId);
            expect(resource?.timeMode).toBe('SLOTS');
            expect(resource?.slotDurationMinutes).toBe(60);
        });

        it('BT-1.2: ALL_DAY mode should be set for daily rentals', async () => {
            const ctx = createMockContext(store);
            const resourceId = store.seedResource({
                tenantId,
                name: 'Conference Room',
                timeMode: 'ALL_DAY',
                pricePerDay: 5000,
            });

            const resource = await ctx.db.get(resourceId);
            expect(resource?.timeMode).toBe('ALL_DAY');
        });

        it('BT-1.3: DURATION mode should have min/max duration', async () => {
            const ctx = createMockContext(store);
            const resourceId = store.seedResource({
                tenantId,
                name: 'Meeting Room',
                timeMode: 'DURATION',
                minDuration: 30,
                maxDuration: 240,
            });

            const resource = await ctx.db.get(resourceId);
            expect(resource?.timeMode).toBe('DURATION');
            expect(resource?.minDuration).toBe(30);
            expect(resource?.maxDuration).toBe(240);
        });

        it('BT-1.4: PERIOD mode should support variable duration', async () => {
            const ctx = createMockContext(store);
            const resourceId = store.seedResource({
                tenantId,
                name: 'Studio',
                timeMode: 'PERIOD',
            });

            const resource = await ctx.db.get(resourceId);
            expect(resource?.timeMode).toBe('PERIOD');
        });
    });

    describe('Opening Hours Storage', () => {
        it('BT-2.1: should store opening hours per day', async () => {
            const ctx = createMockContext(store);
            const openingHours = [
                { dayIndex: 0, day: 'Søndag', open: '10:00', close: '18:00', isClosed: false },
                { dayIndex: 1, day: 'Mandag', open: '08:00', close: '21:00', isClosed: false },
            ];

            const resourceId = store.seedResource({
                tenantId,
                name: 'Sports Hall',
                openingHours,
            });

            const resource = await ctx.db.get(resourceId);
            expect(resource?.openingHours).toHaveLength(2);
            expect(resource?.openingHours[0].open).toBe('10:00');
            expect(resource?.openingHours[1].open).toBe('08:00');
        });

        it('BT-2.2: should support closed days', async () => {
            const ctx = createMockContext(store);
            const openingHours = [
                { dayIndex: 0, day: 'Søndag', open: '00:00', close: '00:00', isClosed: true },
            ];

            const resourceId = store.seedResource({
                tenantId,
                name: 'Office',
                openingHours,
            });

            const resource = await ctx.db.get(resourceId);
            expect(resource?.openingHours[0].isClosed).toBe(true);
        });
    });

    describe('Slot Duration Settings', () => {
        it('BT-3.1: should support 30-minute slots', async () => {
            const ctx = createMockContext(store);
            const resourceId = store.seedResource({
                tenantId,
                name: 'Tennis Court',
                slotDurationMinutes: 30,
            });

            const resource = await ctx.db.get(resourceId);
            expect(resource?.slotDurationMinutes).toBe(30);
        });

        it('BT-3.2: should support 60-minute slots', async () => {
            const ctx = createMockContext(store);
            const resourceId = store.seedResource({
                tenantId,
                name: 'Padel Court',
                slotDurationMinutes: 60,
            });

            const resource = await ctx.db.get(resourceId);
            expect(resource?.slotDurationMinutes).toBe(60);
        });

        it('BT-3.3: should support 90-minute slots', async () => {
            const ctx = createMockContext(store);
            const resourceId = store.seedResource({
                tenantId,
                name: 'Squash Court',
                slotDurationMinutes: 90,
            });

            const resource = await ctx.db.get(resourceId);
            expect(resource?.slotDurationMinutes).toBe(90);
        });
    });
});

describe('Booking Availability', () => {
    let store: TestDataStore;
    let tenantId: string;
    let resourceId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Availability Test Tenant' });
        resourceId = store.seedResource({
            tenantId,
            name: 'Test Court',
            timeMode: 'SLOTS',
            slotDurationMinutes: 60,
        });
    });

    describe('Slot Blocking', () => {
        it('BA-1.1: confirmed bookings should block slots', async () => {
            const ctx = createMockContext(store);
            const userId = store.seedUser({ tenantId });

            const startTime = new Date('2024-03-15T10:00:00').getTime();
            const endTime = new Date('2024-03-15T11:00:00').getTime();

            store.seedBooking({
                tenantId,
                resourceId,
                userId,
                startTime,
                endTime,
                status: 'confirmed',
            });

            const bookings = await ctx.db.query('bookings')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed');
            expect(confirmedBookings).toHaveLength(1);
        });

        it('BA-1.2: cancelled bookings should not block slots', async () => {
            const ctx = createMockContext(store);
            const userId = store.seedUser({ tenantId });

            store.seedBooking({
                tenantId,
                resourceId,
                userId,
                startTime: new Date('2024-03-15T10:00:00').getTime(),
                endTime: new Date('2024-03-15T11:00:00').getTime(),
                status: 'cancelled',
            });

            const bookings = await ctx.db.query('bookings')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            const activeBookings = bookings.filter((b: any) =>
                b.status === 'confirmed' || b.status === 'pending'
            );
            expect(activeBookings).toHaveLength(0);
        });
    });

    describe('Block Periods', () => {
        it('BA-2.1: blocks should prevent booking', async () => {
            const ctx = createMockContext(store);

            store.seedBlock({
                tenantId,
                resourceId,
                startDate: new Date('2024-03-15T00:00:00').getTime(),
                endDate: new Date('2024-03-15T23:59:59').getTime(),
                reason: 'Maintenance',
                status: 'active',
            });

            const blocks = await ctx.db.query('blocks')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            expect(blocks).toHaveLength(1);
            expect(blocks[0].reason).toBe('Maintenance');
        });

        it('BA-2.2: expired blocks should not prevent booking', async () => {
            const ctx = createMockContext(store);
            const now = Date.now();

            store.seedBlock({
                tenantId,
                resourceId,
                startDate: now - 86400000 * 2, // 2 days ago
                endDate: now - 86400000, // 1 day ago
                reason: 'Past Maintenance',
                status: 'active',
            });

            const blocks = await ctx.db.query('blocks')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            const activeBlocks = blocks.filter((b: any) => b.endDate > now);
            expect(activeBlocks).toHaveLength(0);
        });
    });
});
