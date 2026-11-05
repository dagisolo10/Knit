import * as p from "@clack/prompts";
import { access, writeFile } from "fs/promises";
import path from "path";

import { createCliColors } from "../../cli/cli-colors.js";
import { type KnitConfig, loadConfig } from "../../config.js";
import { watchRoutes } from "../../routing/watcher.js";
import { DEFAULT_OUT_FILE, generateRouteTypes } from "../routing/generate-route-types.js";

const pc = createCliColors();

/**
 * Regenerates route types and reports the result to the CLI.
 *
 * @param config - Loaded Knit configuration.
 */
async function generate(config: KnitConfig) {
    const changed = await generateRouteTypes(config);

    if (changed) {
        /**
         * Used config.outDir
         */
        const outDir = "./src/types";
        const output = path.join(path.relative(process.cwd(), outDir), DEFAULT_OUT_FILE);

        p.log.success(`Types generated → ${output}`);
    } else {
        p.log.info("No changes detected. Skipping generation.");
    }
}

/**
 * Starts the development workflow.
 *
 * Loads the Knit config, prints the resolved configuration, generates route
 * types once, and then watches the source directory for changes. If the config
 * is missing, a default `knit.config.ts` is created. The file watcher keeps the
 * process alive after this function resolves.
 *
 * @throws {Error} If reading or creating the configuration fails, configuration
 * loading fails, or the initial type generation fails.
 */
async function dev() {
    p.intro("🧶 Knit · Development");

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
    outDir: "./src/types",
    routeFile: "route.ts",
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

    const config = await loadConfig();

    const banner = `
██╗  ██╗ ███╗   ██╗ ██╗ ████████╗
██║ ██╔╝ ████╗  ██║ ██║ ╚══██╔══╝
█████╔╝  ██╔██╗ ██║ ██║    ██║
██╔═██╗  ██║╚██╗██║ ██║    ██║
██║  ██╗ ██║ ╚████║ ██║    ██║
╚═╝  ╚═╝ ╚═╝  ╚═══╝ ╚═╝    ╚═╝
`;
    console.log(pc.greenBright(banner));

    /**
     * Used config.outDir and config.routeFile
     */
    const outDir = "./src/types";
    const routeFile = "route.ts";
    p.note([`Source: ${path.relative(process.cwd(), config.srcDir)}`, `Output: ${path.relative(process.cwd(), outDir)}`, `Route file: ${routeFile}`].join("\n"), "Configuration");

    await generate(config);

    watchRoutes(config.srcDir, async () => await generate(config));

    p.outro("Watching for route changes...");
}

export { dev };
