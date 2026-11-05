import * as p from "@clack/prompts";
import { stat } from "fs/promises";
import path from "path";

import { generateConfigFile, loadConfig, type ResolvedKnitConfig } from "../config.js";
import { watchPaths, type WatchTargets } from "../routing/watcher.js";
import { startApplication, stopApplication } from "./child-process.js";
import { createCliColors } from "./cli-colors.js";

const pc = createCliColors();

/**
 * Starts the development workflow.
 *
 * Ensures a Knit config exists, validates the configured entry point and source
 * directory, starts the application in a child process, and restarts it when
 * files under the source directory or the entry point change. Changes to
 * `knit.config.ts` require manually restarting this command.
 *
 * The watcher keeps the process alive. SIGINT and SIGTERM close the watcher and
 * stop the active child process before exiting.
 *
 * @throws {Error} If creating or loading the configuration fails, or if the
 * configured source directory or entry file does not exist.
 */
export async function dev() {
    await generateConfigFile();

    const config = await loadConfig();

    await validateProject(config);

    logBanner();

    let child = startApplication(config.entryFile);
    let restart = Promise.resolve();
    let shuttingDown = false;

    const watcher = watchPaths(getWatchTargets(config), () => {
        if (shuttingDown) return;

        console.clear();
        logBanner(true);

        restart = restart
            .then(async () => {
                if (shuttingDown) return;

                await stopApplication(child);

                if (shuttingDown) return;

                child = startApplication(config.entryFile);
            })
            .catch((error: unknown) => {
                console.error("[KNIT] Failed to restart application:", error);
            });

        return restart;
    });

    const shutdown = async () => {
        if (shuttingDown) return;

        shuttingDown = true;

        watcher.close();
        await stopApplication(child);

        process.exit(0);
    };

    process.once("SIGINT", () => {
        void shutdown();
    });

    process.once("SIGTERM", () => {
        void shutdown();
    });
}

async function validateProject(config: ResolvedKnitConfig): Promise<void> {
    const [entryFile, srcDir] = await Promise.all([stat(config.entryFile).catch(() => null), stat(config.srcDir).catch(() => null)]);

    if (!srcDir?.isDirectory()) {
        throw new Error(`Knit source directory not found or is not a directory: ${config.srcDir}`);
    }

    if (!entryFile?.isFile()) {
        throw new Error(`Knit entry file not found or is not a file: ${config.entryFile}`);
    }
}

function getWatchTargets(config: ResolvedKnitConfig): WatchTargets {
    const directories = [config.srcDir];
    const files: string[] = [];

    // If the entry file is outside srcDir, watch it as an individual file.
    // If it's inside srcDir, the directory watch already covers it.
    const entryRelative = path.relative(config.srcDir, config.entryFile);

    if (entryRelative.startsWith("..") || path.isAbsolute(entryRelative)) {
        files.push(config.entryFile);
    }

    return { directories, files };
}

function logBanner(restart = false) {
    console.clear();

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
