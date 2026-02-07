/**
 * Convex Test Setup
 *
 * Utilities for testing Convex backend functions.
 * Uses convex-test for unit testing Convex queries and mutations.
 */

import { vi } from 'vitest';

// Mock Convex context for testing
export interface MockConvexContext {
    db: MockDatabase;
    auth: MockAuth;
}

export interface MockDatabase {
    get: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
}

export interface MockAuth {
    getUserIdentity: ReturnType<typeof vi.fn>;
}

// In-memory data store for tests
export class TestDataStore {
    private data: Map<string, Map<string, unknown>> = new Map();
    private idCounter = 0;

    constructor() {
        this.reset();
    }

    reset(): void {
        this.data = new Map();
        this.idCounter = 0;
        // Initialize tables
        const tables = [
            'tenants',
            'users',
            'organizations',
            'resources',
            'bookings',
            'roles',
            'userRoles',
            'tenantUsers',
            'bookingAudit',
            'blocks',
            'payments',
            'oauthStates',
            'sessions',
            'additionalServices',
            'pricingGroups',
            'resourcePricing',
            'amenityGroups',
            'amenities',
            'addons',
            'invoices',
            'conversations',
            'messages',
            'notifications',
            'notificationPreferences',
            'integrations',
            'webhooks',
            'webhookEvents',
            'integrationSyncs',
            'categories',
            'auditLog',
            'seasons',
            'seasonalPricing',
            'bookingMetrics',
            'availabilityMetrics',
            'scheduledReports',
            'favorites',
            'modules',
            'tenantModules',
            'resourceAmenities',
            'resourceAddons',
            'bookingAddons',
            'seasonApplications',
            'allocations',
            'seasonalLeases',
            'consentRecords',
            'dsarRequests',
            'policies',
            'accessLogs',
            'userPricingGroups',
            'subscriptions',
            'customers',
            'refunds',
        ];
        tables.forEach((t) => this.data.set(t, new Map()));
    }

    generateId(table: string): string {
        return `${table}_${++this.idCounter}`;
    }

    insert(table: string, doc: Record<string, unknown>): string {
        const id = this.generateId(table);
        const tableData = this.data.get(table);
        if (!tableData) throw new Error(`Table ${table} not found`);

        tableData.set(id, {
            _id: id,
            _creationTime: Date.now(),
            ...doc,
        });
        return id;
    }

    get(id: string): unknown | null {
        for (const tableData of this.data.values()) {
            if (tableData.has(id)) {
                return tableData.get(id);
            }
        }
        return null;
    }

    patch(id: string, updates: Record<string, unknown>): void {
        for (const tableData of this.data.values()) {
            if (tableData.has(id)) {
                const existing = tableData.get(id) as Record<string, unknown>;
                tableData.set(id, { ...existing, ...updates });
                return;
            }
        }
        throw new Error(`Document ${id} not found`);
    }

    delete(id: string): void {
        for (const tableData of this.data.values()) {
            if (tableData.has(id)) {
                tableData.delete(id);
                return;
            }
        }
    }

    query(table: string): QueryBuilder {
        const tableData = this.data.get(table);
        if (!tableData) throw new Error(`Table ${table} not found`);
        return new QueryBuilder(Array.from(tableData.values()));
    }

    // Seed helpers
    seedTenant(data: Partial<TenantData> = {}): string {
        return this.insert('tenants', {
            name: data.name ?? 'Test Tenant',
            slug: data.slug ?? 'test-tenant',
            domain: data.domain,
            status: data.status ?? 'active',
            settings: data.settings ?? { locale: 'nb-NO', currency: 'NOK' },
            seatLimits: data.seatLimits ?? { maxUsers: 10 },
            featureFlags: data.featureFlags ?? {},
            enabledCategories: data.enabledCategories ?? ['LOKALER'],
        });
    }

