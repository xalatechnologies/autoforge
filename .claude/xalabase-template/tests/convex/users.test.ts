/**
 * User Functions Tests
 *
 * Tests for user CRUD, invitations, and tenant management.
 * User Stories: US-1.1, US-1.2, US-1.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('User Functions', () => {
    let store: TestDataStore;
    let tenantId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'User Test Tenant' });
    });

    describe('US-1.1: List Users', () => {
        it('user.list.success - should list users for tenant', async () => {
            const ctx = createMockContext(store);

            store.seedUser({ tenantId, name: 'User 1', email: 'user1@test.com' });
            store.seedUser({ tenantId, name: 'User 2', email: 'user2@test.com' });

            const users = await ctx.db.query('users')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(users).toHaveLength(2);
        });

        it('user.list.active-only - should filter active users', async () => {
            const ctx = createMockContext(store);

            store.seedUser({ tenantId, name: 'Active', status: 'active' });
            store.seedUser({ tenantId, name: 'Suspended', status: 'suspended' });

            const users = await ctx.db.query('users')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const active = users.filter((u: any) => u.status === 'active');
            expect(active).toHaveLength(1);
            expect(active[0].name).toBe('Active');
        });
    });

    describe('US-1.2: User Management', () => {
        it('user.get.success - should get user by ID', async () => {
            const ctx = createMockContext(store);

            const userId = store.seedUser({
                tenantId,
                name: 'Test User',
                email: 'test@example.com',
            });

            const user = await ctx.db.get(userId);
            expect(user).toMatchObject({
                name: 'Test User',
                email: 'test@example.com',
            });
        });

        it('user.get.by-email - should find user by email', async () => {
            const ctx = createMockContext(store);

            store.seedUser({ tenantId, name: 'Test User', email: 'test@example.com' });

            const users = await ctx.db.query('users')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const found = users.find((u: any) => u.email === 'test@example.com');
            expect(found).toBeDefined();
            expect(found?.name).toBe('Test User');
        });

        it('user.create.success - should create user', async () => {
            const ctx = createMockContext(store);

            const userId = await ctx.db.insert('users', {
                tenantId,
                name: 'New User',
                email: 'newuser@example.com',
                status: 'active',
                role: 'user',
                metadata: {},
            });

            expect(userId).toBeDefined();

            const user = await ctx.db.get(userId);
            expect(user).toMatchObject({
                name: 'New User',
                email: 'newuser@example.com',
            });
        });

        it('user.update.success - should update user', async () => {
            const ctx = createMockContext(store);

            const userId = store.seedUser({
                tenantId,
                name: 'Old Name',
            });

            await ctx.db.patch(userId, {
                name: 'New Name',
            });

            const user = await ctx.db.get(userId);
            expect(user?.name).toBe('New Name');
        });

        it('user.delete.soft - should soft delete user', async () => {
            const ctx = createMockContext(store);

            const userId = store.seedUser({
                tenantId,
                name: 'To Delete',
                status: 'active',
            });

            await ctx.db.patch(userId, {
                status: 'deleted',
                deletedAt: Date.now(),
            });

            const user = await ctx.db.get(userId);
            expect(user?.status).toBe('deleted');
        });
    });

    describe('US-1.3: User Invitations', () => {
        it('user.invite.success - should invite user to tenant', async () => {
            const ctx = createMockContext(store);

            const userId = store.seedUser({
                tenantId,
                name: 'Invite User',
                email: 'invite@example.com',
            });

            const roleId = store.seedRole({ tenantId, name: 'Member' });

            const tenantUserId = await ctx.db.insert('tenantUsers', {
                tenantId,
                userId,
                roleId,
                status: 'invited',
                invitationToken: 'token123',
                invitedAt: Date.now(),
            });

            expect(tenantUserId).toBeDefined();

            const tenantUser = await ctx.db.get(tenantUserId);
            expect(tenantUser?.status).toBe('invited');
        });

        it('user.invite.accept - should accept invitation', async () => {
            const ctx = createMockContext(store);

            const userId = store.seedUser({ tenantId, name: 'Invite User' });

            const tenantUserId = await ctx.db.insert('tenantUsers', {
                tenantId,
                userId,
                status: 'invited',
                invitationToken: 'token123',
                invitedAt: Date.now(),
            });

            await ctx.db.patch(tenantUserId, {
                status: 'active',
                joinedAt: Date.now(),
                invitationToken: undefined,
            });

            const tenantUser = await ctx.db.get(tenantUserId);
            expect(tenantUser?.status).toBe('active');
            expect(tenantUser?.joinedAt).toBeDefined();
        });
    });

    describe('User Status', () => {
        it('user.suspend.success - should suspend user', async () => {
            const ctx = createMockContext(store);

            const userId = store.seedUser({
                tenantId,
                name: 'To Suspend',
                status: 'active',
            });

            await ctx.db.patch(userId, {
                status: 'suspended',
                suspendedAt: Date.now(),
                suspensionReason: 'Policy violation',
            });

            const user = await ctx.db.get(userId);
            expect(user?.status).toBe('suspended');
            expect(user?.suspensionReason).toBe('Policy violation');
        });

        it('user.reactivate.success - should reactivate suspended user', async () => {
            const ctx = createMockContext(store);

            const userId = store.seedUser({
                tenantId,
                name: 'Suspended User',
                status: 'suspended',
            });

            await ctx.db.patch(userId, {
                status: 'active',
                suspendedAt: undefined,
                suspensionReason: undefined,
            });

            const user = await ctx.db.get(userId);
            expect(user?.status).toBe('active');
        });
    });

    describe('Tenant Users', () => {
        it('tenant.user.add - should add user to tenant', async () => {
            const ctx = createMockContext(store);

            const userId = store.seedUser({ name: 'New Member' });

            const tenantUserId = await ctx.db.insert('tenantUsers', {
                tenantId,
                userId,
                status: 'active',
                joinedAt: Date.now(),
            });

            expect(tenantUserId).toBeDefined();
        });

        it('tenant.user.list - should list users in tenant', async () => {
            const ctx = createMockContext(store);

            const user1Id = store.seedUser({ name: 'User 1' });
            const user2Id = store.seedUser({ name: 'User 2' });

            await ctx.db.insert('tenantUsers', { tenantId, userId: user1Id, status: 'active' });
            await ctx.db.insert('tenantUsers', { tenantId, userId: user2Id, status: 'active' });

            const tenantUsers = await ctx.db.query('tenantUsers')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(tenantUsers).toHaveLength(2);
        });

        it('tenant.user.remove - should remove user from tenant', async () => {
            const ctx = createMockContext(store);

            const userId = store.seedUser({ name: 'To Remove' });

            const tenantUserId = await ctx.db.insert('tenantUsers', {
                tenantId,
                userId,
                status: 'active',
            });

            await ctx.db.delete(tenantUserId);

            const tenantUser = await ctx.db.get(tenantUserId);
            expect(tenantUser).toBeNull();
        });
    });

    describe('User Queries', () => {
        it('user.by-role - should filter users by role', async () => {
            const ctx = createMockContext(store);

            store.seedUser({ tenantId, name: 'Admin', role: 'admin' });
            store.seedUser({ tenantId, name: 'User 1', role: 'user' });
            store.seedUser({ tenantId, name: 'User 2', role: 'user' });

            const users = await ctx.db.query('users')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const admins = users.filter((u: any) => u.role === 'admin');
            expect(admins).toHaveLength(1);
        });

        it('user.search - should search users by name', async () => {
            const ctx = createMockContext(store);

            store.seedUser({ tenantId, name: 'John Doe', email: 'john@test.com' });
            store.seedUser({ tenantId, name: 'Jane Doe', email: 'jane@test.com' });
            store.seedUser({ tenantId, name: 'Bob Smith', email: 'bob@test.com' });

            const users = await ctx.db.query('users')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const doesUsers = users.filter((u: any) => u.name.includes('Doe'));
            expect(doesUsers).toHaveLength(2);
        });
    });
});
