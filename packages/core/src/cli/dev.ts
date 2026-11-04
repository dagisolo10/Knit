import * as p from "@clack/prompts";
import path from "path";

import { DEFAULT_OUT_FILE, generateRouteTypes } from "../routing/generate-route-types.js";
import { loadConfig, type KnitConfig } from "../config.js";
import { watchRoutes } from "../routing/watcher.js";
import { createCliColors } from "./cli-colors.js";


const pc = createCliColors();

async function generate(config: KnitConfig) {
    const changed = await generateRouteTypes(config);

    if (changed) {
        const output = path.join(path.relative(process.cwd(), config.outDir), DEFAULT_OUT_FILE);

        p.log.success(`Types generated → ${output}`);
    } else {
        p.log.info("No changes detected. Skipping generation.");
    }
}

async function dev() {
    p.intro("🧶 Knit · Development");

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