    seedUser(data: Partial<UserData> = {}): string {
        return this.insert('users', {
            tenantId: data.tenantId,
            email: data.email ?? `user${this.idCounter}@test.com`,
            name: data.name ?? 'Test User',
            role: data.role ?? 'user',
            roles: data.roles ?? [],
            status: data.status ?? 'active',
            metadata: data.metadata ?? {},
        });
    }

    seedResource(data: Partial<ResourceData> = {}): string {
        return this.insert('resources', {
            tenantId: data.tenantId,
            name: data.name ?? 'Test Resource',
            slug: data.slug ?? `resource-${this.idCounter}`,
            categoryKey: data.categoryKey ?? 'LOKALER',
            status: data.status ?? 'draft',
            timeMode: data.timeMode ?? 'PERIOD',
            bookingMode: data.bookingMode,
            features: data.features ?? [],
            requiresApproval: data.requiresApproval ?? false,
            capacity: data.capacity ?? 1,
            images: data.images ?? [],
            pricing: data.pricing ?? {},
            metadata: data.metadata ?? {},
            pricePerHour: data.pricePerHour,
            pricePerDay: data.pricePerDay,
            pricePerTicket: data.pricePerTicket,
            slotDurationMinutes: data.slotDurationMinutes,
            minDuration: data.minDuration,
            maxDuration: data.maxDuration,
            maxBookingDuration: data.maxBookingDuration,
            openingHours: data.openingHours,
        });
    }

    seedBooking(data: Partial<BookingData> = {}): string {
        return this.insert('bookings', {
            tenantId: data.tenantId,
            resourceId: data.resourceId,
            userId: data.userId,
            startTime: data.startTime ?? Date.now(),
            endTime: data.endTime ?? Date.now() + 3600000,
            status: data.status ?? 'confirmed',
            totalPrice: data.totalPrice ?? 0,
            currency: data.currency ?? 'NOK',
            version: data.version ?? 1,
            submittedAt: data.submittedAt ?? Date.now(),
            metadata: data.metadata ?? {},
        });
    }

    seedRole(data: Partial<RoleData> = {}): string {
        return this.insert('roles', {
            tenantId: data.tenantId,
            name: data.name ?? 'Test Role',
            description: data.description,
            permissions: data.permissions ?? [],
            isDefault: data.isDefault ?? false,
            isSystem: data.isSystem ?? false,
        });
    }

    seedOrganization(data: Partial<OrganizationData> = {}): string {
        return this.insert('organizations', {
            tenantId: data.tenantId,
            name: data.name ?? 'Test Organization',
            slug: data.slug ?? `org-${this.idCounter}`,
            type: data.type ?? 'organization',
            parentId: data.parentId,
            metadata: data.metadata ?? {},
        });
    }

    seedAmenityGroup(data: Partial<AmenityGroupData> = {}): string {
        return this.insert('amenityGroups', {
            tenantId: data.tenantId,
            name: data.name ?? 'Test Amenity Group',
            description: data.description,
            icon: data.icon,
            isActive: data.isActive ?? true,
            displayOrder: data.displayOrder ?? 0,
        });
    }

    seedAmenity(data: Partial<AmenityData> = {}): string {
        return this.insert('amenities', {
            tenantId: data.tenantId,
            name: data.name ?? 'Test Amenity',
            description: data.description,
            icon: data.icon,
            groupId: data.groupId,
            isActive: data.isActive ?? true,
            isHighlighted: data.isHighlighted ?? false,
            displayOrder: data.displayOrder ?? 0,
        });
    }

    seedAddon(data: Partial<AddonData> = {}): string {
        return this.insert('addons', {
            tenantId: data.tenantId,
            name: data.name ?? 'Test Addon',
            description: data.description,
            icon: data.icon,
            category: data.category,
            price: data.price ?? 100,
            priceType: data.priceType ?? 'fixed',
            maxQuantity: data.maxQuantity,
            isActive: data.isActive ?? true,
        });
    }

