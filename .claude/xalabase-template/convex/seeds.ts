import { mutation } from "./_generated/server";
import { components } from "./_generated/api";

/**
 * Seed Data for Convex
 *
 * Run with: npx convex run seeds:seedAll
 *
 * Seeds tenants, organizations, users, demo tokens, resources, bookings, and roles.
 *
 * Core tables (tenants, organizations, users, tenantUsers) use ctx.db.insert.
 * Component tables (resources, auth, rbac, bookings) use component APIs
 * via ctx.runMutation(components.xxx.functions.importXxx, {...}).
 */

// Seed all data
export const seedAll = mutation({
    args: {},
    handler: async (ctx) => {
        console.log("Starting seed...");

        // =====================================================================
        // 1. Create tenant (core table — stays in app schema)
        // =====================================================================
        const tenantId = await ctx.db.insert("tenants", {
            name: "Skien Kommune",
            slug: "skien",
            domain: "skien.digilist.no",
            settings: {
                locale: "nb-NO",
                timezone: "Europe/Oslo",
                currency: "NOK",
                theme: "platform",
                branding: {
                    logoUrl: null,
                    primaryColor: "#2563eb",
                    secondaryColor: "#64748b",
                },
                notifications: {
                    emailEnabled: true,
                    smsEnabled: false,
                },
            },
            status: "active",
            seatLimits: {
                maxUsers: 100,
                maxListings: 200,
                maxStorageMb: 5000,
                maxOrganizations: 50,
                maxBookingsPerMonth: 1000,
            },
            featureFlags: {
                seasonal_leases: true,
                approval_workflow: true,
                messaging: true,
                analytics: true,
                integrations: false,
            },
            enabledCategories: ["LOKALER", "SPORT", "ARRANGEMENT", "TORG"],
        });
        console.log("Created tenant:", tenantId);

        // =====================================================================
        // 2. Create organizations (core table — stays in app schema)
        // =====================================================================
        const defaultOrgId = await ctx.db.insert("organizations", {
            tenantId,
            name: "Skien Kommune - Kultur",
            slug: "kultur",
            description: "Kulturavdeling",
            type: "department",
            status: "active",
            settings: {},
            metadata: {},
        });

        const sportsOrgId = await ctx.db.insert("organizations", {
            tenantId,
            name: "Skien Idrettsråd",
            slug: "idrettsrad",
            description: "Koordinering av idrettsaktiviteter",
            type: "association",
            status: "active",
            settings: {},
            metadata: {},
        });
        console.log("Created organizations:", defaultOrgId, sportsOrgId);

        // =====================================================================
        // 3. Create users (core table — stays in app schema)
        // =====================================================================
        const adminUserId = await ctx.db.insert("users", {
            tenantId,
            organizationId: defaultOrgId,
            email: "admin@skien.kommune.no",
            name: "Admin Bruker",
            displayName: "Admin",
            role: "admin",
            status: "active",
            metadata: { isFounder: true },
        });

        const managerUserId = await ctx.db.insert("users", {
            tenantId,
            organizationId: defaultOrgId,
            email: "leder@skien.kommune.no",
            name: "Kulturleder",
            displayName: "Kulturleder",
            role: "manager",
            status: "active",
            metadata: {},
        });

        const memberUserId = await ctx.db.insert("users", {
            tenantId,
            organizationId: sportsOrgId,
            email: "medlem@skien-idrett.no",
            name: "Idrett Medlem",
            displayName: "Medlem",
            role: "member",
            status: "active",
            metadata: {},
        });
        console.log("Created users:", adminUserId, managerUserId, memberUserId);

        // =====================================================================
        // 4. Create tenant-user links (core table — stays in app schema)
        // =====================================================================
        await ctx.db.insert("tenantUsers", {
            tenantId,
            userId: adminUserId,
            status: "active",
            joinedAt: Date.now(),
        });

        await ctx.db.insert("tenantUsers", {
            tenantId,
            userId: managerUserId,
            status: "active",
            joinedAt: Date.now(),
        });

        await ctx.db.insert("tenantUsers", {
            tenantId,
            userId: memberUserId,
            status: "active",
            joinedAt: Date.now(),
        });

        // =====================================================================
        // 5. Create demo tokens → auth component
        // =====================================================================
        await ctx.runMutation(components.auth.mutations.importDemoToken, {
            key: "DEMO_ADMIN_001",
            tenantId: tenantId as string,
            organizationId: defaultOrgId as string,
            userId: adminUserId as string,
            tokenHash: "demo-hash-admin-001",
            isActive: true,
            expiresAt: new Date("2030-12-31").getTime(),
        });

        await ctx.runMutation(components.auth.mutations.importDemoToken, {
            key: "DEMO_MANAGER_001",
            tenantId: tenantId as string,
            organizationId: defaultOrgId as string,
            userId: managerUserId as string,
            tokenHash: "demo-hash-manager-001",
            isActive: true,
            expiresAt: new Date("2030-12-31").getTime(),
        });

        await ctx.runMutation(components.auth.mutations.importDemoToken, {
            key: "DEMO_MEMBER_001",
            tenantId: tenantId as string,
            organizationId: sportsOrgId as string,
            userId: memberUserId as string,
            tokenHash: "demo-hash-member-001",
            isActive: true,
            expiresAt: new Date("2030-12-31").getTime(),
        });
        console.log("Created demo tokens (auth component)");

        // =====================================================================
        // 6. Create sample resources → resources component
        // =====================================================================
        // Standard weekday opening hours (Mon-Fri 08:00-22:00, Sat 09:00-18:00, Sun closed)
        const standardOpeningHours = [
            { dayIndex: 1, day: "Mandag",  open: "08:00", close: "22:00" },
            { dayIndex: 2, day: "Tirsdag", open: "08:00", close: "22:00" },
            { dayIndex: 3, day: "Onsdag",  open: "08:00", close: "22:00" },
            { dayIndex: 4, day: "Torsdag", open: "08:00", close: "22:00" },
            { dayIndex: 5, day: "Fredag",  open: "08:00", close: "22:00" },
            { dayIndex: 6, day: "Lørdag",  open: "09:00", close: "18:00" },
            { dayIndex: 0, day: "Søndag",  open: "00:00", close: "00:00", isClosed: true },
        ];

        // Sports hall opening hours (longer, open on weekends)
        const sportsOpeningHours = [
            { dayIndex: 1, day: "Mandag",  open: "06:00", close: "23:00" },
            { dayIndex: 2, day: "Tirsdag", open: "06:00", close: "23:00" },
            { dayIndex: 3, day: "Onsdag",  open: "06:00", close: "23:00" },
            { dayIndex: 4, day: "Torsdag", open: "06:00", close: "23:00" },
            { dayIndex: 5, day: "Fredag",  open: "06:00", close: "23:00" },
            { dayIndex: 6, day: "Lørdag",  open: "08:00", close: "20:00" },
            { dayIndex: 0, day: "Søndag",  open: "10:00", close: "18:00" },
        ];

        const { id: hallId } = await ctx.runMutation(
            components.resources.mutations.importResource,
            {
                tenantId: tenantId as string,
                organizationId: defaultOrgId as string,
                name: "Ibsenhuset Hovedsal",
                slug: "ibsenhuset-hovedsal",
                description: "Stor hovedsal for kulturarrangementer med 500 sitteplasser, scene, projektor og lydanlegg.",
                categoryKey: "LOKALER",
                timeMode: "PERIOD",
                features: [
                    { name: "capacity", value: 500 },
                    { name: "projector", value: true },
                    { name: "audio_system", value: true },
                    { name: "stage", value: true },
                    { name: "accessible", value: true },
                    { name: "parking", value: true },
                ],
                status: "published",
                requiresApproval: true,
                capacity: 500,
                inventoryTotal: 1,
                images: [],
                openingHours: standardOpeningHours,
                slotDurationMinutes: 60,
                minBookingDuration: 120,   // min 2 hours
                maxBookingDuration: 720,   // max 12 hours
                allowSeasonRental: true,
                allowRecurringBooking: true,
                pricing: {
                    basePrice: 5000,
                    pricePerHour: 1000,
                    pricePerHalfDay: 4000,
                    pricePerDay: 7500,
                    currency: "NOK",
                    deposit: 2000,
                    cleaningFee: 1500,
                    serviceFee: 500,
                    taxRate: 25,
                    taxIncluded: true,
                },
                metadata: { buildingCode: "IBH-01", floorArea: 800, yearBuilt: 1973 },
            }
        );

        const { id: sportsHallId } = await ctx.runMutation(
            components.resources.mutations.importResource,
            {
                tenantId: tenantId as string,
                organizationId: sportsOrgId as string,
                name: "Skienshallen",
                slug: "skienshallen",
                description: "Idrettshall for ulike aktiviteter inkl. basketball, handball, volleyball og badminton.",
                categoryKey: "SPORT",
                timeMode: "SLOT",
                features: [
                    { name: "indoor", value: true },
                    { name: "basketball_court", value: true },
                    { name: "handball_court", value: true },
                    { name: "volleyball_court", value: true },
                    { name: "changing_rooms", value: true },
                    { name: "showers", value: true },
                    { name: "spectator_seating", value: 200 },
                ],
                status: "published",
                requiresApproval: false,
                capacity: 200,
                inventoryTotal: 1,
                images: [],
                openingHours: sportsOpeningHours,
                slotDurationMinutes: 30,
                minBookingDuration: 60,    // min 1 hour
                maxBookingDuration: 480,   // max 8 hours
                allowSeasonRental: true,
                allowRecurringBooking: true,
                pricing: {
                    basePrice: 500,
                    pricePerHour: 200,
                    pricePerPerson: 50,
                    currency: "NOK",
                    deposit: 500,
                    cleaningFee: 300,
                    taxRate: 25,
                    taxIncluded: true,
                },
                metadata: { buildingCode: "SKH-01", floorArea: 1200, yearBuilt: 1995 },
            }
        );

        const { id: meetingRoomId } = await ctx.runMutation(
            components.resources.mutations.importResource,
            {
                tenantId: tenantId as string,
                organizationId: defaultOrgId as string,
                name: "Møterom A",
                slug: "moterom-a",
                description: "Lite møterom for opptil 10 personer med whiteboard og videokonferanseutstyr.",
                categoryKey: "LOKALER",
                subcategoryKeys: ["MOTEROM"],
                timeMode: "PERIOD",
                features: [
                    { name: "capacity", value: 10 },
                    { name: "whiteboard", value: true },
                    { name: "video_conference", value: true },
                    { name: "screen", value: true },
                    { name: "wifi", value: true },
                    { name: "accessible", value: true },
                ],
                status: "published",
                requiresApproval: false,
                capacity: 10,
                inventoryTotal: 1,
                images: [],
                openingHours: standardOpeningHours,
                slotDurationMinutes: 30,
                minBookingDuration: 30,    // min 30 minutes
                maxBookingDuration: 480,   // max 8 hours
                allowSeasonRental: false,
                allowRecurringBooking: true,
                pricing: {
                    basePrice: 0,
                    pricePerHour: 0,
                    currency: "NOK",
                    taxRate: 0,
                },
                metadata: { buildingCode: "KOM-A01", floorArea: 25, yearBuilt: 2010 },
            }
        );
        console.log("Created resources (resources component):", hallId, sportsHallId, meetingRoomId);

        // =====================================================================
        // 7. Create sample booking → bookings component
        // =====================================================================
        const now = Date.now();
        const tomorrow = now + 24 * 60 * 60 * 1000;

        const { id: bookingId } = await ctx.runMutation(
            components.bookings.allocations.importBooking,
            {
                tenantId: tenantId as string,
                resourceId: meetingRoomId, // already a string from importResource
                userId: memberUserId as string,
                organizationId: sportsOrgId as string,
                status: "confirmed",
                startTime: tomorrow + 9 * 60 * 60 * 1000, // 9:00
                endTime: tomorrow + 11 * 60 * 60 * 1000, // 11:00
                totalPrice: 0,
                currency: "NOK",
                notes: "Styremøte",
                metadata: { source: "seed" },
                version: 1,
                submittedAt: now,
                approvedAt: now,
            }
        );
        console.log("Created booking (bookings component):", bookingId);

        // =====================================================================
        // 8. Create RBAC roles → rbac component
        // =====================================================================
        const { id: adminRoleId } = await ctx.runMutation(
            components.rbac.import.importRole,
            {
                tenantId: tenantId as string,
                name: "Administrator",
                description: "Full system access",
                permissions: [
                    "tenant:read",
                    "tenant:write",
                    "tenant:admin",
                    "user:read",
                    "user:write",
                    "user:invite",
                    "user:delete",
                    "resource:read",
                    "resource:write",
                    "resource:delete",
                    "resource:publish",
                    "booking:read",
                    "booking:write",
                    "booking:approve",
                    "booking:cancel",
                    "org:read",
                    "org:write",
                    "org:admin",
                    "rbac:read",
                    "rbac:write",
                    "billing:read",
                    "billing:write",
                    "reports:read",
                    "reports:export",
                ],
                isDefault: false,
                isSystem: true,
            }
        );

        const { id: managerRoleId } = await ctx.runMutation(
            components.rbac.import.importRole,
            {
                tenantId: tenantId as string,
                name: "Manager",
                description: "Resource and booking management",
                permissions: [
                    "resource:read",
                    "resource:write",
                    "resource:publish",
                    "booking:read",
                    "booking:write",
                    "booking:approve",
                    "booking:cancel",
                    "user:read",
                    "reports:read",
                ],
                isDefault: false,
                isSystem: false,
            }
        );

        const { id: memberRoleId } = await ctx.runMutation(
            components.rbac.import.importRole,
            {
                tenantId: tenantId as string,
                name: "Member",
                description: "Basic booking access",
                permissions: ["resource:read", "booking:read", "booking:write"],
                isDefault: true,
                isSystem: false,
            }
        );
        console.log("Created roles (rbac component):", adminRoleId, managerRoleId, memberRoleId);

        // =====================================================================
        // 9. Assign roles to users → rbac component
        //
        // NOTE: importUserRole expects roleId as v.id("roles") — the component-
        // internal ID. The string returned by importRole is a valid component ID,
        // so we cast it through `as any` at the TypeScript boundary.
        // =====================================================================
        await ctx.runMutation(components.rbac.import.importUserRole, {
            userId: adminUserId as string,
            roleId: adminRoleId as any,
            tenantId: tenantId as string,
            assignedAt: Date.now(),
        });

        await ctx.runMutation(components.rbac.import.importUserRole, {
            userId: managerUserId as string,
            roleId: managerRoleId as any,
            tenantId: tenantId as string,
            assignedAt: Date.now(),
        });

        await ctx.runMutation(components.rbac.import.importUserRole, {
            userId: memberUserId as string,
            roleId: memberRoleId as any,
            tenantId: tenantId as string,
            assignedAt: Date.now(),
        });
        console.log("Assigned roles to users (rbac component)");

        return {
            success: true,
            created: {
                tenant: tenantId,
                organizations: 2,
                users: 3,
                demoTokens: 3,
                resources: 3,
                bookings: 1,
                roles: 3,
            },
        };
    },
});

