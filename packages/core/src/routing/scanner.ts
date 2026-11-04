import { readdir } from "fs/promises";
import path from "path";


/**
 * Recursively finds route files under a source directory.
 *
 * Every directory is traversed, and files whose name exactly matches
 * `routeFile` are returned.
 *
 * @param srcDir - Root directory to scan.
 * @param routeFile - Route filename to match, such as `route.ts`.
 * @returns Paths to the discovered route files, built from `srcDir`.
 * @throws {NodeJS.ErrnoException} If a directory cannot be read.
 */
export async function scanRoutes(srcDir: string, routeFile: string): Promise<string[]> {
    const entries = await readdir(srcDir, { withFileTypes: true });

    const routes: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(srcDir, entry.name);

        if (entry.isDirectory()) {
            routes.push(...(await scanRoutes(fullPath, routeFile)));
        }

        if (entry.isFile() && entry.name === routeFile) {
            routes.push(fullPath);
        }
    }

    return routes;
}