    seedPricingGroup(data: Partial<PricingGroupData> = {}): string {
        return this.insert('pricingGroups', {
            tenantId: data.tenantId,
            name: data.name ?? 'Test Pricing Group',
            code: data.code ?? 'TEST',
            description: data.description,
            multiplier: data.multiplier ?? 1.0,
            isActive: data.isActive ?? true,
            isDefault: data.isDefault ?? false,
            priority: data.priority ?? 0,
        });
    }

    seedAdditionalService(data: Partial<AdditionalServiceData> = {}): string {
        return this.insert('additionalServices', {
            tenantId: data.tenantId,
            resourceId: data.resourceId,
            name: data.name ?? 'Test Service',
            description: data.description ?? '',
            price: data.price ?? 100,
            currency: data.currency ?? 'NOK',
            isRequired: data.isRequired ?? false,
            isActive: data.isActive ?? true,
            displayOrder: data.displayOrder ?? 0,
            metadata: data.metadata ?? {},
        });
    }

    seedBlock(data: Partial<BlockData> = {}): string {
        return this.insert('blocks', {
            tenantId: data.tenantId,
            resourceId: data.resourceId,
            startDate: data.startDate ?? Date.now(),
            endDate: data.endDate ?? Date.now() + 86400000,
            reason: data.reason ?? 'Test block',
            status: data.status ?? 'active',
            allDay: data.allDay ?? false,
            metadata: data.metadata ?? {},
        });
    }

    seedResourcePricing(data: Partial<ResourcePricingData> = {}): string {
        return this.insert('resourcePricing', {
            tenantId: data.tenantId,
            resourceId: data.resourceId,
            pricingGroupId: data.pricingGroupId,
            basePrice: data.basePrice ?? 100,
            pricePerHour: data.pricePerHour,
            minDuration: data.minDuration,
            maxDuration: data.maxDuration,
            currency: data.currency ?? 'NOK',
            isActive: data.isActive ?? true,
        });
    }

    seedPayment(data: Partial<PaymentData> = {}): string {
        const now = Date.now();
        return this.insert('payments', {
            tenantId: data.tenantId ?? 'tenants_0',
            bookingId: data.bookingId,
            userId: data.userId,
            provider: data.provider ?? 'vipps',
            reference: data.reference ?? `xala-test-${now}`,
            externalId: data.externalId,
            amount: data.amount ?? 10000,
            currency: data.currency ?? 'NOK',
            description: data.description,
            status: data.status ?? 'created',
            redirectUrl: data.redirectUrl,
            capturedAmount: data.capturedAmount,
            refundedAmount: data.refundedAmount,
            metadata: data.metadata,
            createdAt: data.createdAt ?? now,
            updatedAt: data.updatedAt ?? now,
        });
    }

    seedOAuthState(data: Partial<OAuthStateData> = {}): string {
        const now = Date.now();
        return this.insert('oauthStates', {
            state: data.state ?? crypto.randomUUID(),
            provider: data.provider ?? 'vipps',
            appOrigin: data.appOrigin ?? 'http://localhost:5173',
            returnPath: data.returnPath ?? '/',
            appId: data.appId ?? 'web',
            signicatSessionId: data.signicatSessionId,
            createdAt: data.createdAt ?? now,
            expiresAt: data.expiresAt ?? now + 10 * 60 * 1000,
            consumed: data.consumed ?? false,
        });
    }

    seedSession(data: Partial<SessionData> = {}): string {
        const now = Date.now();
        return this.insert('sessions', {
            userId: data.userId ?? 'users_0',
            token: data.token ?? crypto.randomUUID(),
            appId: data.appId ?? 'web',
            provider: data.provider ?? 'password',
            expiresAt: data.expiresAt ?? now + 7 * 24 * 60 * 60 * 1000,
            lastActiveAt: data.lastActiveAt ?? now,
            isActive: data.isActive ?? true,
        });
    }

