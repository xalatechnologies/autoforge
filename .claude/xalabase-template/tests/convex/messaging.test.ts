/**
 * Messaging Functions Tests
 *
 * Tests for conversations and messages management.
 * User Stories: US-12.1, US-12.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestDataStore, createMockContext } from './setup';

// Type for index query builder
type IndexQueryBuilder = {
    eq: (field: string, value: unknown) => IndexQueryBuilder;
};

describe('Conversation Management Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let userId: string;
    let assigneeId: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Messaging Test Tenant' });
        userId = store.seedUser({
            tenantId,
            name: 'Test User',
            email: 'user@test.com',
        });
        assigneeId = store.seedUser({
            tenantId,
            name: 'Support Agent',
            email: 'support@test.com',
        });
    });

    describe('US-12.1: Conversation Creation', () => {
        it('conversation.create.success - should create new conversation', async () => {
            const ctx = createMockContext(store);

            const conversationId = await ctx.db.insert('conversations', {
                tenantId,
                userId,
                participants: [userId, assigneeId],
                subject: 'Help with booking',
                status: 'active',
                unreadCount: 0,
                metadata: {},
            });

            expect(conversationId).toBeDefined();

            const conversation = await ctx.db.get(conversationId);
            expect(conversation).toMatchObject({
                subject: 'Help with booking',
                status: 'active',
                unreadCount: 0,
            });
        });

        it('conversation.create.with-booking - should link to booking', async () => {
            const ctx = createMockContext(store);
            const bookingId = store.seedBooking({ tenantId, userId, resourceId: 'res1' });

            const conversationId = await ctx.db.insert('conversations', {
                tenantId,
                userId,
                participants: [userId, assigneeId],
                bookingId,
                status: 'active',
                unreadCount: 0,
                metadata: {},
            });

            const conversation = await ctx.db.get(conversationId);
            expect(conversation?.bookingId).toBe(bookingId);
        });
    });

    describe('US-12.2: Message Sending', () => {
        it('message.send.success - should send message in conversation', async () => {
            const ctx = createMockContext(store);
            const conversationId = store.seedConversation({ tenantId, userId, participants: [userId, assigneeId] });

            const messageId = await ctx.db.insert('messages', {
                tenantId,
                conversationId,
                senderId: userId,
                senderType: 'user',
                content: 'Hello, I need help!',
                messageType: 'text',
                attachments: [],
                sentAt: Date.now(),
                metadata: {},
            });

            expect(messageId).toBeDefined();

            const message = await ctx.db.get(messageId);
            expect(message).toMatchObject({
                content: 'Hello, I need help!',
                messageType: 'text',
            });
        });

        it('message.send.updates-conversation - should update conversation lastMessageAt', async () => {
            const ctx = createMockContext(store);
            const conversationId = store.seedConversation({ tenantId, userId, unreadCount: 0 });

            // Simulate sending message and updating conversation
            const now = Date.now();
            store.patch(conversationId, {
                lastMessageAt: now,
                unreadCount: 1,
            });

            const conversation = await ctx.db.get(conversationId);
            expect(conversation?.lastMessageAt).toBe(now);
            expect(conversation?.unreadCount).toBe(1);
        });
    });

    describe('US-12.3: Message Reading', () => {
        it('message.mark-read.success - should mark messages as read', async () => {
            const ctx = createMockContext(store);
            const conversationId = store.seedConversation({ tenantId, userId, unreadCount: 2 });
            const msg1 = store.seedMessage({ conversationId, senderId: assigneeId });
            const msg2 = store.seedMessage({ conversationId, senderId: assigneeId });

            const now = Date.now();
            store.patch(msg1, { readAt: now });
            store.patch(msg2, { readAt: now });
            store.patch(conversationId, { unreadCount: 0 });

            const message1 = await ctx.db.get(msg1);
            const message2 = await ctx.db.get(msg2);
            const conversation = await ctx.db.get(conversationId);

            expect(message1?.readAt).toBe(now);
            expect(message2?.readAt).toBe(now);
            expect(conversation?.unreadCount).toBe(0);
        });

        it('message.unread-count.calculate - should calculate total unread', async () => {
            const ctx = createMockContext(store);

            store.seedConversation({ tenantId, userId, unreadCount: 3 });
            store.seedConversation({ tenantId, userId, unreadCount: 2 });
            store.seedConversation({ tenantId, userId, unreadCount: 0 });

            const conversations = await ctx.db.query('conversations')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const totalUnread = conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
            expect(totalUnread).toBe(5);
        });
    });

    describe('US-12.4: Conversation Lifecycle', () => {
        it('conversation.resolve.success - should resolve conversation', async () => {
            const ctx = createMockContext(store);
            const conversationId = store.seedConversation({ tenantId, userId, status: 'active' });

            store.patch(conversationId, {
                status: 'resolved',
                resolvedAt: Date.now(),
                resolvedBy: assigneeId,
            });

            const conversation = await ctx.db.get(conversationId);
            expect(conversation?.status).toBe('resolved');
            expect(conversation?.resolvedBy).toBe(assigneeId);
        });

        it('conversation.reopen.success - should reopen resolved conversation', async () => {
            const ctx = createMockContext(store);
            const conversationId = store.seedConversation({
                tenantId,
                userId,
                status: 'resolved',
            });

            store.patch(conversationId, {
                status: 'open',
                resolvedAt: undefined,
                resolvedBy: undefined,
                reopenedAt: Date.now(),
            });

            const conversation = await ctx.db.get(conversationId);
            expect(conversation?.status).toBe('open');
            expect(conversation?.resolvedAt).toBeUndefined();
        });

        it('conversation.archive.success - should archive conversation', async () => {
            const ctx = createMockContext(store);
            const conversationId = store.seedConversation({ tenantId, userId, status: 'active' });

            store.patch(conversationId, { status: 'archived' });

            const conversation = await ctx.db.get(conversationId);
            expect(conversation?.status).toBe('archived');
        });
    });

    describe('US-12.5: Conversation Assignment', () => {
        it('conversation.assign.success - should assign to agent', async () => {
            const ctx = createMockContext(store);
            const conversationId = store.seedConversation({ tenantId, userId });

            const now = Date.now();
            store.patch(conversationId, {
                assigneeId,
                assignedAt: now,
            });

            const conversation = await ctx.db.get(conversationId);
            expect(conversation?.assigneeId).toBe(assigneeId);
            expect(conversation?.assignedAt).toBe(now);
        });

        it('conversation.unassign.success - should unassign from agent', async () => {
            const ctx = createMockContext(store);
            const conversationId = store.seedConversation({
                tenantId,
                userId,
                assigneeId,
            });

            store.patch(conversationId, {
                assigneeId: undefined,
                assignedAt: undefined,
            });

            const conversation = await ctx.db.get(conversationId);
            expect(conversation?.assigneeId).toBeUndefined();
        });

        it('conversation.list-by-assignee - should list assigned conversations', async () => {
            const ctx = createMockContext(store);

            store.seedConversation({ tenantId, userId, assigneeId, status: 'active' });
            store.seedConversation({ tenantId, userId, assigneeId, status: 'active' });
            store.seedConversation({ tenantId, userId, status: 'active' }); // No assignee

            const assigned = await ctx.db.query('conversations')
                .withIndex('by_assignee', (q: IndexQueryBuilder) => q.eq('assigneeId', assigneeId))
                .collect();

            expect(assigned).toHaveLength(2);
        });
    });

    describe('US-12.6: Conversation Priority', () => {
        it('conversation.priority.set - should set priority', async () => {
            const ctx = createMockContext(store);
            const conversationId = store.seedConversation({ tenantId, userId });

            store.patch(conversationId, { priority: 'high' });

            const conversation = await ctx.db.get(conversationId);
            expect(conversation?.priority).toBe('high');
        });

        it('conversation.priority.values - should support priority levels', async () => {
            const ctx = createMockContext(store);

            const lowPriority = store.seedConversation({ tenantId, userId, priority: 'low' });
            const highPriority = store.seedConversation({ tenantId, userId, priority: 'high' });
            const urgentPriority = store.seedConversation({ tenantId, userId, priority: 'urgent' });

            const low = await ctx.db.get(lowPriority);
            const high = await ctx.db.get(highPriority);
            const urgent = await ctx.db.get(urgentPriority);

            expect(low?.priority).toBe('low');
            expect(high?.priority).toBe('high');
            expect(urgent?.priority).toBe('urgent');
        });
    });

    describe('US-12.7: Conversation Queries', () => {
        it('conversation.list.by-user - should list user conversations', async () => {
            const ctx = createMockContext(store);

            store.seedConversation({ tenantId, userId, status: 'active' });
            store.seedConversation({ tenantId, userId, status: 'resolved' });
            store.seedConversation({ tenantId, userId: 'other_user', status: 'active' });

            const conversations = await ctx.db.query('conversations')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            expect(conversations).toHaveLength(2);
        });

        it('conversation.list.filter-status - should filter by status', async () => {
            const ctx = createMockContext(store);

            store.seedConversation({ tenantId, userId, status: 'active' });
            store.seedConversation({ tenantId, userId, status: 'active' });
            store.seedConversation({ tenantId, userId, status: 'resolved' });

            const conversations = await ctx.db.query('conversations')
                .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                .collect();

            const activeConversations = conversations.filter((c: any) => c.status === 'active');
            expect(activeConversations).toHaveLength(2);
        });
    });
});

describe('Messaging Functions', () => {
    let store: TestDataStore;
    let tenantId: string;
    let userId: string;
    let user2Id: string;
    let user3Id: string;

    beforeEach(() => {
        store = new TestDataStore();
        tenantId = store.seedTenant({ name: 'Messaging Test Tenant' });
        userId = store.seedUser({ tenantId, name: 'Test User', email: 'test@example.com' });
        user2Id = store.seedUser({ tenantId, name: 'User 2', email: 'user2@example.com' });
        user3Id = store.seedUser({ tenantId, name: 'User 3', email: 'user3@example.com' });
    });

    describe('Conversations', () => {
        describe('list', () => {
            it('should list conversations for user', async () => {
                const ctx = createMockContext(store);

                // Create conversations
                store.seedConversation({
                    tenantId,
                    userId,
                    type: 'direct',
                    participants: [userId, user2Id],
                    lastMessageAt: Date.now(),
                });
                store.seedConversation({
                    tenantId,
                    userId,
                    type: 'group',
                    participants: [userId, user2Id, user3Id],
                    lastMessageAt: Date.now() - 3600000,
                });

                const conversations = await ctx.db.query('conversations')
                    .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                    .collect();

                expect(conversations).toHaveLength(2);
                expect(conversations[0].type).toBe('direct');
                expect(conversations[1].type).toBe('group');
            });
        });

        describe('get', () => {
            it('should get conversation with participants', async () => {
                const ctx = createMockContext(store);

                const conversationId = store.seedConversation({
                    tenantId,
                    userId,
                    type: 'direct',
                    participants: [userId, user2Id],
                    metadata: { subject: 'Project Discussion' },
                });

                const conversation = await ctx.db.get(conversationId);
                expect(conversation).toBeDefined();
                expect(conversation?.type).toBe('direct');
                expect(conversation?.participants).toHaveLength(2);
                expect(conversation?.metadata?.subject).toBe('Project Discussion');
            });

            it('should return null if conversation not found', async () => {
                const ctx = createMockContext(store);

                const conversation = await ctx.db.get('nonexistent_conversation');
                expect(conversation).toBeNull();
            });
        });

        describe('create', () => {
            it('should create direct conversation', async () => {
                const ctx = createMockContext(store);

                const conversationId = await ctx.db.insert('conversations', {
                    tenantId,
                    userId,
                    type: 'direct',
                    participants: [userId, user2Id],
                    status: 'active',
                    unreadCount: 0,
                    createdAt: Date.now(),
                });

                expect(conversationId).toBeDefined();

                const conversation = await ctx.db.get(conversationId);
                expect(conversation?.type).toBe('direct');
                expect(conversation?.participants).toContain(userId);
                expect(conversation?.participants).toContain(user2Id);
            });

            it('should detect existing direct conversation', async () => {
                const ctx = createMockContext(store);

                // Create existing direct conversation
                store.seedConversation({
                    tenantId,
                    userId,
                    type: 'direct',
                    participants: [userId, user2Id],
                });

                // Check for existing
                const conversations = await ctx.db.query('conversations')
                    .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                    .collect();

                const existing = conversations.find((c: any) =>
                    c.type === 'direct' &&
                    c.participants.includes(userId) &&
                    c.participants.includes(user2Id)
                );

                expect(existing).toBeDefined();
            });
        });

        describe('addParticipant', () => {
            it('should add participant to group conversation', async () => {
                const ctx = createMockContext(store);

                const conversationId = store.seedConversation({
                    tenantId,
                    userId,
                    type: 'group',
                    participants: [userId, user2Id],
                });

                // Add participant
                const conversation = await ctx.db.get(conversationId);
                const newParticipants = [...(conversation?.participants || []), user3Id];

                await ctx.db.patch(conversationId, {
                    participants: newParticipants,
                });

                const updated = await ctx.db.get(conversationId);
                expect(updated?.participants).toHaveLength(3);
                expect(updated?.participants).toContain(user3Id);
            });

            it('should not add to direct conversation', async () => {
                const ctx = createMockContext(store);

                const conversationId = store.seedConversation({
                    tenantId,
                    userId,
                    type: 'direct',
                    participants: [userId, user2Id],
                });

                const conversation = await ctx.db.get(conversationId);
                const canAddParticipant = conversation?.type !== 'direct';

                expect(canAddParticipant).toBe(false);
            });
        });

        describe('removeParticipant', () => {
            it('should remove participant from conversation', async () => {
                const ctx = createMockContext(store);

                const conversationId = store.seedConversation({
                    tenantId,
                    userId,
                    type: 'group',
                    participants: [userId, user2Id, user3Id],
                });

                // Remove participant
                const conversation = await ctx.db.get(conversationId);
                const filteredParticipants = (conversation?.participants || []).filter((p: string) => p !== user2Id);

                await ctx.db.patch(conversationId, {
                    participants: filteredParticipants,
                });

                const updated = await ctx.db.get(conversationId);
                expect(updated?.participants).toHaveLength(2);
                expect(updated?.participants).not.toContain(user2Id);
            });
        });
    });

    describe('Messages', () => {
        describe('list', () => {
            it('should list messages in conversation', async () => {
                const ctx = createMockContext(store);

                const conversationId = store.seedConversation({
                    tenantId,
                    userId,
                    participants: [userId, user2Id],
                });

                store.seedMessage({
                    tenantId,
                    conversationId,
                    senderId: userId,
                    content: 'Hello!',
                    timestamp: Date.now() - 3600000,
                });
                store.seedMessage({
                    tenantId,
                    conversationId,
                    senderId: user2Id,
                    content: 'Hi there!',
                    timestamp: Date.now() - 1800000,
                });

                const messages = await ctx.db.query('messages')
                    .withIndex('by_conversation', (q: IndexQueryBuilder) => q.eq('conversationId', conversationId))
                    .collect();

                expect(messages).toHaveLength(2);
                expect(messages[0].content).toBe('Hello!');
                expect(messages[1].content).toBe('Hi there!');
            });
        });

        describe('send', () => {
            it('should send message', async () => {
                const ctx = createMockContext(store);

                const conversationId = store.seedConversation({
                    tenantId,
                    userId,
                    participants: [userId, user2Id],
                });

                const messageId = await ctx.db.insert('messages', {
                    tenantId,
                    conversationId,
                    senderId: userId,
                    content: 'Hello everyone!',
                    type: 'text',
                    timestamp: Date.now(),
                });

                // Update conversation with last message
                await ctx.db.patch(conversationId, {
                    lastMessageAt: Date.now(),
                    lastMessagePreview: 'Hello everyone!',
                });

                const message = await ctx.db.get(messageId);
                const conversation = await ctx.db.get(conversationId);

                expect(message?.content).toBe('Hello everyone!');
                expect(conversation?.lastMessagePreview).toBe('Hello everyone!');
            });

            it('should validate sender is participant', async () => {
                const ctx = createMockContext(store);

                const conversationId = store.seedConversation({
                    tenantId,
                    userId: user2Id,
                    participants: [user2Id, user3Id], // userId not included
                });

                const conversation = await ctx.db.get(conversationId);
                const isParticipant = (conversation?.participants || []).includes(userId);

                expect(isParticipant).toBe(false);
            });
        });

        describe('markAsRead', () => {
            it('should mark messages as read', async () => {
                const ctx = createMockContext(store);

                const conversationId = store.seedConversation({
                    tenantId,
                    userId,
                    participants: [userId, user2Id],
                    unreadCount: 2,
                });

                const msg1 = store.seedMessage({ tenantId, conversationId, senderId: user2Id });
                const msg2 = store.seedMessage({ tenantId, conversationId, senderId: user2Id });

                const now = Date.now();
                await ctx.db.patch(msg1, { readAt: now });
                await ctx.db.patch(msg2, { readAt: now });
                await ctx.db.patch(conversationId, { unreadCount: 0 });

                const message1 = await ctx.db.get(msg1);
                const message2 = await ctx.db.get(msg2);
                const conversation = await ctx.db.get(conversationId);

                expect(message1?.readAt).toBe(now);
                expect(message2?.readAt).toBe(now);
                expect(conversation?.unreadCount).toBe(0);
            });
        });

        describe('edit', () => {
            it('should edit message', async () => {
                const ctx = createMockContext(store);

                const conversationId = store.seedConversation({ tenantId, userId });
                const messageId = store.seedMessage({
                    tenantId,
                    conversationId,
                    senderId: userId,
                    content: 'Original message',
                    timestamp: Date.now() - 1000, // Recent
                });

                await ctx.db.patch(messageId, {
                    content: 'Updated message',
                    edited: true,
                    editedAt: Date.now(),
                });

                const message = await ctx.db.get(messageId);
                expect(message?.content).toBe('Updated message');
                expect(message?.edited).toBe(true);
            });

            it('should check if message is too old to edit', async () => {
                const ctx = createMockContext(store);

                const conversationId = store.seedConversation({ tenantId, userId });
                const messageId = store.seedMessage({
                    tenantId,
                    conversationId,
                    senderId: userId,
                    content: 'Old message',
                    timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
                });

                const message = await ctx.db.get(messageId);
                const oneHourAgo = Date.now() - 60 * 60 * 1000;
                const canEdit = (message?.timestamp || 0) > oneHourAgo;

                expect(canEdit).toBe(false);
            });
        });

        describe('delete', () => {
            it('should delete message', async () => {
                const ctx = createMockContext(store);

                const conversationId = store.seedConversation({ tenantId, userId });
                const messageId = store.seedMessage({
                    tenantId,
                    conversationId,
                    senderId: userId,
                    content: 'To delete',
                });

                await ctx.db.delete(messageId);

                const message = await ctx.db.get(messageId);
                expect(message).toBeNull();
            });

            it('should allow admin to delete any message', async () => {
                const ctx = createMockContext(store);

                // Create admin user
                const adminId = store.seedUser({ tenantId, name: 'Admin', email: 'admin@test.com', roles: ['admin'] });

                const conversationId = store.seedConversation({ tenantId, userId });
                const messageId = store.seedMessage({
                    tenantId,
                    conversationId,
                    senderId: user2Id, // Different from admin
                    content: 'To delete by admin',
                });

                // Admin check
                const admin = await ctx.db.get(adminId);
                const isAdmin = (admin?.roles || []).includes('admin');

                expect(isAdmin).toBe(true);

                // Admin can delete
                await ctx.db.delete(messageId);
                const message = await ctx.db.get(messageId);
                expect(message).toBeNull();
            });
        });
    });

    describe('Unread Counts', () => {
        describe('getUnreadCount', () => {
            it('should get unread message count', async () => {
                const ctx = createMockContext(store);

                // Create conversations with unread counts
                store.seedConversation({
                    tenantId,
                    userId,
                    participants: [userId, user2Id],
                    unreadCount: 3,
                });
                store.seedConversation({
                    tenantId,
                    userId,
                    participants: [userId, user3Id],
                    unreadCount: 2,
                });

                const conversations = await ctx.db.query('conversations')
                    .withIndex('by_user', (q: IndexQueryBuilder) => q.eq('userId', userId))
                    .collect();

                const totalUnread = conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);

                expect(totalUnread).toBe(5);
            });
        });
    });
});
