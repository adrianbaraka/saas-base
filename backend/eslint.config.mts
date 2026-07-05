import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: { globals: globals.node },
	},
	...tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"@typescript-eslint/no-floating-promises": "error",

			"@typescript-eslint/no-misused-promises": "error", // Promise in boolean/void context
			"@typescript-eslint/no-explicit-any": "error", // any bypasses all type safety

			// correctness
			"@typescript-eslint/no-unnecessary-condition": "error", // if (true) / if (x === x) dead code
			"@typescript-eslint/switch-exhaustiveness-check": "error", // unhandled enum cases

			// data integrity
			"@typescript-eslint/no-non-null-assertion": "error", // forbids the ! operator
		},
	},
]);