    seedInvoice(data: Partial<InvoiceData> = {}): string {
        const now = Date.now();
        return this.insert('invoices', {
            tenantId: data.tenantId ?? 'tenants_0',
            userId: data.userId,
            organizationId: data.organizationId,
            invoiceNumber: data.invoiceNumber ?? `INV-2024-${String(this.idCounter).padStart(4, '0')}`,
            status: data.status ?? 'draft',
            issueDate: data.issueDate ?? now,
            dueDate: data.dueDate ?? now + 30 * 24 * 60 * 60 * 1000,
            paidDate: data.paidDate,
            subtotal: data.subtotal ?? 10000,
            taxAmount: data.taxAmount ?? 2500,
            totalAmount: data.totalAmount ?? 12500,
            currency: data.currency ?? 'NOK',
            lineItems: data.lineItems ?? [],
            customerName: data.customerName ?? 'Test Customer',
            customerEmail: data.customerEmail,
            createdAt: data.createdAt ?? now,
            updatedAt: data.updatedAt ?? now,
        });
    }

    seedConversation(data: Partial<ConversationData> = {}): string {
        return this.insert('conversations', {
            tenantId: data.tenantId ?? 'tenants_0',
            userId: data.userId ?? 'users_0',
            type: data.type ?? 'direct',
            participants: data.participants ?? [],
            subject: data.subject,
            status: data.status ?? 'active',
            unreadCount: data.unreadCount ?? 0,
            lastMessageAt: data.lastMessageAt,
            bookingId: data.bookingId,
            resourceId: data.resourceId,
            assigneeId: data.assigneeId,
            priority: data.priority,
            metadata: data.metadata ?? {},
        });
    }

    seedMessage(data: Partial<MessageData> = {}): string {
        const now = Date.now();
        const timestamp = data.timestamp ?? data.sentAt ?? now;
        return this.insert('messages', {
            tenantId: data.tenantId ?? 'tenants_0',
            conversationId: data.conversationId ?? 'conversations_0',
            senderId: data.senderId ?? 'users_0',
            senderType: data.senderType ?? 'user',
            content: data.content ?? 'Test message',
            type: data.type ?? 'text',
            messageType: data.messageType ?? 'text',
            attachments: data.attachments ?? [],
            sentAt: timestamp,
            timestamp,
            readAt: data.readAt,
            edited: data.edited ?? false,
            editedAt: data.editedAt,
            metadata: data.metadata ?? {},
        });
    }

    seedNotification(data: Partial<NotificationData> = {}): string {
        const now = Date.now();
        return this.insert('notifications', {
            tenantId: data.tenantId ?? 'tenants_0',
            userId: data.userId ?? 'users_0',
            type: data.type ?? 'booking_confirmed',
            title: data.title ?? 'Test Notification',
            body: data.body ?? 'This is a test notification',
            channel: data.channel ?? 'in_app',
            status: data.status ?? 'unread',
            readAt: data.readAt,
            metadata: data.metadata ?? {},
            createdAt: data.createdAt ?? now,
        });
    }

    seedCategory(data: Partial<CategoryData> = {}): string {
        return this.insert('categories', {
            tenantId: data.tenantId ?? 'tenants_0',
            key: data.key ?? `CATEGORY_${this.idCounter}`,
            parentKey: data.parentKey,
            name: data.name ?? 'Test Category',
            description: data.description,
            icon: data.icon,
            isActive: data.isActive ?? true,
            sortOrder: data.sortOrder ?? 0,
        });
    }

    seedFavorite(data: Partial<FavoriteData> = {}): string {
        return this.insert('favorites', {
            tenantId: data.tenantId ?? 'tenants_0',
            userId: data.userId ?? 'users_0',
            resourceId: data.resourceId ?? 'resources_0',
            createdAt: data.createdAt ?? Date.now(),
        });
    }

    seedModule(data: Partial<ModuleData> = {}): string {
        return this.insert('modules', {
            key: data.key ?? `MODULE_${this.idCounter}`,
            name: data.name ?? 'Test Module',
            description: data.description,
            isCore: data.isCore ?? false,
            isActive: data.isActive ?? true,
        });
    }

