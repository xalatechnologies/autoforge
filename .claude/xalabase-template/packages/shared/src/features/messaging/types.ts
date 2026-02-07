/**
 * Messaging Domain Types
 */

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    attachments?: MessageAttachment[];
    readAt?: string;
    sentAt: string;
}

export interface MessageAttachment {
    id: string;
    type: 'image' | 'file' | 'link';
    url: string;
    name?: string;
    size?: number;
}

export interface Conversation {
    id: string;
    tenantId: string;
    participants: ConversationParticipant[];
    subject?: string;
    lastMessage?: Message;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationParticipant {
    userId: string;
    name: string;
    avatarUrl?: string;
    role: 'owner' | 'guest' | 'admin';
}

export interface MessageFilters {
    conversationId?: string;
    senderId?: string;
    unreadOnly?: boolean;
}
