import * as p from "@clack/prompts";
import { access, writeFile } from "fs/promises";
import path from "path";
import { tsImport } from "tsx/esm/api";
import { pathToFileURL } from "url";

/**
 * Configuration for Knit, typically created with {@link defineConfig} and
 * exported from `knit.config.ts`.
 *
 * Relative paths are resolved from the project directory when
 * {@link loadConfig} is called. Omitted properties use the defaults from
 * {@link DEFAULT_CONFIG}.
 */
export interface KnitConfig {
    /**
     * Directory scanned recursively for file-based route controllers.
     *
     * The directory usually contains `controller.ts` files, where each
     * controller's parent path becomes its route path. Relative paths are
     * resolved from the directory containing `knit.config.ts`.
     *
     * @defaultValue `"./src/app"`
     */
    srcDir?: string;
    /**
     * Application entry point started by `knit dev`.
     *
     * This module owns Nest application creation, so it is responsible for
     * calling `KnitFactory.create()` and listening on a port. It must be
     * ESM-compatible for V1. Relative paths are resolved from the directory
     * containing `knit.config.ts`.
     *
     * @defaultValue `"./src/main.ts"`
     */
    entryFile?: string;
}

/**
 * A Knit configuration with every optional property resolved.
 *
 * Values returned by {@link loadConfig} contain absolute paths. This type is
 * used internally by the application factory and development CLI.
 */
export type ResolvedKnitConfig = Required<KnitConfig>;

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
 * Default project-relative paths used when a configuration omits a property.
 */
const DEFAULT_CONFIG: ResolvedKnitConfig = {
    srcDir: "./src/app",
    entryFile: "./src/main.ts",
};

/**
 * Loads and validates `knit.config.ts` from the given directory.
 *
 * The config module must have a default export containing a configuration
 * object. Supplied `srcDir` and `entryFile` values must be non-empty strings.
 * Relative paths are resolved against `cwd`, and omitted properties fall back
 * to {@link DEFAULT_CONFIG}.
 *
 * @param cwd - Project directory containing `knit.config.ts`. Defaults to `process.cwd()`.
 * @returns The resolved configuration with absolute paths.
 * @throws {Error} If the config cannot be imported, has no object default export,
 * or contains an invalid `srcDir` or `entryFile` value.
 */
export async function loadConfig(cwd = process.cwd()): Promise<ResolvedKnitConfig> {
    const configPath = path.resolve(cwd, "knit.config.ts");

    const configUrl = pathToFileURL(configPath).href;

    let imported: unknown;

    try {
        imported = await tsImport(configUrl, import.meta.url);
    } catch (error) {
        const detail = error instanceof Error ? ` ${error.message}` : "";
        throw new Error(`Failed to load Knit config at "${configPath}".${detail}`);
    }

    if (!isPlainObject(imported)) {
        throw new Error(`Invalid Knit config at "${configPath}": expected a module object.`);
    }

    const config = resolveConfigExport(imported);

    if (!isPlainObject(config)) {
        throw new Error(`Invalid Knit config at "${configPath}": expected a default export containing a configuration object.`);
    }

    const resolvePath = (key: keyof KnitConfig, fallback: string): string => {
        const value = config[key] ?? fallback;

        if (typeof value !== "string" || value.trim() === "") {
            throw new Error(`Invalid Knit config at "${configPath}": "${key}" must be a non-empty string.`);
        }

        return path.resolve(cwd, value);
    };

    return {
        srcDir: resolvePath("srcDir", DEFAULT_CONFIG.srcDir),
        entryFile: resolvePath("entryFile", DEFAULT_CONFIG.entryFile),
    };
}

/**
 * Creates a default `knit.config.ts` in the current directory when missing.
 *
 * Existing configuration files are left untouched.
 *
 * @throws {Error} If checking for or writing the configuration file fails for a
 * reason other than the file already existing.
 */
export async function generateConfigFile() {
    const configPath = path.resolve(process.cwd(), "knit.config.ts");

    try {
        await access(configPath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
        }

        const generatedConfig = `import { defineConfig } from "@knitjs/core";

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);

    return prototype === Object.prototype || prototype === null;
}

/**
 * Resolves the config default export from tsx's module namespace.
 *
 * ESM configs expose the object directly as `default`. When tsx loads a config
 * through CommonJS interop, the default export is wrapped in an additional
 * `default` property.
 */
function resolveConfigExport(configModule: Record<string, unknown>): unknown {
    const defaultExport = configModule["default"];

    if (!("module.exports" in configModule) || !isPlainObject(defaultExport) || !("default" in defaultExport)) {
        return defaultExport;
    }

    return defaultExport["default"];
}
