import { readdir } from "fs/promises";
import path from "path";

import { parseRoute } from "./parser.js";

const ROUTE_FILE = "controller.ts";

export interface DiscoveredRoute {
    filePath: string;
    routePath: string;
}

/**
 * Recursively finds route files under a source directory.
 *
 * Every directory is traversed, and files whose name exactly matches
 * `controller.ts` are returned.
 *
 * @param srcDir - Root directory to scan.
 * @param rootDir - Root directory used to derive route paths. Defaults to `srcDir`.
 * @returns The discovered route files and their derived route paths.
 * @throws {NodeJS.ErrnoException} If a directory cannot be read.
 */
export async function scanRoutes(srcDir: string, rootDir = srcDir): Promise<DiscoveredRoute[]> {
    const entries = await readdir(srcDir, { withFileTypes: true });

    const routes: DiscoveredRoute[] = [];

    for (const entry of entries) {
        const fullPath = path.join(srcDir, entry.name);

        if (entry.isDirectory()) {
            routes.push(...(await scanRoutes(fullPath, rootDir)));
        }

        if (entry.isFile() && entry.name === ROUTE_FILE) {
            const routePath = parseRoute(fullPath, rootDir);

            routes.push({ routePath, filePath: fullPath });
        }
    }

    return routes;
}
