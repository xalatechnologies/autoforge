/**
 * @xala/eslint-config - Shared ESLint configuration
 * 
 * ESLint v9 flat config format for the Xala monorepo.
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Base config for all projects
export const base = [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
            },
        },
        rules: {
            // TypeScript-specific rules
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'off',

            // General rules
            'no-console': 'warn',
            'prefer-const': 'error',
        },
    },
];

// Config for apps (React/Vite)
export const apps = [
    ...base,
    {
        files: ['**/*.tsx', '**/*.jsx'],
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            // React-specific rules
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
        },
    },
    {
        ignores: [
            'dist/**',
            'build/**',
            'node_modules/**',
            '.vite/**',
            'dev-dist/**',
            'public/service-worker.js',
            '**/workbox-*.js',
        ],
    },
];

// Config for packages (libraries)
export const packages = [
    ...base,
    {
        ignores: ['dist/**', 'build/**', 'node_modules/**'],
    },
];

export default { base, apps, packages };
