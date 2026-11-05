import * as p from "@clack/prompts";

import { generateConfigFile, loadConfig } from "../config.js";
import { watchRoutes } from "../routing/watcher.js";
import { startRuntime } from "./child-process.js";
import { createCliColors } from "./cli-colors.js";

const pc = createCliColors();

/**
 * Starts the development workflow.
 *
 * Ensures a Knit config exists, starts the application runtime in a child
 * process, and restarts it when files in the source directory change. The file
 * watcher keeps the process alive after this function resolves.
 *
 * @throws {Error} If reading or creating the configuration fails, or if the
 * configuration cannot be loaded.
 */
export async function dev() {
    await generateConfigFile();

    const config = await loadConfig();

    logBanner();

    let child = startRuntime();
    let restart = Promise.resolve();

    watchRoutes(config.srcDir, () => {
        console.clear();
        logBanner(true);

        restart = restart
            .then(async () => {
                const previousChild = child;

                if (previousChild.exitCode === null && previousChild.signalCode === null) {
                    previousChild.kill();

                    await new Promise<void>((resolve) => {
                        previousChild.once("exit", () => resolve());
                    });
                }
                child = startRuntime();
            })
            .catch((error: unknown) => {
                console.error("[KNIT] Failed to restart application:", error);
            });
    });
}

function logBanner(restart = false) {
    p.intro("🧶 Knit · Development");

    const banner = `
██╗  ██╗ ███╗   ██╗ ██╗ ████████╗
██║ ██╔╝ ████╗  ██║ ██║ ╚══██╔══╝
█████╔╝  ██╔██╗ ██║ ██║    ██║   
██╔═██╗  ██║╚██╗██║ ██║    ██║   
██║  ██╗ ██║ ╚████║ ██║    ██║   
╚═╝  ╚═╝ ╚═╝  ╚═══╝ ╚═╝    ╚═╝   
`;
    console.log(pc.greenBright(banner));

    p.log.success(restart ? "Restarted Knit application.\n" : "Knit application started.\n");
}
