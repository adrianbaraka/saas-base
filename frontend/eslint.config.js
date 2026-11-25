import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		ignores: ['.svelte-kit/**', 'build/**', 'dist/**', 'node_modules/**']
	},

	{
		files: ['**/*.{js,mjs,cjs}'],
		plugins: { js },
		extends: ['js/recommended'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},

	{
		files: ['**/*.{ts,mts,cts}'],
		extends: [tseslint.configs.recommended]
	},

	{
		files: ['**/*.svelte'],
		extends: [...svelte.configs['flat/recommended']],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			},
			globals: {
				...globals.browser,
				...globals.node
			}
		},
		rules: {
			'svelte/no-navigation-without-resolve': [
				'off',
				{
					ignoreGoto: false,
					ignoreLinks: false,
					ignorePushState: false,
					ignoreReplaceState: false
				}
			]
		}
	},

	{
		files: [
			'**/+page.server.ts',
			'**/+layout.server.ts',
			'**/+server.ts',
			'src/hooks.server.ts',
			'src/lib/server/**'
		],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['**/toastStore.svelte', '**/modalStore.svelte', '**/sidebarStore.svelte'],
							message:
								'UI stores are client-only. Return data from load/actions and trigger UI state client-side instead.'
						}
					]
				}
			]
		}
	}
]);
