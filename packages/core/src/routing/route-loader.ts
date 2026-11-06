import { pathToFileURL } from "url";

import { routeContext } from "@knit/common";
import { routePathToTsTypeParam } from "./parser.js";
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

    const sortedRoutes = Array.from(routes).sort((a, b) => compareRoutePaths(a.routePath, b.routePath));

    const loadedRoutes: LoadedRoute[] = [];

    for (const route of sortedRoutes) {
        const importFile = () => import(pathToFileURL(route.filePath).href);

        const exports = await routeContext.run(
            {
                path: route.routePath,
                param: routePathToTsTypeParam(route.routePath),
            },
            importFile,
        );

        loadedRoutes.push({ ...route, exports });
    }

    return loadedRoutes;
}

function compareRoutePaths(a: string, b: string): number {
    const aSegments = a.split("/").filter(Boolean);
    const bSegments = b.split("/").filter(Boolean);

    for (let i = 0; i < Math.min(aSegments.length, bSegments.length); i++) {
        const aSegment = aSegments[i]!;
        const bSegment = bSegments[i]!;

        const aDynamic = aSegment.startsWith(":");
        const bDynamic = bSegment.startsWith(":");

        if (aDynamic !== bDynamic) return aDynamic ? 1 : -1;
        if (aSegment !== bSegment) return aSegment < bSegment ? -1 : 1;
    }

    return aSegments.length - bSegments.length;
}
