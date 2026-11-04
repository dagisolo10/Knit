import * as p from "@clack/prompts";
import { access, writeFile } from "fs/promises";
import path from "path";

import { loadConfig, type KnitConfig } from "../config.js";
import { DEFAULT_OUT_FILE, generateRouteTypes } from "../routing/generate-route-types.js";
import { watchRoutes } from "../routing/watcher.js";
import { createCliColors } from "./cli-colors.js";

const pc = createCliColors();

/**
 * Regenerates route types and reports the result to the CLI.
 *
 * @param config - Loaded Knit configuration.
 */
async function generate(config: KnitConfig) {
    const changed = await generateRouteTypes(config);

    if (changed) {
        const output = path.join(path.relative(process.cwd(), config.outDir), DEFAULT_OUT_FILE);

        p.log.success(`Types generated → ${output}`);
    } else {
        p.log.info("No changes detected. Skipping generation.");
    }
}

/**
 * Starts the development workflow.
 *
 * Loads the Knit config, prints the resolved configuration, generates route
 * types once, and then watches the source directory for changes. The file
 * watcher keeps the process alive after this function resolves.
 *
 * @throws {Error} If configuration loading or the initial type generation fails.
 */
async function dev() {
    p.intro("🧶 Knit · Development");

    const configPath = path.resolve(process.cwd(), "knit.config.ts");

    try {
        await access(configPath);
    } catch {
        const generatedConfig = `import { defineConfig } from "@knit/core";

export default defineConfig({
    srcDir: "./src/app",
    outDir: "./src/types",
    routeFile: "route.ts",
});
`;

        await writeFile(configPath, generatedConfig, "utf-8");
        p.log.success("Created default knit.config.ts");
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

    p.note([`Source: ${path.relative(process.cwd(), config.srcDir)}`, `Output: ${path.relative(process.cwd(), config.outDir)}`, `Route file: ${config.routeFile}`].join("\n"), "Configuration");

    await generate(config);

    watchRoutes(config.srcDir, async () => await generate(config));

    p.outro("Watching for route changes...");
}

export { dev };
