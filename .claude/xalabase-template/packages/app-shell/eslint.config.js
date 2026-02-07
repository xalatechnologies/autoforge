import { packages } from '@xala/eslint-config';

export default [
    ...packages,
    {
        ignores: ['dist/**', 'build/**', 'node_modules/**'],
    },
];
