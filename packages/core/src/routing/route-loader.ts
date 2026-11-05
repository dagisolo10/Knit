import { pathToFileURL } from "url";

import { routeContext } from "./context/route.context.js";
import { scanRoutes, type DiscoveredRoute } from "./scanner.js";

/**
 * A discovered route together with its imported controller module exports.
 */
interface LoadedRoute extends DiscoveredRoute {
    /** Named exports from the route's controller module. */
    exports: Record<string, unknown>;
}

/**
 * Discovers route files under the source directory and imports their modules.
 *
 * Routes are sorted by their route paths before loading to ensure deterministic
 * processing. Each module is imported within its route context so that
 * `KnitController` can access the corresponding route path.
 *
 * @param srcDir - Root directory containing the file-based routes.
 * @returns The loaded route modules.
 * @throws If scanning or importing a route module fails.
 */
export async function loadRoutes(srcDir: string): Promise<LoadedRoute[]> {
    const routes = await scanRoutes(srcDir);

    const sortedRoutes = Array.from(routes).sort((a, b) => a.routePath.localeCompare(b.routePath));

    const loadedRoutes: LoadedRoute[] = [];

    for (const route of sortedRoutes) {
        const importFile = () => import(pathToFileURL(route.filePath).href);

        const exports = await routeContext.run({ path: route.routePath }, importFile);

        loadedRoutes.push({ ...route, exports });
    }

    return loadedRoutes;
}
