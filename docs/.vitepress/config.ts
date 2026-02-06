import { defineConfig } from 'vitepress';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItMark from 'markdown-it-mark';
import markdownItAttrs from 'markdown-it-attrs';
import { bare as markdownItEmoji } from 'markdown-it-emoji';
import markdownItAbbr from 'markdown-it-abbr';

export default defineConfig({
    title: 'XalaBaaS',
    description: 'Multi-tenant Backend-as-a-Service on Convex',

    head: [
        ['link', { rel: 'icon', href: '/favicon.ico' }],
        ['link', { rel: 'stylesheet', href: '/themes/digilist.css' }],
        ['link', { rel: 'stylesheet', href: '/themes/xala-navy-extensions.css' }],
        // Enhanced typography: Inter for body, Space Grotesk for headings
        ['link', { rel: 'preconnect', href: 'https://rsms.me' }],
        ['link', { rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css' }],
        ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
        ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
        ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap' }],
        // Meta tags for better SEO and sharing
        ['meta', { name: 'theme-color', content: '#3b82f6' }],
        ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
        ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    ],

    markdown: {
        lineNumbers: true,
        config: (md) => {
            // Task lists: - [ ] and - [x]
            md.use(markdownItTaskLists, { enabled: true, label: true });

            // Footnotes: [^1] and [^1]: definition
            md.use(markdownItFootnote);

            // Mark/highlight: ==text==
            md.use(markdownItMark);

            // Attributes: {.class #id key=value}
            md.use(markdownItAttrs);

            // Emoji: :smile: or native emoji
            md.use(markdownItEmoji, {
                shortcuts: {},
            });

            // Abbreviations: *[HTML]: HyperText Markup Language
            md.use(markdownItAbbr);
        },
    },

    vite: {
        server: {
            port: 9050,
        },
    },

    themeConfig: {
        logo: '/logo.svg',

        nav: [
            { text: 'Guide', link: '/guide/' },
            { text: 'API', link: '/api/' },
            { text: 'SDK', link: '/sdk/' },
            { text: 'Schema', link: '/database/' },
            { text: 'Platform', link: '/platform/' },
            { text: 'Domain', link: '/domain/overview' },
            { text: 'Applications', link: '/applications/' },
            { text: 'ADR', link: '/adr/' },
            { text: 'Planning', link: '/planning/' },
        ],

        sidebar: {
            '/guide/': [
                {
                    text: 'Getting Started',
                    items: [
                        { text: 'Introduction', link: '/guide/' },
                        { text: 'Quick Start', link: '/guide/quick-start' },
                        { text: 'Architecture', link: '/guide/architecture' },
                    ],
                },
                {
                    text: 'Core Concepts',
                    items: [
                        { text: 'Multi-Tenancy', link: '/guide/multi-tenancy' },
                        { text: 'Authentication', link: '/guide/authentication' },
                        { text: 'Authorization (RBAC)', link: '/guide/authorization' },
                        { text: 'Feature Flags', link: '/guide/feature-flags' },
                    ],
                },
                {
                    text: 'Advanced',
                    items: [
                        { text: 'Billing & Entitlements', link: '/guide/billing' },
                        { text: 'Governance', link: '/guide/governance' },
                        { text: 'Realtime Events', link: '/guide/realtime' },
                    ],
                },
            ],
            '/api/': [
                {
                    text: 'Functions',
                    items: [
                        { text: 'Overview', link: '/api/' },
                        { text: 'Functions Reference', link: '/CONVEX_FUNCTIONS' },
                        { text: 'RBAC', link: '/api/rbac' },
                        { text: 'Auth', link: '/api/auth' },
                        { text: 'Feature Flags', link: '/api/flags' },
                        { text: 'Billing', link: '/api/billing' },
                        { text: 'GraphQL', link: '/api/graphql' },
                        { text: 'Governance', link: '/api/governance' },
                    ],
                },
            ],
            '/sdk/': [
                {
                    text: 'SDK Reference',
                    items: [
                        { text: 'Installation', link: '/sdk/' },
                        { text: 'XalaClient', link: '/sdk/client' },
                        { text: 'Queries', link: '/sdk/queries' },
                        { text: 'Mutations', link: '/sdk/mutations' },
                        { text: 'Realtime', link: '/sdk/realtime' },
                        { text: 'Error Handling', link: '/sdk/errors' },
                    ],
                },
            ],
            '/database/': [
                {
                    text: 'Database',
                    items: [
                        { text: 'Schema Overview', link: '/database/' },
                    ],
                },
            ],
            '/platform/': [
                {
                    text: 'Platform Overview',
                    items: [
                        { text: 'Introduction', link: '/platform/' },
                    ],
                },
                {
                    text: 'Architecture',
                    items: [
                        { text: 'Component Architecture', link: '/platform/architecture/component-architecture' },
                        { text: 'Multi-Tenant Architecture', link: '/platform/architecture/multi-tenant-architecture' },
                        { text: 'Event-Driven Architecture', link: '/platform/architecture/event-driven-architecture' },
                    ],
                },
                {
                    text: 'Components',
                    items: [
                        { text: 'Auth Component', link: '/platform/components/auth-component' },
                        { text: 'RBAC Component', link: '/platform/components/rbac-component' },
                        { text: 'Billing Component', link: '/platform/components/billing-component' },
                        { text: 'Pricing Component', link: '/platform/components/pricing-component' },
                        { text: 'Analytics Component', link: '/platform/components/analytics-component' },
                        { text: 'Compliance Component', link: '/platform/components/compliance-component' },
                    ],
                },
                {
                    text: 'Systems',
                    items: [
                        { text: 'RBAC Permission System', link: '/platform/systems/rbac-permission-system' },
                        { text: 'Resource Booking System', link: '/platform/systems/resource-booking-system' },
                    ],
                },
                {
                    text: 'Infrastructure',
                    items: [
                        { text: 'Deployment', link: '/platform/infrastructure/deployment' },
                        { text: 'Monitoring', link: '/platform/infrastructure/monitoring' },
                        { text: 'Scaling', link: '/platform/infrastructure/scaling' },
                    ],
                },
            ],
            '/domain/': [
                {
                    text: 'Domain Overview',
                    items: [
                        { text: 'Introduction', link: '/domain/overview' },
                    ],
                },
                {
                    text: 'Public Pages',
                    items: [
                        { text: 'Sport Detail Page', link: '/domain/public-pages/sport-detail-page' },
                        { text: 'Venues Detail Page', link: '/domain/public-pages/venues-detail-page' },
                        { text: 'Events Detail Page', link: '/domain/public-pages/events-detail-page' },
                        { text: 'Equipment Detail Page', link: '/domain/public-pages/equipment-detail-page' },
                    ],
                },
                {
                    text: 'Admin Interfaces',
                    items: [
                        { text: 'Rental Object Admin', link: '/domain/admin/rental-object-admin' },
                        { text: 'Booking Management', link: '/domain/admin/booking-management' },
                        { text: 'User Management', link: '/domain/admin/user-management' },
                        { text: 'Reporting & Analytics', link: '/domain/admin/reporting-analytics' },
                        { text: 'Category Management', link: '/domain/admin/category-management' },
                    ],
                },
                {
                    text: 'Data Models',
                    items: [
                        { text: 'Base Resource', link: '/domain/data-models/base-resource' },
                        { text: 'Sport Model', link: '/domain/data-models/sport-model' },
                        { text: 'Venues Model', link: '/domain/data-models/venues-model' },
                        { text: 'Events Model', link: '/domain/data-models/events-model' },
                        { text: 'Equipment Model', link: '/domain/data-models/equipment-model' },
                    ],
                },
                {
                    text: 'Workflows',
                    items: [
                        { text: 'Booking Flow', link: '/domain/workflows/booking-flow' },
                        { text: 'Registration Flow', link: '/domain/workflows/registration-flow' },
                        { text: 'Rental Flow', link: '/domain/workflows/rental-flow' },
                        { text: 'Season Booking', link: '/domain/workflows/season-booking' },
                        { text: 'Payment Flow', link: '/domain/workflows/payment-flow' },
                    ],
                },
                {
                    text: 'Integrations',
                    items: [
                        { text: 'Payment Integration', link: '/domain/integrations/payment-integration' },
                        { text: 'Notification Templates', link: '/domain/integrations/notification-templates' },
                        { text: 'Calendar Integration', link: '/domain/integrations/calendar-integration' },
                        { text: 'Auth Providers', link: '/domain/integrations/auth-providers' },
                        { text: 'Map Integration', link: '/domain/integrations/map-integration' },
                        { text: 'Vipps Integration', link: '/domain/integrations/vipps-integration' },
                    ],
                },
                {
                    text: 'API',
                    items: [
                        { text: 'REST API', link: '/domain/api/rest-api' },
                        { text: 'Webhooks', link: '/domain/api/webhooks' },
                        { text: 'GraphQL Schema', link: '/domain/api/graphql-schema' },
                        { text: 'Listings API', link: '/domain/api/listings-api' },
                        { text: 'Bookings API', link: '/domain/api/bookings-api' },
                    ],
                },
            ],
            '/applications/': [
                {
                    text: 'Applications Overview',
                    items: [
                        { text: 'Introduction', link: '/applications/' },
                    ],
                },
                {
                    text: 'Web',
                    items: [
                        { text: 'Public Booking Web App', link: '/applications/web/public-booking-web-app' },
                        { text: 'Responsive Design', link: '/applications/web/responsive-design' },
                    ],
                },
                {
                    text: 'Backoffice',
                    items: [
                        { text: 'Backoffice Admin App', link: '/applications/backoffice/backoffice-admin-app' },
                    ],
                },
                {
                    text: 'Dashboard',
                    items: [
                        { text: 'Dashboard App', link: '/applications/dashboard/dashboard-app' },
                        { text: 'Analytics Dashboard', link: '/applications/dashboard/analytics-dashboard' },
                    ],
                },
                {
                    text: 'Minside',
                    items: [
                        { text: 'Minside App', link: '/applications/minside/minside-app' },
                        { text: 'User Portal', link: '/applications/minside/user-portal' },
                    ],
                },
                {
                    text: 'Monitoring',
                    items: [
                        { text: 'Monitoring App', link: '/applications/monitoring/monitoring-app' },
                        { text: 'System Monitoring', link: '/applications/monitoring/system-monitoring' },
                    ],
                },
            ],
            '/adr/': [
                {
                    text: 'Architecture Decision Records',
                    items: [
                        { text: 'Overview', link: '/adr/' },
                        { text: 'ADR-001: Convex Components', link: '/adr/001-convex-components-architecture' },
                        { text: 'ADR-002: Facade Pattern', link: '/adr/002-facade-pattern' },
                        { text: 'ADR-003: Outbox Event Bus', link: '/adr/003-outbox-event-bus' },
                        { text: 'ADR-004: Migration Strategy', link: '/adr/004-component-migration-strategy' },
                    ],
                },
            ],
            '/planning/': [
                {
                    text: 'Planning',
                    items: [
                        { text: 'Overview', link: '/planning/' },
                        { text: '📊 Dashboard', link: '/planning/dashboard' },
                        { text: 'Sprint Plan', link: '/planning/sprint-plan' },
                        { text: 'Implementation Plan', link: '/planning/implementation-plan' },
                    ],
                },
                {
                    text: 'Foundation Phase',
                    collapsed: false,
                    items: [
                        { text: '#01 Tenant Isolation', link: '/planning/tickets/01-tenant-isolation' },
                        { text: '#02 Authentication', link: '/planning/tickets/02-authentication-system' },
                        { text: '#03 RBAC', link: '/planning/tickets/03-rbac-permission-system' },
                    ],
                },
                {
                    text: 'Core Domain Phase',
                    collapsed: false,
                    items: [
                        { text: '#04 Booking System', link: '/planning/tickets/04-resource-booking-system' },
                        { text: '#05 Event Architecture', link: '/planning/tickets/05-event-driven-architecture' },
                        { text: '#06 Payment Integration', link: '/planning/tickets/06-payment-integration' },
                        { text: '#07 Notifications', link: '/planning/tickets/07-notification-system' },
                        { text: '#09 Search & Filtering', link: '/planning/tickets/09-search-filtering' },
                    ],
                },
                {
                    text: 'Applications Phase',
                    collapsed: false,
                    items: [
                        { text: '#08 Public Web App', link: '/planning/tickets/08-public-web-app' },
                        { text: '#10 Dashboard App', link: '/planning/tickets/10-dashboard-app' },
                        { text: '#11 Minside App', link: '/planning/tickets/11-minside-app' },
                        { text: '#12 Backoffice App', link: '/planning/tickets/12-backoffice-app' },
                        { text: '#13 Monitoring App', link: '/planning/tickets/13-monitoring-app' },
                    ],
                },
                {
                    text: 'Enhancements Phase',
                    collapsed: false,
                    items: [
                        { text: '#14 Reviews & Ratings', link: '/planning/tickets/14-review-rating-system' },
                        { text: '#15 Internationalization', link: '/planning/tickets/15-internationalization' },
                    ],
                },
                {
                    text: 'Component Architecture Phase',
                    collapsed: false,
                    items: [
                        { text: '#16 Component Migrations', link: '/planning/tickets/16-component-migrations' },
                        { text: '#17 Contracts & Lifecycle', link: '/planning/tickets/17-component-contracts-lifecycle' },
                        { text: '#18 Component Testing', link: '/planning/tickets/18-component-testing' },
                    ],
                },
            ],
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/xala/xalabase' },
        ],

        footer: {
            message: 'MIT License',
            copyright: 'Copyright © 2024-2026 Xala Technologies',
        },

        search: {
            provider: 'local',
        },
    },
});