    seedAuditLog(data: Partial<AuditLogData> = {}): string {
        const now = Date.now();
        return this.insert('auditLog', {
            tenantId: data.tenantId ?? 'tenants_0',
            userId: data.userId,
            action: data.action ?? 'test_action',
            entityType: data.entityType ?? 'test',
            entityId: data.entityId,
            details: data.details ?? {},
            timestamp: data.timestamp ?? now,
        });
    }

    seedSeason(data: Partial<SeasonData> = {}): string {
        const now = Date.now();
        return this.insert('seasons', {
            tenantId: data.tenantId ?? 'tenants_0',
            name: data.name ?? 'Test Season',
            description: data.description,
            type: data.type ?? 'rental',
            status: data.status ?? 'draft',
            startDate: data.startDate ?? now,
            endDate: data.endDate ?? now + 90 * 24 * 60 * 60 * 1000,
            applicationStartDate: data.applicationStartDate,
            applicationEndDate: data.applicationEndDate,
            isActive: data.isActive ?? false,
        });
    }
}

// Query builder for filtering
class QueryBuilder {
    private items: unknown[];
    private filters: Array<(item: unknown) => boolean> = [];
    private indexFilter: ((item: unknown) => boolean) | null = null;

    constructor(items: unknown[]) {
        this.items = items;
    }

    withIndex(
        _indexName: string,
        filterFn: (q: IndexQueryBuilder) => IndexQueryBuilder
    ): QueryBuilder {
        const builder = new IndexQueryBuilder();
        filterFn(builder);
        this.indexFilter = builder.build();
        return this;
    }

    filter(
        filterFn: (q: FilterQueryBuilder) => FilterExpression
    ): QueryBuilder {
        const builder = new FilterQueryBuilder();
        const expression = filterFn(builder);
        this.filters.push(expression.evaluate.bind(expression));
        return this;
    }

    async first(): Promise<unknown | null> {
        const results = await this.collect();
        return results[0] ?? null;
    }

    async collect(): Promise<unknown[]> {
        let results = this.items;

        if (this.indexFilter) {
            results = results.filter(this.indexFilter);
        }

        for (const filter of this.filters) {
            results = results.filter(filter);
        }

        return results;
    }
}

class IndexQueryBuilder {
    private conditions: Array<{ field: string; value: unknown }> = [];

    eq(field: string, value: unknown): IndexQueryBuilder {
        this.conditions.push({ field, value });
        return this;
    }

    build(): (item: unknown) => boolean {
        return (item: unknown) => {
            const record = item as Record<string, unknown>;
            return this.conditions.every((c) => record[c.field] === c.value);
        };
    }
}

class FilterQueryBuilder {
    field(name: string): FieldAccessor {
        return new FieldAccessor(name);
    }

    eq(accessor: FieldAccessor, value: unknown): FilterExpression {
        return new FilterExpression((item) => {
            const record = item as Record<string, unknown>;
            return record[accessor.fieldName] === value;
        });
    }

    neq(accessor: FieldAccessor, value: unknown): FilterExpression {
        return new FilterExpression((item) => {
            const record = item as Record<string, unknown>;
            return record[accessor.fieldName] !== value;
        });
    }

    and(...expressions: FilterExpression[]): FilterExpression {
        return new FilterExpression((item) =>
            expressions.every((e) => e.evaluate(item))
        );
    }

    or(...expressions: FilterExpression[]): FilterExpression {
        return new FilterExpression((item) =>
            expressions.some((e) => e.evaluate(item))
        );
    }

    gte(accessor: FieldAccessor, value: unknown): FilterExpression {
        return new FilterExpression((item) => {
            const record = item as Record<string, unknown>;
            return (record[accessor.fieldName] as number) >= (value as number);
        });
    }

    lte(accessor: FieldAccessor, value: unknown): FilterExpression {
        return new FilterExpression((item) => {
            const record = item as Record<string, unknown>;
            return (record[accessor.fieldName] as number) <= (value as number);
        });
    }

