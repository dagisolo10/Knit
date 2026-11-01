import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["**/dist/**", "**/node_modules/**", "**/.turbo/**"],
    },
    {
        files: ["**/*.{js,mjs,cjs}"],
        ...eslint.configs.recommended,
        languageOptions: {
            globals: globals.node,
        },
    },
    {
        files: ["**/*.{ts,tsx,mts,cts}"],
        extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    },

    prettier,
);
