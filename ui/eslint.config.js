import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';
import svelteConfig from './svelte.config.js';

export default ts.config(
   js.configs.recommended,
   ...ts.configs.recommended,
   ...svelte.configs.recommended,
   prettierConfig,
   {
      languageOptions: {
         globals: {
            ...globals.browser,
            ...globals.node,
         },
      },
   },
   {
      rules: {
         '@typescript-eslint/no-explicit-any': 'warn',
         '@typescript-eslint/no-unused-vars': [
            'warn',
            { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
         ],
         '@typescript-eslint/no-unused-expressions': 'off',
      },
   },
   {
      files: ['**/*.test.ts', '**/*.test.js'],
      rules: {
         '@typescript-eslint/no-explicit-any': 'off',
         '@typescript-eslint/no-unused-vars': 'off',
      },
   },
   {
      files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
      languageOptions: {
         parserOptions: {
            extraFileExtensions: ['.svelte'],
            parser: ts.parser,
            svelteConfig,
         },
      },
      rules: {
         'svelte/require-each-key': 'warn',
         'svelte/no-at-html-tags': 'warn',
         'svelte/no-navigation-without-resolve': 'off',
         'svelte/prefer-writable-derived': 'warn',
         'svelte/prefer-svelte-reactivity': 'warn',
      },
   },
   {
      ignores: [
         'build/',
         '.svelte-kit/',
         'dist/',
         'node_modules/',
         '.skeleton/',
      ],
   },
);