    gt(accessor: FieldAccessor, value: unknown): FilterExpression {
        return new FilterExpression((item) => {
            const record = item as Record<string, unknown>;
            return (record[accessor.fieldName] as number) > (value as number);
        });
    }

    lt(accessor: FieldAccessor, value: unknown): FilterExpression {
        return new FilterExpression((item) => {
            const record = item as Record<string, unknown>;
            return (record[accessor.fieldName] as number) < (value as number);
        });
    }
}

class FieldAccessor {
    constructor(public fieldName: string) {}
}

class FilterExpression {
    constructor(private predicate: (item: unknown) => boolean) {}

    evaluate(item: unknown): boolean {
        return this.predicate(item);
    }
}

// Create mock context from data store
export function createMockContext(store: TestDataStore): MockConvexContext {
    return {
        db: {
            get: vi.fn((id: string) => Promise.resolve(store.get(id))),
            insert: vi.fn((table: string, doc: Record<string, unknown>) =>
                Promise.resolve(store.insert(table, doc))
            ),
            patch: vi.fn((id: string, updates: Record<string, unknown>) => {
                store.patch(id, updates);
                return Promise.resolve();
            }),
            delete: vi.fn((id: string) => {
                store.delete(id);
                return Promise.resolve();
            }),
            query: vi.fn((table: string) => store.query(table)),
        },
        auth: {
            getUserIdentity: vi.fn(() => Promise.resolve(null)),
        },
    };
}

// Type definitions for seed data
interface TenantData {
    name: string;
    slug: string;
    domain?: string;
    status: string;
    settings: Record<string, unknown>;
    seatLimits: Record<string, unknown>;
    featureFlags: Record<string, unknown>;
    enabledCategories: string[];
}

interface UserData {
    tenantId?: string;
    email: string;
    name?: string;
    role: string;
    roles?: string[];
    status: string;
    metadata: Record<string, unknown>;
}

interface ResourceData {
    tenantId?: string;
    name: string;
    slug: string;
    categoryKey: string;
    status: string;
    timeMode: string;
    bookingMode?: string;
    features: unknown[];
    requiresApproval: boolean;
    capacity?: number;
    images: unknown[];
    pricing: Record<string, unknown>;
    metadata: Record<string, unknown>;
    pricePerHour?: number;
    pricePerDay?: number;
    pricePerTicket?: number;
    slotDurationMinutes?: number;
    minDuration?: number;
    maxDuration?: number;
    maxBookingDuration?: number;
    openingHours?: unknown[];
}

interface BookingData {
    tenantId?: string;
    resourceId: string;
    userId: string;
    startTime: number;
    endTime: number;
    status: string;
    totalPrice: number;
    currency: string;
    version: number;
    submittedAt: number;
    metadata: Record<string, unknown>;
}

interface RoleData {
    tenantId?: string;
    name: string;
    description?: string;
    permissions: string[];
    isDefault: boolean;
    isSystem: boolean;
}

interface OrganizationData {
    tenantId?: string;
    name: string;
    slug: string;
    type: string;
    parentId?: string;
    metadata: Record<string, unknown>;
}

interface AmenityGroupData {
    tenantId?: string;
    name: string;
    description?: string;
    icon?: string;
    isActive: boolean;
    displayOrder: number;
}

interface AmenityData {
    tenantId?: string;
    name: string;
    description?: string;
    icon?: string;
    groupId?: string;
    isActive: boolean;
    isHighlighted: boolean;
    displayOrder: number;
}

interface AddonData {
    tenantId?: string;
    name: string;
    description?: string;
    icon?: string;
    category?: string;
    price: number;
    priceType?: string;
    maxQuantity?: number;
    isActive: boolean;
}

interface PricingGroupData {
    tenantId?: string;
    name: string;
    code?: string;
    description?: string;
    multiplier?: number;
    isActive: boolean;
    isDefault: boolean;
    priority: number;
}

interface AdditionalServiceData {
    tenantId?: string;
    resourceId?: string;
    name: string;
    description?: string;
    price: number;
    currency?: string;
    isRequired?: boolean;
    isActive?: boolean;
    displayOrder?: number;
    metadata?: Record<string, unknown>;
}

