/**
 * Dev-Docs Convex Seed Data
 *
 * Initial data for production readiness tracking.
 * Run after `npx convex dev` to populate the database.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed all initial data (categories, milestones, baseline history).
 */
export const seedAll = mutation({
    args: {},
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx) => {
        // 1. Seed Category Scores (baseline from production-readiness-analysis.md)
        const categories = [
            { category: "architecture", weight: 15, currentScore: 60, targetScore: 100, notes: "7/18 components migrated" },
            { category: "testing", weight: 20, currentScore: 50, targetScore: 90, notes: "Unit tests good, E2E weak" },
            { category: "security", weight: 20, currentScore: 30, targetScore: 90, notes: "Implementation unclear" },
            { category: "performance", weight: 10, currentScore: 20, targetScore: 85, notes: "No monitoring" },
            { category: "documentation", weight: 5, currentScore: 80, targetScore: 100, notes: "Comprehensive docs exist" },
            { category: "cicd", weight: 5, currentScore: 60, targetScore: 95, notes: "E2E disabled in CI" },
            { category: "monitoring", weight: 10, currentScore: 20, targetScore: 95, notes: "No production monitoring" },
            { category: "compliance", weight: 15, currentScore: 25, targetScore: 90, notes: "Component not activated" },
        ];

        const existingCats = await ctx.db.query("categoryScores").collect();
        for (const cat of existingCats) {
            await ctx.db.delete(cat._id);
        }
        for (const cat of categories) {
            await ctx.db.insert("categoryScores", { ...cat, updatedAt: Date.now() });
        }

        // 2. Seed Milestones
        const milestones = [
            { name: "Foundation Complete", targetWeek: 4, targetScore: 67, status: "active", description: "Auth, RBAC, Tenant Isolation operational", phase: "foundation" },
            { name: "Core Complete", targetWeek: 8, targetScore: 88, status: "upcoming", description: "All components migrated, security hardened", phase: "core" },
            { name: "Production Ready", targetWeek: 12, targetScore: 100, status: "upcoming", description: "Full platform ready for production", phase: "production" },
        ];

        const existingMilestones = await ctx.db.query("milestones").collect();
        for (const m of existingMilestones) {
            await ctx.db.delete(m._id);
        }
        for (const m of milestones) {
            await ctx.db.insert("milestones", { ...m, status: m.status as "upcoming" | "active" | "completed" });
        }

        // 3. Seed Week 0 Score History
        const existingHistory = await ctx.db.query("scoreHistory").collect();
        for (const h of existingHistory) {
            await ctx.db.delete(h._id);
        }

        await ctx.db.insert("scoreHistory", {
            weekNumber: 0,
            totalScore: 47,
            categoryScores: {
                architecture: 60,
                testing: 50,
                security: 30,
                performance: 20,
                documentation: 80,
                cicd: 60,
                monitoring: 20,
                compliance: 25,
            },
            completedTickets: [],
            notes: "Baseline from production readiness analysis",
            timestamp: Date.now(),
        });

        // 4. Seed Tickets (Track A and B from roadmap)
        const tickets = [
            { ticketId: "A1", title: "RBAC and Auth Migration", status: "todo", priority: "critical", phase: "foundation", track: "A", sprint: 1, estimatedWeeks: 2, dependencies: [], scoreImpact: 8, category: "architecture", description: "Migrate RBAC and Auth components to isolated tables" },
            { ticketId: "A2", title: "Bookings and Addons Migration", status: "todo", priority: "high", phase: "foundation", track: "A", sprint: 2, estimatedWeeks: 2, dependencies: ["A1"], scoreImpact: 7, category: "architecture", description: "Migrate bookings and addons to component tables" },
            { ticketId: "A3", title: "Pricing and Billing Migration", status: "todo", priority: "high", phase: "core", track: "A", sprint: 3, estimatedWeeks: 2, dependencies: ["A2"], scoreImpact: 7, category: "architecture", description: "Migrate pricing and billing components" },
            { ticketId: "A4", title: "Seasons Migration and Cleanup", status: "todo", priority: "medium", phase: "core", track: "A", sprint: 4, estimatedWeeks: 2, dependencies: ["A3"], scoreImpact: 5, category: "architecture", description: "Migrate seasons, remove old table definitions" },
            { ticketId: "B1", title: "Rate Limiting and Secrets", status: "todo", priority: "critical", phase: "foundation", track: "B", sprint: 1, estimatedWeeks: 2, dependencies: [], scoreImpact: 6, category: "security", description: "Implement rate limiting and secrets encryption" },
            { ticketId: "B2", title: "GDPR Compliance", status: "todo", priority: "high", phase: "core", track: "B", sprint: 2, estimatedWeeks: 2, dependencies: ["B1"], scoreImpact: 5, category: "compliance", description: "Activate GDPR compliance features" },
            { ticketId: "B3", title: "Security Testing Suite", status: "todo", priority: "high", phase: "core", track: "B", sprint: 3, estimatedWeeks: 2, dependencies: ["B2"], scoreImpact: 4, category: "security", description: "Automated security testing in CI" },
            { ticketId: "C1", title: "Performance Baseline", status: "todo", priority: "high", phase: "foundation", track: "C", sprint: 2, estimatedWeeks: 2, dependencies: [], scoreImpact: 5, category: "performance", description: "Establish performance baselines" },
            { ticketId: "C2", title: "Testing Expansion", status: "todo", priority: "medium", phase: "core", track: "C", sprint: 3, estimatedWeeks: 2, dependencies: ["C1"], scoreImpact: 4, category: "testing", description: "Enable E2E in CI, expand coverage" },
            { ticketId: "C3", title: "CI/CD Enhancement", status: "todo", priority: "medium", phase: "core", track: "C", sprint: 4, estimatedWeeks: 2, dependencies: ["C2"], scoreImpact: 3, category: "cicd", description: "Production deployment pipeline" },
            { ticketId: "D1", title: "Web and Minside Completion", status: "todo", priority: "medium", phase: "core", track: "D", sprint: 2, estimatedWeeks: 4, dependencies: ["A2"], scoreImpact: 4, category: "testing", description: "Complete Web and Minside apps" },
            { ticketId: "D2", title: "Dashboard and Backoffice", status: "todo", priority: "medium", phase: "core", track: "D", sprint: 4, estimatedWeeks: 4, dependencies: ["A3"], scoreImpact: 5, category: "testing", description: "Build Dashboard and Backoffice apps" },
            { ticketId: "D3", title: "Monitoring App", status: "todo", priority: "medium", phase: "production", track: "D", sprint: 5, estimatedWeeks: 2, dependencies: ["D2"], scoreImpact: 4, category: "monitoring", description: "Build Monitoring application" },
            { ticketId: "E1", title: "Documentation and Runbooks", status: "todo", priority: "medium", phase: "production", track: "E", sprint: 5, estimatedWeeks: 2, dependencies: ["A4"], scoreImpact: 3, category: "documentation", description: "Create deployment runbooks" },
            { ticketId: "E2", title: "Environment Setup", status: "todo", priority: "high", phase: "production", track: "E", sprint: 6, estimatedWeeks: 2, dependencies: ["E1", "B3", "C3", "D3"], scoreImpact: 4, category: "cicd", description: "Configure production environment" },
            { ticketId: "E3", title: "Deployment and Smoke Testing", status: "todo", priority: "high", phase: "production", track: "E", sprint: 7, estimatedWeeks: 2, dependencies: ["E2"], scoreImpact: 3, category: "cicd", description: "Blue-green deployment pipeline" },
            { ticketId: "E4", title: "Monitoring and Alerting", status: "todo", priority: "high", phase: "production", track: "E", sprint: 8, estimatedWeeks: 2, dependencies: ["E3"], scoreImpact: 3, category: "monitoring", description: "Production monitoring and on-call" },
        ];

        const existingTickets = await ctx.db.query("tickets").collect();
        for (const t of existingTickets) {
            await ctx.db.delete(t._id);
        }
        for (const t of tickets) {
            await ctx.db.insert("tickets", {
                ...t,
                status: t.status as "todo" | "in-progress" | "done" | "blocked",
                priority: t.priority as "critical" | "high" | "medium" | "low",
            });
        }

        return { success: true };
    },
});
