/**
 * Component Seed Data
 *
 * Seeds data into component tables for development and testing.
 * Run AFTER the main seeds.ts to populate component tables.
 *
 * Run with: npx convex run seedComponents:seedAll
 *
 * Reads core data (tenants, users) from the app schema and resources from
 * the resources component. Then seeds additional component tables (audit,
 * reviews, notifications, user prefs, component registry).
 */

import { mutation } from "./_generated/server";
import { components } from "./_generated/api";

/**
 * Seed all component tables with sample data.
 * Requires that the main seeds have already been run (tenants, users, resources exist).
 */
export const seedAll = mutation({
    args: {},
    handler: async (ctx) => {
        console.log("[Components] Starting component seed...");

        // Get existing tenant and users from core tables
        const tenant = await ctx.db.query("tenants").first();
        if (!tenant) {
            throw new Error("No tenant found. Run seeds:seedAll first.");
        }
        const tenantId = tenant._id as string;

        const users = await ctx.db
            .query("users")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
            .collect();
        if (users.length === 0) {
            throw new Error("No users found. Run seeds:seedAll first.");
        }
        const adminUser = users.find((u) => u.role === "admin") ?? users[0];
        const managerUser = users.find((u) => u.role === "manager") ?? users[1] ?? users[0];
        const memberUser = users.find((u) => u.role === "member") ?? users[2] ?? users[0];

        // Get organizations
        const orgs = await ctx.db
            .query("organizations")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
            .collect();
        const defaultOrg = orgs[0];
        const sportsOrg = orgs.find((o) => o.slug === "skien-idrettslag") ?? orgs[1] ?? orgs[0];

        // Resources now live in the resources component (seeded by seeds:seedAll)
        const resources = await ctx.runQuery(
            components.resources.queries.list,
            { tenantId }
        );
        if (resources.length === 0) {
            throw new Error("No resources found. Run seeds:seedAll first.");
        }

        // Shared time helpers used across multiple sections
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        // =====================================================================
        // AUDIT COMPONENT
        // =====================================================================
        console.log("[Components] Seeding audit...");
        await ctx.runMutation(components.audit.functions.create, {
            tenantId,
            userId: adminUser._id as string,
            userName: adminUser.name,
            userEmail: adminUser.email,
            entityType: "tenant",
            entityId: tenantId,
            action: "seed_initialized",
            details: { message: "Component seed data initialized" },
            sourceComponent: "system",
        });

        // =====================================================================
        // REVIEWS COMPONENT
        // =====================================================================
        console.log("[Components] Seeding reviews...");

        // Check if reviews already seeded
        const existingReviews = await ctx.runQuery(
            components.reviews.functions.list,
            { tenantId }
        );

        // Use importRecord to seed reviews with varying statuses, users, and moderation states
        const reviewData = [
            // --- Ibsenhuset Hovedsal reviews ---
            {
                resourceIdx: 0,
                userId: memberUser._id as string,
                rating: 5,
                title: "Fantastisk konsertopplevelse",
                text: "Vi arrangerte skolekonsert for 300 elever i hovedsalen. Akustikken er enestående, og personalet var svært behjelpelig med oppsett av lyd og lys. Kjøkkenet var rent og godt utstyrt. Anbefales på det sterkeste!",
                status: "approved",
                moderatedBy: adminUser._id as string,
                moderatedAt: now - 14 * oneDay,
            },
            {
                resourceIdx: 0,
                userId: managerUser._id as string,
                rating: 4,
                title: "Godt egnet for konferanser",
                text: "Brukte salen til en dagskonferanse med 120 deltakere. Projektoren og lydanlegget fungerte bra. Trekker ett poeng for litt treg WiFi under toppbelastning.",
                status: "approved",
                moderatedBy: adminUser._id as string,
                moderatedAt: now - 10 * oneDay,
            },
            {
                resourceIdx: 0,
                userId: adminUser._id as string,
                rating: 3,
                title: "Bra, men dyrt",
                text: "Lokalet er flott, men prisen er høy sammenlignet med andre alternativer i Skien. Depositum på 2000 kr føles unødvendig for etablerte leietakere.",
                status: "pending", // Awaiting moderation
            },

            // --- Skienshallen reviews ---
            {
                resourceIdx: 1,
                userId: memberUser._id as string,
                rating: 5,
                title: "Perfekt for idrettslaget",
                text: "Vi har sesongavtale for juniorlaget og er svært fornøyde. Garderobene er rene, hallen er godt vedlikeholdt og booking-systemet er enkelt å bruke.",
                status: "approved",
                moderatedBy: adminUser._id as string,
                moderatedAt: now - 20 * oneDay,
            },
            {
                resourceIdx: 1,
                userId: managerUser._id as string,
                rating: 4,
                title: "Fin hall for trening",
                text: "Fleksible timeslots og rimelige priser. Dusj- og garderobefasilitetene holder god standard. Parkeringen kan bli litt full på ettermiddagen.",
                status: "approved",
                moderatedBy: adminUser._id as string,
                moderatedAt: now - 7 * oneDay,
            },
            {
                resourceIdx: 1,
                userId: adminUser._id as string,
                rating: 2,
                title: "Dårlig rengjøring",
                text: "Hallen var skitten da vi kom. Gulvet var ikke vasket og det lå søppel i garderoben. Sendte klage men har ikke fått svar.",
                status: "flagged",
                moderatedBy: managerUser._id as string,
                moderatedAt: now - 3 * oneDay,
                moderationNote: "Sjekker med driftsteamet om hendelsen. Kunden kontaktes for oppfølging.",
            },

            // --- Møterom A reviews ---
            {
                resourceIdx: 2,
                userId: memberUser._id as string,
                rating: 4,
                title: "Praktisk møterom",
                text: "Fint lite møterom med alt nødvendig utstyr. Videokonferanseutstyret fungerte feilfritt. Litt lite bord om man er 10 personer.",
                status: "approved",
                moderatedBy: adminUser._id as string,
                moderatedAt: now - 5 * oneDay,
            },
            {
                resourceIdx: 2,
                userId: managerUser._id as string,
                rating: 5,
                title: "Gratis og fleksibelt",
                text: "Fantastisk at kommunen tilbyr gratis møterom! Enkelt å booke på kort varsel. Heisen gjør det tilgjengelig for alle.",
                status: "approved",
                moderatedBy: adminUser._id as string,
                moderatedAt: now - 2 * oneDay,
            },
            {
                resourceIdx: 2,
                userId: adminUser._id as string,
                rating: 1,
                title: "SPAM – Ignorér",
                text: "kjøp billige sko på nett www.spam-link.fake",
                status: "rejected",
                moderatedBy: adminUser._id as string,
                moderatedAt: now - 1 * oneDay,
                moderationNote: "Spam-innhold. Bruker advart.",
            },
        ];

        if (existingReviews.length === 0) {
            for (const review of reviewData) {
                if (resources[review.resourceIdx]) {
                    await ctx.runMutation(components.reviews.functions.importRecord, {
                        tenantId,
                        resourceId: resources[review.resourceIdx]._id as string,
                        userId: review.userId,
                        rating: review.rating,
                        title: review.title,
                        text: review.text,
                        status: review.status,
                        moderatedBy: review.moderatedBy,
                        moderatedAt: review.moderatedAt,
                        moderationNote: review.moderationNote,
                    });
                }
            }
        } else {
            console.log("[Components] Reviews already seeded, skipping...");
        }

        // =====================================================================
        // NOTIFICATIONS COMPONENT
        // =====================================================================
        console.log("[Components] Seeding notifications...");
        await ctx.runMutation(components.notifications.functions.create, {
            tenantId,
            userId: adminUser._id as string,
            type: "system",
            title: "Velkommen til XalaBaaS",
            body: "Plattformen er klar til bruk. Kom i gang med å opprette ressurser.",
            link: "/dashboard",
        });
        await ctx.runMutation(components.notifications.functions.create, {
            tenantId,
            userId: memberUser._id as string,
            type: "booking_confirmed",
            title: "Booking bekreftet",
            body: "Din booking er nå bekreftet.",
            link: "/min-side/bookinger",
        });

        // =====================================================================
        // USER PREFS COMPONENT (favorites)
        // =====================================================================
        console.log("[Components] Seeding user preferences...");
        if (resources.length > 0) {
            try {
                await ctx.runMutation(components.userPrefs.functions.addFavorite, {
                    tenantId,
                    userId: memberUser._id as string,
                    resourceId: resources[0]._id as string,
                    tags: ["favoritt"],
                });
            } catch {
                // Already favorited from a previous seed run
            }
        }

        // =====================================================================
        // PRICING COMPONENT
        // =====================================================================
        console.log("[Components] Seeding pricing...");

        // Check if pricing already seeded
        const existingPricingGroups = await ctx.runQuery(
            components.pricing.queries.listGroups,
            { tenantId }
        );

        if (existingPricingGroups.length > 0) {
            console.log("[Components] Pricing already seeded, skipping...");
        } else {

        // Create a default pricing group
        const defaultPricingGroup = await ctx.runMutation(
            components.pricing.import.importPricingGroup,
            {
                tenantId,
                name: "Standard",
                description: "Standardpriser for alle ressurser",
                groupType: "default",
                isDefault: true,
                priority: 0,
                isActive: true,
            }
        );

        // Create a member pricing group
        const memberPricingGroup = await ctx.runMutation(
            components.pricing.import.importPricingGroup,
            {
                tenantId,
                name: "Medlem",
                description: "Rabatterte priser for medlemmer",
                groupType: "member",
                discountPercent: 15,
                isDefault: false,
                priority: 1,
                isActive: true,
            }
        );

        // Resource pricing configs — one per resource, matching the seed resources:
        // [0] Ibsenhuset Hovedsal (hall, per_hour, capacity 500)
        // [1] Skienshallen (sports hall, slot-based, capacity 200)
        // [2] Møterom A (meeting room, per_hour, capacity 10)
        const pricingConfigs = [
            {
                // Ibsenhuset Hovedsal — hourly rental with deposit and fees
                priceType: "per_hour",
                basePrice: 5000,
                pricePerHour: 1000,
                pricePerHalfDay: 4000,
                pricePerDay: 7500,
                minDuration: 120,       // min 2 hours
                maxDuration: 720,       // max 12 hours
                minPeople: 10,
                maxPeople: 500,
                slotDurationMinutes: 60,
                advanceBookingDays: 90,
                sameDayBookingAllowed: false,
                cancellationHours: 72,
                depositAmount: 2000,
                cleaningFee: 1500,
                serviceFee: 500,
                taxRate: 25,
                taxIncluded: true,
                weekendMultiplier: 1.5,
                peakHoursMultiplier: 1.25,
                holidayMultiplier: 2.0,
                enableDiscountCodes: true,
                enableSurcharges: true,
                enablePriceGroups: true,
            },
            {
                // Skienshallen — slot-based with per-person pricing
                priceType: "slots",
                basePrice: 500,
                pricePerHour: 200,
                pricePerPerson: 50,
                pricePerPersonHour: 25,
                slotOptions: [
                    { label: "1 time", durationMinutes: 60, price: 500 },
                    { label: "1.5 timer", durationMinutes: 90, price: 700 },
                    { label: "2 timer", durationMinutes: 120, price: 900 },
                    { label: "Halvdag", durationMinutes: 240, price: 1500 },
                    { label: "Heldag", durationMinutes: 480, price: 2500 },
                ],
                minDuration: 60,        // min 1 hour
                maxDuration: 480,       // max 8 hours
                minPeople: 1,
                maxPeople: 200,
                minAge: 6,
                maxAge: 99,
                slotDurationMinutes: 30,
                advanceBookingDays: 60,
                sameDayBookingAllowed: true,
                cancellationHours: 24,
                depositAmount: 500,
                cleaningFee: 300,
                taxRate: 25,
                taxIncluded: true,
                weekendMultiplier: 1.2,
                enableDiscountCodes: true,
                enableSurcharges: true,
                enablePriceGroups: true,
            },
            {
                // Møterom A — free meeting room, per-hour with simple constraints
                priceType: "per_hour",
                basePrice: 0,
                pricePerHour: 0,
                minDuration: 30,        // min 30 minutes
                maxDuration: 480,       // max 8 hours
                minPeople: 1,
                maxPeople: 10,
                slotDurationMinutes: 30,
                advanceBookingDays: 30,
                sameDayBookingAllowed: true,
                cancellationHours: 2,
                taxRate: 0,
                taxIncluded: true,
                enableDiscountCodes: false,
                enableSurcharges: false,
                enablePriceGroups: false,
            },
        ];

        for (let i = 0; i < Math.min(pricingConfigs.length, resources.length); i++) {
            await ctx.runMutation(
                components.pricing.import.importResourcePricing,
                {
                    tenantId,
                    resourceId: resources[i]._id as string,
                    pricingGroupId: defaultPricingGroup.id,
                    currency: "NOK",
                    isActive: true,
                    ...pricingConfigs[i],
                }
            );
        }

        // Create holidays
        await ctx.runMutation(components.pricing.import.importHoliday, {
            tenantId,
            name: "Julaften",
            date: "12-24",
            isRecurring: true,
            surchargeType: "percent",
            surchargeValue: 50,
            isActive: true,
        });
        await ctx.runMutation(components.pricing.import.importHoliday, {
            tenantId,
            name: "17. mai",
            date: "05-17",
            isRecurring: true,
            surchargeType: "percent",
            surchargeValue: 25,
            isActive: true,
        });

        // Create weekday pricing (weekend surcharge)
        for (const day of [6, 0]) { // Saturday, Sunday
            await ctx.runMutation(components.pricing.import.importWeekdayPricing, {
                tenantId,
                dayOfWeek: day,
                surchargeType: "percent",
                surchargeValue: 20,
                label: day === 6 ? "Lørdag" : "Søndag",
                isActive: true,
            });
        }

        // Create discount codes
        await ctx.runMutation(components.pricing.import.importDiscountCode, {
            tenantId,
            code: "VELKOMST10",
            name: "Velkomstrabatt",
            description: "10% rabatt for nye brukere",
            discountType: "percent",
            discountValue: 10,
            maxUsesTotal: 100,
            maxUsesPerUser: 1,
            currentUses: 0,
            firstTimeBookersOnly: true,
            isActive: true,
        });
        await ctx.runMutation(components.pricing.import.importDiscountCode, {
            tenantId,
            code: "SOMMER2025",
            name: "Sommerkampanje",
            description: "200kr rabatt hele sommeren",
            discountType: "fixed",
            discountValue: 200,
            minBookingAmount: 500,
            currentUses: 0,
            isActive: true,
        });

        // Create additional services for resources
        for (let i = 0; i < Math.min(2, resources.length); i++) {
            const resource = resources[i];
            await ctx.runMutation(
                components.pricing.import.importAdditionalService,
                {
                    tenantId,
                    resourceId: resource._id as string,
                    name: "Rengjøring",
                    description: "Profesjonell rengjøring etter bruk",
                    price: 350,
                    currency: "NOK",
                    isRequired: false,
                    displayOrder: 0,
                    isActive: true,
                }
            );
            await ctx.runMutation(
                components.pricing.import.importAdditionalService,
                {
                    tenantId,
                    resourceId: resource._id as string,
                    name: "Forsikring",
                    description: "Utvidet forsikring mot skade",
                    price: 150,
                    currency: "NOK",
                    isRequired: false,
                    displayOrder: 1,
                    isActive: true,
                }
            );
        }

        } // end pricing guard

        // =====================================================================
        // ADDONS COMPONENT
        // =====================================================================
        console.log("[Components] Seeding addons...");

        // Check if addons already seeded
        const existingAddons = await ctx.runQuery(
            components.addons.queries.list,
            { tenantId }
        );

        const addonDefs = [
            {
                name: "Ekstra håndklær",
                slug: "ekstra-handkler",
                description: "Sett med 2 store og 2 små håndklær",
                category: "utstyr",
                priceType: "per_unit",
                price: 75,
                currency: "NOK",
                maxQuantity: 5,
                displayOrder: 0,
            },
            {
                name: "Sengetøy",
                slug: "sengetoy",
                description: "Komplett sengetøysett (dyne, pute, laken)",
                category: "utstyr",
                priceType: "per_unit",
                price: 120,
                currency: "NOK",
                maxQuantity: 10,
                displayOrder: 1,
            },
            {
                name: "Parkering",
                slug: "parkering",
                description: "Reservert parkeringsplass",
                category: "tjenester",
                priceType: "per_booking",
                price: 100,
                currency: "NOK",
                maxQuantity: 1,
                displayOrder: 2,
            },
            {
                name: "Frokostpakke",
                slug: "frokostpakke",
                description: "Kontinental frokost levert til døren",
                category: "mat",
                priceType: "per_person_per_day",
                price: 195,
                currency: "NOK",
                maxQuantity: 20,
                requiresApproval: true,
                leadTimeHours: 24,
                displayOrder: 3,
            },
        ];

        const addonIds: string[] = [];
        if (existingAddons.length === 0) {
            for (const addonDef of addonDefs) {
                const result = await ctx.runMutation(
                    components.addons.mutations.create,
                    { tenantId, ...addonDef }
                );
                addonIds.push(result.id);
            }

            // Associate addons with resources
            for (let i = 0; i < Math.min(2, resources.length); i++) {
                const resource = resources[i];
                for (let j = 0; j < addonIds.length; j++) {
                    await ctx.runMutation(
                        components.addons.mutations.addToResource,
                        {
                            tenantId,
                            resourceId: resource._id as string,
                            addonId: addonIds[j] as any,
                            isRequired: false,
                            isRecommended: j < 2, // First two are recommended
                            displayOrder: j,
                        }
                    );
                }
            }
        } else {
            console.log("[Components] Addons already seeded, skipping...");
        }

        // =====================================================================
        // CATALOG COMPONENT (categories, amenity groups, amenities)
        // =====================================================================
        console.log("[Components] Seeding catalog...");

        // Check if catalog already seeded
        const existingCategories = await ctx.runQuery(
            components.catalog.queries.listCategories,
            { tenantId }
        );

        if (existingCategories.length > 0) {
            console.log("[Components] Catalog already seeded, skipping...");
        } else {

        // Categories
        const { id: lokalerCatId } = await ctx.runMutation(
            components.catalog.import.importCategory,
            { tenantId, key: "LOKALER", name: "Lokaler", slug: "lokaler", description: "Forsamlingslokaler, kulturbygg og møterom", icon: "building", color: "#4A90D9", sortOrder: 0, isActive: true }
        );
        const { id: sportCatId } = await ctx.runMutation(
            components.catalog.import.importCategory,
            { tenantId, key: "SPORT", name: "Idrettsanlegg", slug: "idrettsanlegg", description: "Idrettshaller, baner og treningslokaler", icon: "trophy", color: "#27AE60", sortOrder: 1, isActive: true }
        );
        await ctx.runMutation(
            components.catalog.import.importCategory,
            { tenantId, key: "UTSTYR", name: "Utstyr", slug: "utstyr", description: "Lyd, lys, sceneutstyr og annet", icon: "wrench", color: "#E67E22", sortOrder: 2, isActive: true }
        );
        // Subcategory under LOKALER
        await ctx.runMutation(
            components.catalog.import.importCategory,
            { tenantId, key: "MOTEROM", name: "Møterom", slug: "moterom", description: "Møterom og konferanselokaler", icon: "users", parentId: lokalerCatId as any, sortOrder: 0, isActive: true }
        );

        // Amenity groups
        const { id: facilitiesGroupId } = await ctx.runMutation(
            components.catalog.import.importAmenityGroup,
            { tenantId, name: "Fasiliteter", slug: "fasiliteter", description: "Tilgjengelige fasiliteter", icon: "star", displayOrder: 0, isActive: true }
        );
        const { id: techGroupId } = await ctx.runMutation(
            components.catalog.import.importAmenityGroup,
            { tenantId, name: "Teknisk utstyr", slug: "teknisk-utstyr", description: "AV-utstyr og teknologi", icon: "monitor", displayOrder: 1, isActive: true }
        );
        const { id: accessGroupId } = await ctx.runMutation(
            components.catalog.import.importAmenityGroup,
            { tenantId, name: "Tilgjengelighet", slug: "tilgjengelighet", description: "Universell utforming og tilgang", icon: "accessibility", displayOrder: 2, isActive: true }
        );

        // Amenities
        const amenities = [
            { groupId: facilitiesGroupId, name: "Parkering", slug: "parkering", icon: "car", isHighlighted: true },
            { groupId: facilitiesGroupId, name: "Garderobe", slug: "garderobe", icon: "shirt", isHighlighted: false },
            { groupId: facilitiesGroupId, name: "Dusj", slug: "dusj", icon: "droplet", isHighlighted: false },
            { groupId: facilitiesGroupId, name: "Kjøkken", slug: "kjokken", icon: "utensils", isHighlighted: true },
            { groupId: techGroupId, name: "Projektor", slug: "projektor", icon: "projector", isHighlighted: true },
            { groupId: techGroupId, name: "Lydanlegg", slug: "lydanlegg", icon: "speaker", isHighlighted: true },
            { groupId: techGroupId, name: "Videokonferanse", slug: "videokonferanse", icon: "video", isHighlighted: false },
            { groupId: techGroupId, name: "WiFi", slug: "wifi", icon: "wifi", isHighlighted: true },
            { groupId: accessGroupId, name: "Rullestoltilgang", slug: "rullestoltilgang", icon: "wheelchair", isHighlighted: true },
            { groupId: accessGroupId, name: "Heis", slug: "heis", icon: "elevator", isHighlighted: false },
        ];

        const amenityIds: string[] = [];
        for (let i = 0; i < amenities.length; i++) {
            const a = amenities[i];
            const { id } = await ctx.runMutation(
                components.catalog.import.importAmenity,
                { tenantId, groupId: a.groupId as any, name: a.name, slug: a.slug, icon: a.icon, displayOrder: i, isHighlighted: a.isHighlighted, isActive: true }
            );
            amenityIds.push(id);
        }

        // Link amenities to resources
        // Ibsenhuset: parkering, kjøkken, projektor, lydanlegg, wifi, rullestoltilgang
        const hallAmenities = [0, 3, 4, 5, 7, 8];
        for (const idx of hallAmenities) {
            await ctx.runMutation(components.catalog.import.importResourceAmenity, {
                tenantId, resourceId: resources[0]._id as string, amenityId: amenityIds[idx] as any,
                quantity: 1, isIncluded: true,
            });
        }
        // Skienshallen: parkering, garderobe, dusj, rullestoltilgang
        const sportsAmenities = [0, 1, 2, 8];
        for (const idx of sportsAmenities) {
            await ctx.runMutation(components.catalog.import.importResourceAmenity, {
                tenantId, resourceId: resources[1]._id as string, amenityId: amenityIds[idx] as any,
                quantity: 1, isIncluded: true,
            });
        }
        // Møterom A: projektor, videokonferanse, wifi, rullestoltilgang, heis
        const meetingAmenities = [4, 6, 7, 8, 9];
        for (const idx of meetingAmenities) {
            await ctx.runMutation(components.catalog.import.importResourceAmenity, {
                tenantId, resourceId: resources[2]._id as string, amenityId: amenityIds[idx] as any,
                quantity: 1, isIncluded: true,
            });
        }

        } // end catalog guard

        // =====================================================================
        // SEASONS COMPONENT
        // =====================================================================
        console.log("[Components] Seeding seasons...");

        // Check if seasons already seeded
        const existingSeasons = await ctx.runQuery(
            components.seasons.queries.list,
            { tenantId }
        );

        if (existingSeasons.length > 0) {
            console.log("[Components] Seasons already seeded, skipping...");
        } else {

        // Current season: Vårsesong 2025 (Jan-Jun)
        const { id: springSeasonId } = await ctx.runMutation(
            components.seasons.import.importSeason,
            {
                tenantId,
                name: "Vårsesong 2025",
                description: "Fast leie av haller og lokaler vår 2025",
                startDate: new Date("2025-01-06").getTime(),
                endDate: new Date("2025-06-20").getTime(),
                applicationStartDate: new Date("2024-10-01").getTime(),
                applicationEndDate: new Date("2024-12-01").getTime(),
                status: "active",
                type: "standard",
                settings: { maxApplicationsPerOrg: 5, requiresDeposit: true },
                isActive: true,
            }
        );

        // Upcoming: Høstsesong 2025 (Aug-Dec)
        await ctx.runMutation(
            components.seasons.import.importSeason,
            {
                tenantId,
                name: "Høstsesong 2025",
                description: "Fast leie av haller og lokaler høst 2025",
                startDate: new Date("2025-08-18").getTime(),
                endDate: new Date("2025-12-19").getTime(),
                applicationStartDate: new Date("2025-04-01").getTime(),
                applicationEndDate: new Date("2025-06-01").getTime(),
                status: "upcoming",
                type: "standard",
                isActive: true,
            }
        );

        // Season application: Skien IL applies for Skienshallen on Tue/Thu evenings
        await ctx.runMutation(
            components.seasons.import.importSeasonApplication,
            {
                tenantId,
                seasonId: springSeasonId as any,
                userId: memberUser._id as string,
                organizationId: sportsOrg?._id as string,
                resourceId: resources[1]._id as string,
                weekday: 2, // Tuesday
                startTime: "18:00",
                endTime: "20:00",
                priority: 1,
                status: "approved",
                applicantName: memberUser.name,
                applicantEmail: memberUser.email,
                notes: "Treninger for juniorlaget",
                reviewedBy: adminUser._id as string,
                reviewedAt: now - 30 * oneDay,
            }
        );

        // Seasonal lease from the approved application
        await ctx.runMutation(
            components.seasons.import.importSeasonalLease,
            {
                tenantId,
                resourceId: resources[1]._id as string,
                organizationId: sportsOrg?._id as string ?? "",
                startDate: new Date("2025-01-07").getTime(),
                endDate: new Date("2025-06-19").getTime(),
                weekdays: [2, 4], // Tuesday and Thursday
                startTime: "18:00",
                endTime: "20:00",
                status: "active",
                totalPrice: 24000,
                currency: "NOK",
                notes: "Juniorlagstrening tirsdag og torsdag",
            }
        );

        // Priority rule: Members get priority
        await ctx.runMutation(
            components.seasons.import.importPriorityRule,
            {
                tenantId,
                seasonId: springSeasonId as any,
                name: "Medlemsprioritet",
                description: "Registrerte idrettslag med aktive medlemmer prioriteres",
                rules: [
                    { field: "organizationType", operator: "equals", value: "idrettslag", weight: 10 },
                    { field: "previousSeason", operator: "equals", value: true, weight: 5 },
                    { field: "memberCount", operator: "greaterThan", value: 20, weight: 3 },
                ],
                priority: 1,
                isActive: true,
            }
        );

        } // end seasons guard

        // =====================================================================
        // MESSAGING COMPONENT
        // =====================================================================
        console.log("[Components] Seeding messaging...");

        // Check if messaging already seeded
        const existingConversations = await ctx.runQuery(
            components.messaging.queries.listConversations,
            { userId: memberUser._id as string }
        );

        if (existingConversations.length > 0) {
            console.log("[Components] Messaging already seeded, skipping...");
        } else {

        // Conversation about a booking inquiry
        const { id: conv1Id } = await ctx.runMutation(
            components.messaging.import.importConversation,
            {
                tenantId,
                userId: memberUser._id as string,
                resourceId: resources[0]._id as string,
                participants: [memberUser._id as string, adminUser._id as string],
                subject: "Spørsmål om Ibsenhuset Hovedsal",
                status: "open",
                unreadCount: 1,
                lastMessageAt: now - 2 * 60 * 60 * 1000, // 2 hours ago
                priority: "normal",
            }
        );

        await ctx.runMutation(components.messaging.import.importMessage, {
            tenantId,
            conversationId: conv1Id as any,
            senderId: memberUser._id as string,
            senderType: "user",
            content: "Hei! Er det mulig å leie hovedsalen for en skolekonsert i mars? Vi er ca. 150 personer.",
            messageType: "text",
            attachments: [],
            sentAt: now - 3 * 60 * 60 * 1000,
        });

        await ctx.runMutation(components.messaging.import.importMessage, {
            tenantId,
            conversationId: conv1Id as any,
            senderId: adminUser._id as string,
            senderType: "admin",
            content: "Hei! Ja, det kan absolutt ordnes. Hovedsalen har plass til 500 personer. Skal vi se på tilgjengelige datoer?",
            messageType: "text",
            attachments: [],
            sentAt: now - 2 * 60 * 60 * 1000,
        });

        // Support conversation
        const { id: conv2Id } = await ctx.runMutation(
            components.messaging.import.importConversation,
            {
                tenantId,
                userId: memberUser._id as string,
                participants: [memberUser._id as string, managerUser._id as string],
                subject: "Avbestilling av booking",
                status: "resolved",
                unreadCount: 0,
                lastMessageAt: now - 5 * oneDay,
                assigneeId: managerUser._id as string,
                assignedAt: now - 5 * oneDay,
                resolvedAt: now - 4 * oneDay,
                resolvedBy: managerUser._id as string,
                priority: "high",
            }
        );

        await ctx.runMutation(components.messaging.import.importMessage, {
            tenantId,
            conversationId: conv2Id as any,
            senderId: memberUser._id as string,
            senderType: "user",
            content: "Jeg må dessverre avbestille bookingen for neste uke. Er det mulig å få refundert depositum?",
            messageType: "text",
            attachments: [],
            sentAt: now - 5 * oneDay,
        });

        await ctx.runMutation(components.messaging.import.importMessage, {
            tenantId,
            conversationId: conv2Id as any,
            senderId: managerUser._id as string,
            senderType: "admin",
            content: "Hei! Siden avbestillingen skjer mer enn 72 timer før, refunderer vi fullt depositum. Bookingen er nå kansellert.",
            messageType: "text",
            attachments: [],
            sentAt: now - 5 * oneDay + 30 * 60 * 1000,
            readAt: now - 4 * oneDay,
        });

        } // end messaging guard

        // =====================================================================
        // BILLING COMPONENT
        // =====================================================================
        console.log("[Components] Seeding billing...");

        // Get existing booking for invoice reference
        const bookings = await ctx.runQuery(
            components.bookings.queries.list,
            { tenantId }
        );
        const sampleBookingId = bookings.length > 0 ? bookings[0]._id as string : undefined;

        // Check if billing already seeded
        const existingPayments = await ctx.runQuery(
            components.billing.queries.listPayments,
            { tenantId }
        );

        if (existingPayments.length > 0) {
            console.log("[Components] Billing already seeded, skipping...");
        } else {

        // Payment for a booking
        const { id: paymentId } = await ctx.runMutation(
            components.billing.import.importPayment,
            {
                tenantId,
                bookingId: sampleBookingId,
                userId: memberUser._id as string,
                provider: "vipps",
                reference: `PAY-${Date.now()}`,
                externalId: "vipps-ext-001",
                amount: 5000,
                currency: "NOK",
                description: "Betaling for booking av Ibsenhuset Hovedsal",
                status: "captured",
                capturedAmount: 5000,
                createdAt: now - 7 * oneDay,
                updatedAt: now - 7 * oneDay,
            }
        );

        // Invoice (paid)
        await ctx.runMutation(
            components.billing.import.importInvoice,
            {
                tenantId,
                userId: memberUser._id as string,
                organizationId: sportsOrg?._id as string,
                invoiceNumber: "FAK-2025-001",
                reference: "Sesongavtale vår 2025",
                status: "paid",
                issueDate: now - 30 * oneDay,
                dueDate: now - 16 * oneDay,
                paidDate: now - 20 * oneDay,
                subtotal: 19200,
                taxAmount: 4800,
                totalAmount: 24000,
                currency: "NOK",
                lineItems: [
                    {
                        id: "line-1",
                        description: "Skienshallen — Sesongavtale tirsdag/torsdag 18:00-20:00 (24 uker)",
                        quantity: 48,
                        unitPrice: 400,
                        amount: 19200,
                        taxRate: 25,
                        taxAmount: 4800,
                        resourceId: resources[1]?._id as string,
                    },
                ],
                bookingIds: sampleBookingId ? [sampleBookingId] : [],
                paymentId,
                paymentMethod: "invoice",
                customerName: sportsOrg?.name ?? "Skien Idrettslag",
                customerEmail: "post@skienidrettslag.no",
                customerAddress: "Idrettsveien 1, 3724 Skien",
                customerOrgNumber: "987654321",
                billingAddress: {
                    street: "Idrettsveien 1",
                    postalCode: "3724",
                    city: "Skien",
                    country: "NO",
                },
                createdAt: now - 30 * oneDay,
                updatedAt: now - 20 * oneDay,
                createdBy: adminUser._id as string,
            }
        );

        // Invoice (pending)
        await ctx.runMutation(
            components.billing.import.importInvoice,
            {
                tenantId,
                userId: memberUser._id as string,
                invoiceNumber: "FAK-2025-002",
                reference: "Leie av Ibsenhuset Hovedsal",
                status: "sent",
                issueDate: now - 3 * oneDay,
                dueDate: now + 11 * oneDay,
                subtotal: 8000,
                taxAmount: 2000,
                totalAmount: 10000,
                currency: "NOK",
                lineItems: [
                    {
                        id: "line-1",
                        description: "Ibsenhuset Hovedsal — 4 timer á 1000 kr",
                        quantity: 4,
                        unitPrice: 1000,
                        amount: 4000,
                        taxRate: 25,
                        taxAmount: 1000,
                        resourceId: resources[0]?._id as string,
                    },
                    {
                        id: "line-2",
                        description: "Rengjøring",
                        quantity: 1,
                        unitPrice: 1500,
                        amount: 1500,
                        taxRate: 25,
                        taxAmount: 375,
                    },
                    {
                        id: "line-3",
                        description: "Depositum",
                        quantity: 1,
                        unitPrice: 2000,
                        amount: 2000,
                        taxRate: 25,
                        taxAmount: 500,
                    },
                    {
                        id: "line-4",
                        description: "Serviceavgift",
                        quantity: 1,
                        unitPrice: 500,
                        amount: 500,
                        taxRate: 25,
                        taxAmount: 125,
                    },
                ],
                paymentMethod: "vipps",
                customerName: memberUser.name ?? "Bruker",
                customerEmail: memberUser.email,
                notes: "Betaling innen 14 dager",
                createdAt: now - 3 * oneDay,
                updatedAt: now - 3 * oneDay,
                createdBy: adminUser._id as string,
            }
        );

        } // end billing guard

        // =====================================================================
        // COMPONENT REGISTRY
        // =====================================================================
        console.log("[Components] Seeding component registry...");
        const moduleEntries = [
            { id: "audit", name: "Audit Logging", category: "infrastructure", isCore: true },
            { id: "reviews", name: "Reviews & Ratings", category: "domain", isCore: false },
            { id: "notifications", name: "Notifications", category: "domain", isCore: true },
            { id: "userPrefs", name: "User Preferences", category: "domain", isCore: false },
            { id: "messaging", name: "Messaging", category: "domain", isCore: false },
            { id: "catalog", name: "Categories & Amenities", category: "domain", isCore: true },
            { id: "analytics", name: "Analytics & Reporting", category: "domain", isCore: false },
            { id: "bookings", name: "Booking Engine", category: "domain", isCore: true },
            { id: "pricing", name: "Pricing Engine", category: "domain", isCore: true },
            { id: "addons", name: "Addons & Extras", category: "domain", isCore: false },
            { id: "seasons", name: "Seasonal Management", category: "domain", isCore: false },
            { id: "auth", name: "Authentication", category: "infrastructure", isCore: true },
            { id: "rbac", name: "Roles & Permissions", category: "infrastructure", isCore: true },
            { id: "billing", name: "Billing & Invoicing", category: "domain", isCore: true },
            { id: "compliance", name: "GDPR Compliance", category: "infrastructure", isCore: true },
            { id: "tenantConfig", name: "Feature Flags & Branding", category: "platform", isCore: false },
            { id: "integrations", name: "External Integrations", category: "infrastructure", isCore: false },
        ];

        for (const entry of moduleEntries) {
            // Check if already exists
            const existing = await ctx.db
                .query("componentRegistry")
                .withIndex("by_component", (q) =>
                    q.eq("tenantId", tenant._id).eq("componentId", entry.id)
                )
                .first();

            if (!existing) {
                await ctx.db.insert("componentRegistry", {
                    tenantId: tenant._id,
                    componentId: entry.id,
                    name: entry.name,
                    category: entry.category,
                    version: "1.0.0",
                    contractVersion: "1.0.0",
                    isCore: entry.isCore,
                    isEnabled: true,
                    isInstalled: true,
                    features: [],
                    installedAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
        }

        // =====================================================================
        // FEATURE FLAGS (tenant-config component)
        // =====================================================================
        console.log("[Components] Seeding feature flags...");

        const flagDefs = [
            {
                key: "seasonal_leases",
                name: "Sesongutleie",
                type: "boolean",
                defaultValue: true,
                description: "Aktiver sesongutleie-modulen for langtidsavtaler",
            },
            {
                key: "approval_workflow",
                name: "Godkjenningsflyt",
                type: "boolean",
                defaultValue: false,
                description: "Krev godkjenning for alle bookinger",
            },
            {
                key: "messaging",
                name: "Meldinger",
                type: "boolean",
                defaultValue: true,
                description: "Aktiver meldingssystem mellom brukere og administratorer",
            },
            {
                key: "analytics",
                name: "Analyse",
                type: "boolean",
                defaultValue: true,
                description: "Aktiver analyse-dashbord og rapporter",
            },
            {
                key: "integrations",
                name: "Integrasjoner",
                type: "boolean",
                defaultValue: false,
                description: "Aktiver tredjepartsintegrasjoner (Vipps, ERP, etc.)",
            },
            {
                key: "new_booking_flow",
                name: "Ny bookingflyt",
                type: "boolean",
                defaultValue: false,
                description: "Bruk den nye flerstegs bookingflyten med forbedret tilgjengelighetssjekk",
            },
        ];

        // Check if flags already seeded
        const existingFlags = await ctx.runQuery(
            components.tenantConfig.queries.listFlags,
            { tenantId }
        );

        if (existingFlags.length === 0) {
            for (const flag of flagDefs) {
                await ctx.runMutation(components.tenantConfig.mutations.createFlag, {
                    tenantId,
                    key: flag.key,
                    name: flag.name,
                    type: flag.type,
                    defaultValue: flag.defaultValue,
                    description: flag.description,
                });
            }
        } else {
            console.log("[Components] Feature flags already seeded, skipping...");
        }

        console.log("[Components] Component seed complete!");
        return { success: true, tenantId, componentsSeeded: moduleEntries.length };
    },
});

/**
 * Reset component tables. Clears all data from component tables.
 * Does NOT touch app-level tables.
 */
export const resetAll = mutation({
    args: {},
    handler: async (ctx) => {
        let deleted = 0;

        // Clear component registry
        const registry = await ctx.db.query("componentRegistry").collect();
        for (const doc of registry) {
            await ctx.db.delete(doc._id);
            deleted++;
        }

        // Clear outbox events
        const events = await ctx.db.query("outboxEvents").collect();
        for (const doc of events) {
            await ctx.db.delete(doc._id);
            deleted++;
        }

        console.log(`[Components] Deleted ${deleted} documents from core component tables`);
        return { success: true, deleted };
    },
});
