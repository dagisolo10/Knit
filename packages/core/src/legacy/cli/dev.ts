import * as p from "@clack/prompts";
import path from "path";

import { createCliColors } from "../../cli/cli-colors.js";
import { generateConfigFile, loadConfig, type ResolvedKnitConfig } from "../../config.js";
import { watchPaths } from "../../routing/watcher.js";
import { DEFAULT_OUT_FILE, generateRouteTypes } from "../routing/generate-route-types.js";

const pc = createCliColors();

/**
 * Regenerates route types and reports the result to the CLI.
 *
 * @param config - Loaded Knit configuration.
 */
async function generate(config: ResolvedKnitConfig) {
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

    await generateConfigFile();

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

    watchPaths({ directories: [config.srcDir] }, async () => await generate(config));

    p.outro("Watching for route changes...");
}

export { dev };
