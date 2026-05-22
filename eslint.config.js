import js from '@eslint/js';
import sveltePlugin from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...sveltePlugin.configs['flat/recommended'],
	{
		rules: {
			'svelte/no-at-html-tags': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
		}
	},
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		ignores: [
			'.svelte-kit/',
			'build/',
			'.vercel/',
			'node_modules/',
			'static/data.js'
		]
	}
);
