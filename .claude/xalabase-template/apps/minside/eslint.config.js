import { apps } from '@xala/eslint-config';

export default [
    ...apps,
    {
        ignores: ['dist/**', 'build/**', 'node_modules/**', 'dev-dist/**', 'public/**', '**/workbox-*.js'],
    },
];
