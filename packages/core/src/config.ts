import path from "path";
import { tsImport } from "tsx/esm/api";
import { pathToFileURL } from "url";

/**
 * Configuration for Knit, typically created with {@link defineConfig} and
 * exported from `knit.config.ts`.
 */
interface KnitConfig {
    /** Directory to scan for route files. Relative paths are resolved from the current working directory when loaded. */
    srcDir: string;
    /** Directory where generated route types are written. Relative paths are resolved from the current working directory when loaded. */
    outDir: string;
    /** Filename that identifies a route file, such as `route.ts`. */
    routeFile: string;
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
function defineConfig(config: KnitConfig): KnitConfig {
    return config;
}

/**
 * Loads and validates `knit.config.ts` from the given directory.
 *
 * Relative `srcDir` and `outDir` values are resolved against `cwd`.
 *
 * @param cwd - Directory containing `knit.config.ts`. Defaults to `process.cwd()`.
 * @returns The validated configuration with absolute directory paths.
 * @throws {Error} If the config has no default export, the default export is not an object,
 * or any required property is missing.
 */
async function loadConfig(cwd = process.cwd()): Promise<KnitConfig> {
    const configPath = path.resolve(cwd, "knit.config.ts");

    const configUrl = pathToFileURL(configPath).href;

    const { default: config } = await tsImport(configUrl, import.meta.url);

    if (!config || typeof config !== "object") {
        throw new Error("Invalid Knit config: expected a default export.");
    }

    const required: (keyof KnitConfig)[] = ["srcDir", "outDir", "routeFile"];

    const missing = required.filter((key) => !config[key]);

    if (missing.length) {
        throw new Error(`Knit config is missing required properties: ${missing.join(", ")}`);
    }

    return {
        routeFile: config.routeFile,
        srcDir: path.resolve(cwd, config.srcDir),
        outDir: path.resolve(cwd, config.outDir),
    };
}

export { defineConfig, loadConfig, type KnitConfig };
