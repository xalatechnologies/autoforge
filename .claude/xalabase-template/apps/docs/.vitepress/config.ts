import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'XalaBaaS',
    description: 'Documentation for XalaBaaS Platform',

    themeConfig: {
        logo: '/logo.svg',

        nav: [
            { text: 'Home', link: '/' },
            { text: 'Architecture', link: '/architecture/' },
            { text: 'SDK', link: '/sdk/' },
            { text: 'Runbooks', link: '/runbooks/' },
        ],

        sidebar: {
            '/architecture/': [
                {
                    text: 'Architecture',
                    items: [
                        { text: 'Overview', link: '/architecture/' },
                        { text: 'App Contract', link: '/architecture/contracts' },
                        { text: 'Kernel', link: '/architecture/kernel' },
                        { text: 'Apps', link: '/architecture/apps' },
                    ],
                },
            ],
            '/sdk/': [
                {
                    text: 'SDK',
                    items: [
                        { text: 'Getting Started', link: '/sdk/' },
                        { text: 'API Reference', link: '/sdk/api-reference' },
                    ],
                },
            ],
            '/runbooks/': [
                {
                    text: 'Runbooks',
                    items: [
                        { text: 'Local Development', link: '/runbooks/local' },
                        { text: 'Production', link: '/runbooks/production' },
                    ],
                },
            ],
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/xala-technologies/xalabase' },
        ],

        footer: {
            message: 'XalaBaaS Platform Documentation',
            copyright: 'Copyright © 2026 Xala Technologies',
        },
    },
});
