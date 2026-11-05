import * as p from "@clack/prompts";
import { access, writeFile } from "fs/promises";
import path from "path";
import { tsImport } from "tsx/esm/api";
import { pathToFileURL } from "url";

/**
 * Configuration for Knit, typically created with {@link defineConfig} and
 * exported from `knit.config.ts`.
 */
export interface KnitConfig {
    /** Directory to scan for route files. Relative paths are resolved from the current working directory when loaded. */
    srcDir: string;
}

/**
 * Defines a Knit configuration.
 *
 * This is an identity helper that provides type checking and autocomplete for
 * `knit.config.ts`.
 *
 * @param config - The Knit configuration.
 * @returns The same configuration object.
 */
export function defineConfig(config: KnitConfig): KnitConfig {
    return config;
}

/**
 * Loads and validates `knit.config.ts` from the given directory.
 *
 * Relative `srcDir` value is resolved against `cwd`.
 *
 * @param cwd - Directory containing `knit.config.ts`. Defaults to `process.cwd()`.
 * @returns The validated configuration with absolute directory paths.
 * @throws {Error} If the config has no default export, the default export is not an object,
 * or any required property is missing.
 */
export async function loadConfig(cwd = process.cwd()): Promise<KnitConfig> {
    const configPath = path.resolve(cwd, "knit.config.ts");

    const configUrl = pathToFileURL(configPath).href;

    const { default: config } = await tsImport(configUrl, import.meta.url);

    if (!config || typeof config !== "object") {
        throw new Error("Invalid Knit config: expected a default export.");
    }

    const required: (keyof KnitConfig)[] = ["srcDir"];

    const missing = required.filter((key) => !config[key]);

    if (missing.length) {
        throw new Error(`Knit config is missing required properties: ${missing.join(", ")}`);
    }

    return {
        srcDir: path.resolve(cwd, config.srcDir),
    };
}

export async function generateConfigFile() {
    const configPath = path.resolve(process.cwd(), "knit.config.ts");

    try {
        await access(configPath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
        }

        const generatedConfig = `import { defineConfig } from "@knit/core";

export default defineConfig({
    srcDir: "./src/app",
});
`;

        try {
            await writeFile(configPath, generatedConfig, { encoding: "utf-8", flag: "wx" });
            p.log.success("Created default knit.config.ts");
        } catch (writeError) {
            if ((writeError as NodeJS.ErrnoException).code !== "EEXIST") {
                throw writeError;
            }
        }
    }
}
