import path from "path";

import { loadConfig } from "../config.js";
import { DEFAULT_OUT_FILE, generateRouteTypes } from "../routing/generate-route-types.js";
import { watchRoutes } from "../routing/watcher.js";
import { createCliColors } from "./cli-colors.js";

const pc = createCliColors();

async function generate() {
    const config = await loadConfig();

    const changed = await generateRouteTypes(config);

    const message = changed ? pc.greenBright("Types generated in " + path.join(path.relative(process.cwd(), config.outDir), DEFAULT_OUT_FILE)) : pc.gray("Skipped generating types, no file changes");

    const log = [pc.dim("[") + pc.bold(pc.blue("KNIT")) + pc.dim("]"), pc.dim("[") + pc.bold(pc.cyan("TYPE")) + pc.dim("]"), pc.dim("[") + pc.bold(pc.yellow("GENERATE")) + pc.dim("]"), message].join(" ");

    console.log(log);
}

async function dev() {
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

    await generate();

    watchRoutes(config.srcDir, async () => await generate());

    const log = [pc.dim("[") + pc.bold(pc.blue("KNIT")) + pc.dim("]"), pc.blueBright("Development server started.")].join(" ");

    console.log(log);
}

export { dev };
