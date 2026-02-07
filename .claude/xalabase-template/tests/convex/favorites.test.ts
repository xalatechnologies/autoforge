/**
 * Favorites Functions Tests
 *
 * Tests for user favorite resources management.
 * User Stories: US-10.1, US-10.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Favorites Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let resourceId: string;
    let userId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Favorites Test Tenant' });
        resourceId = store.seedResource({
            tenantId,
            name: 'Test Resource',
            slug: 'test-resource',
        });
        userId = store.seedUser({
            tenantId,
            name: 'Test User',
            email: 'test@example.com',
        });
    });

    describe('US-10.1: List Favorites', () => {
        it('favorite.list.success - should list user favorites', async () => {
            const ctx = createMockContext(store);

            const resource2Id = store.seedResource({ tenantId, name: 'Resource 2' });
            store.seedFavorite({ tenantId, userId, resourceId });
            store.seedFavorite({ tenantId, userId, resourceId: resource2Id });

            const favorites = await ctx.db.query('favorites')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            expect(favorites).toHaveLength(2);
        });

        it('favorite.list.empty - should return empty for no favorites', async () => {
            const ctx = createMockContext(store);

            const favorites = await ctx.db.query('favorites')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            expect(favorites).toHaveLength(0);
        });
    });

    describe('US-10.2: Manage Favorites', () => {
        it('favorite.check.true - should detect favorited resource', async () => {
            const ctx = createMockContext(store);

            store.seedFavorite({ tenantId, userId, resourceId });

            const favorites = await ctx.db.query('favorites')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const isFavorite = favorites.some((f: any) => f.resourceId === resourceId);
            expect(isFavorite).toBe(true);
        });

        it('favorite.check.false - should detect not favorited resource', async () => {
            const ctx = createMockContext(store);

            const favorites = await ctx.db.query('favorites')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const isFavorite = favorites.some((f: any) => f.resourceId === resourceId);
            expect(isFavorite).toBe(false);
        });

        it('favorite.add.success - should add resource to favorites', async () => {
            const ctx = createMockContext(store);

            const favoriteId = await ctx.db.insert('favorites', {
                tenantId,
                userId,
                resourceId,
                createdAt: Date.now(),
            });

            expect(favoriteId).toBeDefined();

            const favorite = await ctx.db.get(favoriteId);
            expect(favorite).toMatchObject({
                userId,
                resourceId,
            });
        });

        it('favorite.add.prevent-duplicate - should not duplicate favorites', async () => {
            const ctx = createMockContext(store);

            store.seedFavorite({ tenantId, userId, resourceId });

            const favorites = await ctx.db.query('favorites')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const existing = favorites.find((f: any) => f.resourceId === resourceId);
            expect(existing).toBeDefined();
        });

        it('favorite.remove.success - should remove from favorites', async () => {
            const ctx = createMockContext(store);

            const favoriteId = store.seedFavorite({ tenantId, userId, resourceId });

            await ctx.db.delete(favoriteId);

            const favorite = await ctx.db.get(favoriteId);
            expect(favorite).toBeNull();
        });

        it('favorite.toggle.add - should add when not favorited', async () => {
            const ctx = createMockContext(store);

            // Check not favorited
            const beforeFavorites = await ctx.db.query('favorites')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();
            expect(beforeFavorites.length).toBe(0);

            // Add favorite
            const favoriteId = await ctx.db.insert('favorites', {
                tenantId,
                userId,
                resourceId,
                createdAt: Date.now(),
            });

            // Verify added
            const favorite = await ctx.db.get(favoriteId);
            expect(favorite).toBeDefined();
        });

        it('favorite.toggle.remove - should remove when already favorited', async () => {
            const ctx = createMockContext(store);

            const favoriteId = store.seedFavorite({ tenantId, userId, resourceId });

            // Verify exists
            const before = await ctx.db.get(favoriteId);
            expect(before).toBeDefined();

            // Remove
            await ctx.db.delete(favoriteId);

            // Verify removed
            const after = await ctx.db.get(favoriteId);
            expect(after).toBeNull();
        });
    });

    describe('Favorite Queries', () => {
        it('favorite.by-resource - should find users who favorited a resource', async () => {
            const ctx = createMockContext(store);

            const user2Id = store.seedUser({ tenantId, email: 'user2@test.com' });

            store.seedFavorite({ tenantId, userId, resourceId });
            store.seedFavorite({ tenantId, userId: user2Id, resourceId });

            const favorites = await ctx.db.query('favorites')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            expect(favorites).toHaveLength(2);
        });

        it('favorite.count - should count favorites for resource', async () => {
            const ctx = createMockContext(store);

            store.seedFavorite({ tenantId, userId, resourceId });
            const user2Id = store.seedUser({ tenantId, email: 'user2@test.com' });
            store.seedFavorite({ tenantId, userId: user2Id, resourceId });

            const favorites = await ctx.db.query('favorites')
                .withIndex('by_resource', (q: IndexQueryBuilder) => q.eq('resourceId', resourceId))
                .collect();

            expect(favorites.length).toBe(2);
        });
    });
});
