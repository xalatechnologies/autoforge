/**
 * Amenity Functions Tests
 *
 * Tests for amenity groups, amenities, and resource associations.
 * User Stories: US-6.1, US-6.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Amenity Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let resourceId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Amenity Test Tenant' });
        resourceId = store.seedResource({
            tenantId,
            name: 'Test Resource',
            slug: 'test-resource',
        });
    });

    describe('US-6.1: Amenity Groups', () => {
        it('group.list.success - should list amenity groups for tenant', async () => {
            const ctx = createMockContext(store);

            store.seedAmenityGroup({ tenantId, name: 'Equipment' });
            store.seedAmenityGroup({ tenantId, name: 'Services' });

            const groups = await ctx.db.query('amenityGroups')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(groups).toHaveLength(2);
        });

        it('group.create.success - should create amenity group', async () => {
            const ctx = createMockContext(store);

            const groupId = await ctx.db.insert('amenityGroups', {
                tenantId,
                name: 'New Group',
                description: 'Test group',
                isActive: true,
                displayOrder: 0,
            });

            expect(groupId).toBeDefined();

            const group = await ctx.db.get(groupId);
            expect(group).toMatchObject({
                name: 'New Group',
                description: 'Test group',
            });
        });

        it('group.update.success - should update amenity group', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedAmenityGroup({
                tenantId,
                name: 'Old Name',
            });

            await ctx.db.patch(groupId, {
                name: 'New Name',
                description: 'Updated description',
            });

            const group = await ctx.db.get(groupId);
            expect(group?.name).toBe('New Name');
            expect(group?.description).toBe('Updated description');
        });

        it('group.delete.success - should delete amenity group', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedAmenityGroup({
                tenantId,
                name: 'To Delete',
            });

            await ctx.db.delete(groupId);

            const group = await ctx.db.get(groupId);
            expect(group).toBeNull();
        });
    });

    describe('US-6.2: Amenity Management', () => {
        it('amenity.list.success - should list amenities for tenant', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedAmenityGroup({ tenantId, name: 'Equipment' });
            store.seedAmenity({ tenantId, name: 'Projector', groupId });
            store.seedAmenity({ tenantId, name: 'Whiteboard', groupId });

            const amenities = await ctx.db.query('amenities')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(amenities).toHaveLength(2);
        });

        it('amenity.get.success - should get amenity by ID', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedAmenityGroup({ tenantId, name: 'Equipment' });
            const amenityId = store.seedAmenity({
                tenantId,
                name: 'Projector',
                groupId,
                description: 'HD Projector',
            });

            const amenity = await ctx.db.get(amenityId);
            expect(amenity).toMatchObject({
                name: 'Projector',
                description: 'HD Projector',
                groupId,
            });
        });

        it('amenity.create.success - should create amenity', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedAmenityGroup({ tenantId, name: 'Equipment' });

            const amenityId = await ctx.db.insert('amenities', {
                tenantId,
                groupId,
                name: 'New Amenity',
                description: 'Test amenity',
                isActive: true,
                isHighlighted: false,
                displayOrder: 0,
            });

            expect(amenityId).toBeDefined();

            const amenity = await ctx.db.get(amenityId);
            expect(amenity).toMatchObject({
                name: 'New Amenity',
                groupId,
            });
        });

        it('amenity.update.success - should update amenity', async () => {
            const ctx = createMockContext(store);

            const amenityId = store.seedAmenity({
                tenantId,
                name: 'Old Name',
            });

            await ctx.db.patch(amenityId, {
                name: 'New Name',
                description: 'Updated description',
            });

            const amenity = await ctx.db.get(amenityId);
            expect(amenity?.name).toBe('New Name');
            expect(amenity?.description).toBe('Updated description');
        });

        it('amenity.delete.success - should delete amenity', async () => {
            const ctx = createMockContext(store);

            const amenityId = store.seedAmenity({
                tenantId,
                name: 'To Delete',
            });

            await ctx.db.delete(amenityId);

            const amenity = await ctx.db.get(amenityId);
            expect(amenity).toBeNull();
        });
    });

    describe('Resource Amenities', () => {
        it('resource.amenity.add - should add amenity to resource', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedAmenityGroup({ tenantId, name: 'Equipment' });
            const amenityId = store.seedAmenity({ tenantId, name: 'Projector', groupId });

            const resourceAmenityId = await ctx.db.insert('resourceAmenities', {
                tenantId,
                resourceId,
                amenityId,
                quantity: 2,
                isActive: true,
            });

            expect(resourceAmenityId).toBeDefined();

            const resourceAmenity = await ctx.db.get(resourceAmenityId);
            expect(resourceAmenity).toMatchObject({
                resourceId,
                amenityId,
                quantity: 2,
            });
        });

        it('resource.amenity.list - should list amenities for resource', async () => {
            const ctx = createMockContext(store);

            const groupId = store.seedAmenityGroup({ tenantId, name: 'Equipment' });
            const amenity1Id = store.seedAmenity({ tenantId, name: 'Projector', groupId });
            const amenity2Id = store.seedAmenity({ tenantId, name: 'Whiteboard', groupId });

            await ctx.db.insert('resourceAmenities', {
                tenantId,
                resourceId,
                amenityId: amenity1Id,
                quantity: 1,
                isActive: true,
            });
            await ctx.db.insert('resourceAmenities', {
                tenantId,
                resourceId,
                amenityId: amenity2Id,
                quantity: 2,
                isActive: true,
            });

            const resourceAmenities = await ctx.db.query('resourceAmenities')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            expect(resourceAmenities).toHaveLength(2);
        });

        it('resource.amenity.remove - should remove amenity from resource', async () => {
            const ctx = createMockContext(store);

            const amenityId = store.seedAmenity({ tenantId, name: 'Projector' });

            const resourceAmenityId = await ctx.db.insert('resourceAmenities', {
                tenantId,
                resourceId,
                amenityId,
                quantity: 1,
                isActive: true,
            });

            await ctx.db.delete(resourceAmenityId);

            const resourceAmenity = await ctx.db.get(resourceAmenityId);
            expect(resourceAmenity).toBeNull();
        });

        it('resource.amenity.update-quantity - should update amenity quantity', async () => {
            const ctx = createMockContext(store);

            const amenityId = store.seedAmenity({ tenantId, name: 'Projector' });

            const resourceAmenityId = await ctx.db.insert('resourceAmenities', {
                tenantId,
                resourceId,
                amenityId,
                quantity: 1,
                isActive: true,
            });

            await ctx.db.patch(resourceAmenityId, { quantity: 5 });

            const resourceAmenity = await ctx.db.get(resourceAmenityId);
            expect(resourceAmenity?.quantity).toBe(5);
        });
    });

    describe('Amenity Queries', () => {
        it('amenity.by-group - should filter amenities by group', async () => {
            const ctx = createMockContext(store);

            const group1Id = store.seedAmenityGroup({ tenantId, name: 'Equipment' });
            const group2Id = store.seedAmenityGroup({ tenantId, name: 'Services' });

            store.seedAmenity({ tenantId, name: 'Projector', groupId: group1Id });
            store.seedAmenity({ tenantId, name: 'Whiteboard', groupId: group1Id });
            store.seedAmenity({ tenantId, name: 'Cleaning', groupId: group2Id });

            const amenities = await ctx.db.query('amenities')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const equipmentAmenities = amenities.filter((a: any) => a.groupId === group1Id);
            expect(equipmentAmenities).toHaveLength(2);
        });

        it('amenity.active-only - should filter active amenities', async () => {
            const ctx = createMockContext(store);

            store.seedAmenity({ tenantId, name: 'Active', isActive: true });
            store.seedAmenity({ tenantId, name: 'Inactive', isActive: false });

            const amenities = await ctx.db.query('amenities')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const active = amenities.filter((a: any) => a.isActive);
            expect(active).toHaveLength(1);
            expect(active[0].name).toBe('Active');
        });

        it('amenity.highlighted - should filter highlighted amenities', async () => {
            const ctx = createMockContext(store);

            store.seedAmenity({ tenantId, name: 'Normal', isHighlighted: false });
            store.seedAmenity({ tenantId, name: 'Featured', isHighlighted: true });

            const amenities = await ctx.db.query('amenities')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const highlighted = amenities.filter((a: any) => a.isHighlighted);
            expect(highlighted).toHaveLength(1);
            expect(highlighted[0].name).toBe('Featured');
        });
    });
});