// Reset all data (for development)
export const resetAll = mutation({
    args: {},
    handler: async (ctx) => {
        console.log("Resetting all data...");

        // Only clear core app tables that remain in the app schema.
        // Component tables (resources, bookings, roles, userRoles, authDemoTokens,
        // reviews, notifications, favorites, messaging, catalog, pricing, addons,
        // seasons, billing, analytics, etc.) live in isolated component schemas
        // and cannot be cleared via ctx.db. Use component-specific reset functions
        // or redeploy to clear component data.
        const tables = [
            "custodySubgrants",
            "custodyGrants",
            "tenantUsers",
            "users",
            "organizations",
            "tenants",
        ] as const;

        let deleted = 0;
        for (const table of tables) {
            try {
                const docs = await ctx.db.query(table).collect();
                for (const doc of docs) {
                    await ctx.db.delete(doc._id);
                    deleted++;
                }
            } catch (e) {
                // Table might not exist or be empty
                console.log(`Skipping ${table}`);
            }
        }

        // Also clear infrastructure tables that stay in app schema
        try {
            const outboxDocs = await ctx.db.query("outboxEvents").collect();
            for (const doc of outboxDocs) {
                await ctx.db.delete(doc._id);
                deleted++;
            }
        } catch (e) {
            console.log("Skipping outboxEvents");
        }

        try {
            const registryDocs = await ctx.db.query("componentRegistry").collect();
            for (const doc of registryDocs) {
                await ctx.db.delete(doc._id);
                deleted++;
            }
        } catch (e) {
            console.log("Skipping componentRegistry");
        }

        console.log(`Deleted ${deleted} documents from core app tables`);
        console.log(
            "NOTE: Component data (resources, bookings, roles, auth tokens, etc.) " +
            "persists in component tables and is not cleared by this function."
        );
        return { success: true, deleted };
    },
});
