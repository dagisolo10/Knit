import path from "path";

/**
 * Converts a route file path into its filesystem-based route pattern.
 *
 * The pattern is derived from the file's parent directory relative to
 * `srcDir`. The root route maps to `/`, path separators are normalized to `/`,
 * and bracketed segments are converted to NestJS parameters (for example,
 * `users/[id]` becomes `/users/:id`).
 *
 * @param filePath - Path to a discovered route file.
 * @param srcDir - Root route directory used to compute the relative path.
 * @returns The route pattern, beginning with `/`.
 */
export function parseRoute(filePath: string, srcDir: string): string {
    const relativePath = path.relative(srcDir, path.dirname(filePath));

    if (relativePath === "") return "/";

    return `/${relativePath
        .split(path.sep)
        .map((segment) => {
            const match = segment.match(/^\[(.+)\]$/);
            return match ? `:${match[1]}` : segment;
        })
        .join("/")}`;
}

/**
 * Accumulates parameter definitions while building the `RouteParams` type for
 * a single route pattern.
 */
export type ParsedRouteParam = string[] | null;

export function routePathToTsTypeParam(routePath: string): ParsedRouteParam {
    const params = routePath
        .split(path.sep)
        .filter((segment) => segment.startsWith(":"))
        .map((segment) => segment.slice(1));

    return params.length > 0 ? params : null;
}