interface BlockData {
    tenantId?: string;
    resourceId?: string;
    startDate: number;
    endDate: number;
    reason?: string;
    status?: string;
    allDay?: boolean;
    metadata?: Record<string, unknown>;
}

interface ResourcePricingData {
    tenantId?: string;
    resourceId: string;
    pricingGroupId?: string;
    basePrice: number;
    pricePerHour?: number;
    minDuration?: number;
    maxDuration?: number;
    currency: string;
    isActive: boolean;
}

interface PaymentData {
    tenantId?: string;
    bookingId?: string;
    userId?: string;
    provider: string;
    reference: string;
    externalId?: string;
    amount: number;
    currency: string;
    description?: string;
    status: string;
    redirectUrl?: string;
    capturedAmount?: number;
    refundedAmount?: number;
    metadata?: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}

interface OAuthStateData {
    state: string;
    provider: string;
    appOrigin: string;
    returnPath: string;
    appId: string;
    signicatSessionId?: string;
    createdAt: number;
    expiresAt: number;
    consumed: boolean;
}

interface SessionData {
    userId: string;
    token: string;
    appId?: string;
    provider: string;
    expiresAt: number;
    lastActiveAt: number;
    isActive: boolean;
}

interface InvoiceData {
    tenantId?: string;
    userId?: string;
    organizationId?: string;
    invoiceNumber: string;
    status: string;
    issueDate: number;
    dueDate: number;
    paidDate?: number;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
    lineItems: unknown[];
    customerName: string;
    customerEmail?: string;
    createdAt: number;
    updatedAt: number;
}

interface ConversationData {
    tenantId?: string;
    userId?: string;
    type?: string;
    participants: string[];
    subject?: string;
    status: string;
    unreadCount: number;
    lastMessageAt?: number;
    bookingId?: string;
    resourceId?: string;
    assigneeId?: string;
    priority?: string;
    metadata?: Record<string, unknown>;
}

interface MessageData {
    tenantId?: string;
    conversationId: string;
    senderId: string;
    senderType: string;
    content: string;
    type?: string;
    messageType: string;
    attachments: unknown[];
    sentAt?: number;
    timestamp?: number;
    readAt?: number;
    edited?: boolean;
    editedAt?: number;
    metadata?: Record<string, unknown>;
}

interface NotificationData {
    tenantId?: string;
    userId?: string;
    type: string;
    title: string;
    body: string;
    channel?: string;
    status?: string;
    readAt?: number;
    metadata?: Record<string, unknown>;
    createdAt?: number;
}

interface CategoryData {
    tenantId?: string;
    key: string;
    parentKey?: string;
    name: string;
    description?: string;
    icon?: string;
    isActive: boolean;
    sortOrder: number;
}

interface FavoriteData {
    tenantId?: string;
    userId?: string;
    resourceId?: string;
    createdAt?: number;
}

interface ModuleData {
    key: string;
    name: string;
    description?: string;
    isCore?: boolean;
    isActive?: boolean;
}

interface AuditLogData {
    tenantId?: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: Record<string, unknown>;
    timestamp?: number;
}

interface SeasonData {
    tenantId?: string;
    name: string;
    description?: string;
    type: string;
    status: string;
    startDate: number;
    endDate: number;
    applicationStartDate?: number;
    applicationEndDate?: number;
    isActive?: boolean;
}

export type {
    TenantData,
    UserData,
    ResourceData,
    BookingData,
    RoleData,
    OrganizationData,
    AmenityGroupData,
    AmenityData,
    AddonData,
    PricingGroupData,
    ResourcePricingData,
    PaymentData,
    OAuthStateData,
    SessionData,
    AdditionalServiceData,
    BlockData,
    InvoiceData,
    ConversationData,
    MessageData,
    NotificationData,
    CategoryData,
    FavoriteData,
    ModuleData,
    AuditLogData,
    SeasonData,
};
