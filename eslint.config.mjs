import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["**/dist/**", "**/node_modules/**", "**/.turbo/**"],
    },
    {
        files: ["**/*.{js,mjs,cjs}"],
        ...eslint.configs.recommended,
    },
    {
        files: ["**/*.{ts,tsx,mts,cts}"],
        extends: [...tseslint.configs.recommended],
    },

    prettier,
);
