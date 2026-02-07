/**
 * RBAC Functions Tests
 *
 * Tests for role-based access control.
 * User Stories: US-15.1, US-15.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('RBAC Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let userId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'RBAC Test Tenant' });
        userId = store.seedUser({ tenantId, name: 'Test User' });
    });

    describe('US-15.1: Role Management', () => {
        it('role.list.success - should list roles for tenant', async () => {
            const ctx = createMockContext(store);

            store.seedRole({ tenantId, name: 'Admin', permissions: ['*'] });
            store.seedRole({ tenantId, name: 'Resource Manager', permissions: ['resource:read', 'resource:write'] });

            const roles = await ctx.db.query('roles')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            expect(roles).toHaveLength(2);
        });

        it('role.get.success - should get role by ID', async () => {
            const ctx = createMockContext(store);

            const roleId = store.seedRole({
                tenantId,
                name: 'Admin',
                permissions: ['*'],
                description: 'Full access',
            });

            const role = await ctx.db.get(roleId);
            expect(role).toMatchObject({
                name: 'Admin',
                permissions: ['*'],
            });
        });

        it('role.create.success - should create role', async () => {
            const ctx = createMockContext(store);

            const roleId = await ctx.db.insert('roles', {
                tenantId,
                name: 'Custom Role',
                description: 'A custom role for testing',
                permissions: ['booking:read', 'booking:write'],
                isDefault: false,
                isSystem: false,
            });

            expect(roleId).toBeDefined();

            const role = await ctx.db.get(roleId);
            expect(role).toMatchObject({
                name: 'Custom Role',
                permissions: ['booking:read', 'booking:write'],
            });
        });

        it('role.update.success - should update role', async () => {
            const ctx = createMockContext(store);

            const roleId = store.seedRole({
                tenantId,
                name: 'Old Name',
                permissions: ['booking:read'],
            });

            await ctx.db.patch(roleId, {
                name: 'Updated Name',
                permissions: ['booking:read', 'booking:write'],
            });

            const role = await ctx.db.get(roleId);
            expect(role?.name).toBe('Updated Name');
            expect(role?.permissions).toContain('booking:write');
        });

        it('role.delete.success - should delete role', async () => {
            const ctx = createMockContext(store);

            const roleId = store.seedRole({
                tenantId,
                name: 'To Delete',
                isSystem: false,
            });

            await ctx.db.delete(roleId);

            const role = await ctx.db.get(roleId);
            expect(role).toBeNull();
        });
    });

    describe('US-15.2: User Role Assignment', () => {
        it('userRole.assign.success - should assign role to user', async () => {
            const ctx = createMockContext(store);

            const roleId = store.seedRole({ tenantId, name: 'Resource Manager' });

            const userRoleId = await ctx.db.insert('userRoles', {
                tenantId,
                userId,
                roleId,
                assignedAt: Date.now(),
            });

            expect(userRoleId).toBeDefined();

            const userRole = await ctx.db.get(userRoleId);
            expect(userRole).toMatchObject({
                userId,
                roleId,
            });
        });

        it('userRole.list.success - should list user roles', async () => {
            const ctx = createMockContext(store);

            const role1 = store.seedRole({ tenantId, name: 'Role 1' });
            const role2 = store.seedRole({ tenantId, name: 'Role 2' });

            await ctx.db.insert('userRoles', { tenantId, userId, roleId: role1, assignedAt: Date.now() });
            await ctx.db.insert('userRoles', { tenantId, userId, roleId: role2, assignedAt: Date.now() });

            const userRoles = await ctx.db.query('userRoles')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            expect(userRoles).toHaveLength(2);
        });

        it('userRole.remove.success - should remove role from user', async () => {
            const ctx = createMockContext(store);

            const roleId = store.seedRole({ tenantId, name: 'Resource Manager' });

            const userRoleId = await ctx.db.insert('userRoles', {
                tenantId,
                userId,
                roleId,
                assignedAt: Date.now(),
            });

            await ctx.db.delete(userRoleId);

            const userRole = await ctx.db.get(userRoleId);
            expect(userRole).toBeNull();
        });
    });

    describe('Permission Checks', () => {
        it('permission.check.wildcard - should match wildcard permission', async () => {
            const ctx = createMockContext(store);

            const roleId = store.seedRole({
                tenantId,
                name: 'Admin',
                permissions: ['*'],
            });

            await ctx.db.insert('userRoles', { tenantId, userId, roleId, assignedAt: Date.now() });

            const userRoles = await ctx.db.query('userRoles')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const role = await ctx.db.get(userRoles[0].roleId);
            const hasWildcard = role?.permissions?.includes('*');
            expect(hasWildcard).toBe(true);
        });

        it('permission.check.specific - should match specific permission', async () => {
            const ctx = createMockContext(store);

            const roleId = store.seedRole({
                tenantId,
                name: 'Resource Manager',
                permissions: ['resource:read', 'resource:write'],
            });

            await ctx.db.insert('userRoles', { tenantId, userId, roleId, assignedAt: Date.now() });

            const userRoles = await ctx.db.query('userRoles')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const role = await ctx.db.get(userRoles[0].roleId);
            const hasPermission = role?.permissions?.includes('resource:read');
            expect(hasPermission).toBe(true);
        });

        it('permission.aggregate.success - should aggregate user permissions', async () => {
            const ctx = createMockContext(store);

            const role1 = store.seedRole({ tenantId, name: 'Role 1', permissions: ['resource:read', 'resource:write'] });
            const role2 = store.seedRole({ tenantId, name: 'Role 2', permissions: ['booking:read', 'booking:write'] });

            await ctx.db.insert('userRoles', { tenantId, userId, roleId: role1, assignedAt: Date.now() });
            await ctx.db.insert('userRoles', { tenantId, userId, roleId: role2, assignedAt: Date.now() });

            const userRoles = await ctx.db.query('userRoles')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const allPermissions: string[] = [];
            for (const ur of userRoles) {
                const role = await ctx.db.get(ur.roleId);
                if (role?.permissions) {
                    allPermissions.push(...(role.permissions as string[]));
                }
            }

            expect(allPermissions).toContain('resource:read');
            expect(allPermissions).toContain('booking:write');
        });

        it('permission.deduplicate.success - should deduplicate permissions', async () => {
            const ctx = createMockContext(store);

            const role1 = store.seedRole({ tenantId, name: 'Role 1', permissions: ['resource:read', 'booking:read'] });
            const role2 = store.seedRole({ tenantId, name: 'Role 2', permissions: ['resource:read', 'booking:write'] });

            await ctx.db.insert('userRoles', { tenantId, userId, roleId: role1, assignedAt: Date.now() });
            await ctx.db.insert('userRoles', { tenantId, userId, roleId: role2, assignedAt: Date.now() });

            const userRoles = await ctx.db.query('userRoles')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const allPermissions: Set<string> = new Set();
            for (const ur of userRoles) {
                const role = await ctx.db.get(ur.roleId);
                if (role?.permissions) {
                    (role.permissions as string[]).forEach((p: string) => allPermissions.add(p));
                }
            }

            expect(allPermissions.size).toBe(3); // resource:read, booking:read, booking:write
        });
    });

    describe('Role Queries', () => {
        it('role.system-only - should filter system roles', async () => {
            const ctx = createMockContext(store);

            store.seedRole({ tenantId, name: 'System Role', isSystem: true });
            store.seedRole({ tenantId, name: 'Custom Role', isSystem: false });

            const roles = await ctx.db.query('roles')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const systemRoles = roles.filter((r: any) => r.isSystem);
            expect(systemRoles).toHaveLength(1);
            expect(systemRoles[0].name).toBe('System Role');
        });

        it('role.default-only - should filter default roles', async () => {
            const ctx = createMockContext(store);

            store.seedRole({ tenantId, name: 'Default Role', isDefault: true });
            store.seedRole({ tenantId, name: 'Other Role', isDefault: false });

            const roles = await ctx.db.query('roles')
                .withIndex('by_tenant', (q: IndexQueryBuilder) => q.eq('tenantId', tenantId))
                .collect();

            const defaultRoles = roles.filter((r: any) => r.isDefault);
            expect(defaultRoles).toHaveLength(1);
            expect(defaultRoles[0].name).toBe('Default Role');
        });
    });
});
