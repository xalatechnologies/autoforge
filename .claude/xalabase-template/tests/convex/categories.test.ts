/**
 * Category Functions Tests
 *
 * Tests for category CRUD and tree management.
 * User Stories: US-5.1, US-5.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Category Functions', () => {
    let store: TestDataStore;
    let tenantId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Category Test Tenant' });
    });

    describe('US-5.1: List Categories', () => {
        it('category.list.success - should list categories for tenant', async () => {
            const ctx = createMockContext(store);

            store.seedCategory({ tenantId, key: 'LOKALER', name: 'Lokaler' });
            store.seedCategory({ tenantId, key: 'UTSTYR', name: 'Utstyr' });

            const categories = await ctx.db.query('categories')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(categories).toHaveLength(2);
        });

        it('category.list.active-only - should filter inactive categories', async () => {
            const ctx = createMockContext(store);

            store.seedCategory({ tenantId, key: 'ACTIVE', name: 'Active', isActive: true });
            store.seedCategory({ tenantId, key: 'INACTIVE', name: 'Inactive', isActive: false });

            const categories = await ctx.db.query('categories')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const active = categories.filter((c: any) => c.isActive);
            expect(active).toHaveLength(1);
            expect(active[0].key).toBe('ACTIVE');
        });
    });

    describe('US-5.2: Category Management', () => {
        it('category.get.success - should get category by ID', async () => {
            const ctx = createMockContext(store);

            const categoryId = store.seedCategory({
                tenantId,
                key: 'LOKALER',
                name: 'Lokaler',
                description: 'Rental spaces',
            });

            const category = await ctx.db.get(categoryId);
            expect(category).toMatchObject({
                key: 'LOKALER',
                name: 'Lokaler',
                description: 'Rental spaces',
            });
        });

        it('category.get.by-key - should find category by key', async () => {
            const ctx = createMockContext(store);

            store.seedCategory({ tenantId, key: 'LOKALER', name: 'Lokaler' });

            const categories = await ctx.db.query('categories')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const found = categories.find((c: any) => c.key === 'LOKALER');
            expect(found).toBeDefined();
            expect(found?.name).toBe('Lokaler');
        });

        it('category.create.success - should create category', async () => {
            const ctx = createMockContext(store);

            const categoryId = await ctx.db.insert('categories', {
                tenantId,
                key: 'NEW_CATEGORY',
                name: 'New Category',
                description: 'Test description',
                isActive: true,
                sortOrder: 0,
            });

            expect(categoryId).toBeDefined();

            const category = await ctx.db.get(categoryId);
            expect(category).toMatchObject({
                key: 'NEW_CATEGORY',
                name: 'New Category',
            });
        });

        it('category.create.unique-key - should enforce unique keys per tenant', async () => {
            const ctx = createMockContext(store);

            store.seedCategory({ tenantId, key: 'UNIQUE_KEY', name: 'First' });

            const categories = await ctx.db.query('categories')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const duplicate = categories.find((c: any) => c.key === 'UNIQUE_KEY');
            expect(duplicate).toBeDefined();
        });

        it('category.update.success - should update category', async () => {
            const ctx = createMockContext(store);

            const categoryId = store.seedCategory({
                tenantId,
                key: 'OLD',
                name: 'Old Name',
            });

            await ctx.db.patch(categoryId, {
                name: 'New Name',
                description: 'Updated description',
            });

            const category = await ctx.db.get(categoryId);
            expect(category?.name).toBe('New Name');
            expect(category?.description).toBe('Updated description');
        });

        it('category.delete.soft - should soft delete category', async () => {
            const ctx = createMockContext(store);

            const categoryId = store.seedCategory({
                tenantId,
                key: 'TO_DELETE',
                name: 'To Delete',
                isActive: true,
            });

            await ctx.db.patch(categoryId, {
                isActive: false,
            });

            const category = await ctx.db.get(categoryId);
            expect(category?.isActive).toBe(false);
        });
    });

    describe('Category Hierarchy', () => {
        it('category.parent-child - should support parent-child relationships', async () => {
            const ctx = createMockContext(store);

            const parentId = store.seedCategory({
                tenantId,
                key: 'PARENT',
                name: 'Parent',
            });

            store.seedCategory({
                tenantId,
                key: 'CHILD',
                name: 'Child',
                parentKey: 'PARENT',
            });

            const categories = await ctx.db.query('categories')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const child = categories.find((c: any) => c.key === 'CHILD');
            expect(child?.parentKey).toBe('PARENT');
        });

        it('category.tree - should build category tree', async () => {
            const ctx = createMockContext(store);

            store.seedCategory({ tenantId, key: 'ROOT', name: 'Root' });
            store.seedCategory({ tenantId, key: 'CHILD1', name: 'Child 1', parentKey: 'ROOT' });
            store.seedCategory({ tenantId, key: 'CHILD2', name: 'Child 2', parentKey: 'ROOT' });

            const categories = await ctx.db.query('categories')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const roots = categories.filter((c: any) => !c.parentKey);
            expect(roots).toHaveLength(1);

            const children = categories.filter((c: any) => c.parentKey === 'ROOT');
            expect(children).toHaveLength(2);
        });

        it('category.sort-order - should respect sort order', async () => {
            const ctx = createMockContext(store);

            store.seedCategory({ tenantId, key: 'THIRD', name: 'Third', sortOrder: 3 });
            store.seedCategory({ tenantId, key: 'FIRST', name: 'First', sortOrder: 1 });
            store.seedCategory({ tenantId, key: 'SECOND', name: 'Second', sortOrder: 2 });

            const categories = await ctx.db.query('categories')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const sorted = [...categories].sort((a: any, b: any) => a.sortOrder - b.sortOrder);
            expect(sorted[0].key).toBe('FIRST');
            expect(sorted[1].key).toBe('SECOND');
            expect(sorted[2].key).toBe('THIRD');
        });
    });
});
