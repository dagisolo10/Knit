import path from "path";

/**
 * Accumulates parameter definitions while building the `RouteParams` type for
 * a single route pattern.
 */
interface ParsedRouteParam {
    /** Generated parameter properties keyed by parameter name. */
    param: Record<string, { value: string; segment: RouteSegment }>;
}

/**
 * Classification of a filesystem route segment.
 *
 * - `static`: a literal path segment
 * - `dynamic`: a required segment such as `[id]`
 * - `optional`: an optional catch-all segment such as `[[...docs]]`
 * - `catchAll`: a required catch-all segment such as `[...slug]`
 */
type RouteSegment = "static" | "dynamic" | "optional" | "catchAll";

/**
 * Converts a route file path into its filesystem-based route pattern.
 *
 * The pattern is derived from the file's parent directory relative to
 * `srcDir`. The root route maps to `/`, path separators are normalized to `/`,
 * and bracketed segments are preserved as-is (for example, `users/[id]`
 * becomes `/users/[id]`).
 *
 * @param filePath - Path to a discovered route file.
 * @param srcDir - Root route directory used to compute the relative path.
 * @returns The route pattern, beginning with `/`.
 */
function parseRoute(filePath: string, srcDir: string): string {
    const relativePath = path.relative(srcDir, path.dirname(filePath));

    return relativePath === "" ? "/" : `/${relativePath.split(path.sep).join("/")}`;
}

/**
 * Records a parameter extracted from a bracketed route segment.
 *
 * Strips the surrounding brackets to derive the parameter name, then assigns
 * `string` for dynamic segments or `string[]` for catch-all variants.
 *
 * @param routesMap - Accumulated route definitions.
 * @param segment - Non-static segment kind being recorded.
 * @param pattern - Route pattern that owns this segment.
 * @param path - Raw bracketed segment, such as `[...slug]`.
 */
function setPattern(routesMap: Map<string, ParsedRouteParam>, segment: Exclude<RouteSegment, "static">, pattern: string, path: string) {
    const sliceStart = segment === "optional" ? 5 : segment === "catchAll" ? 4 : 1;
    const sliceEnd = segment === "optional" ? path.length - 2 : path.length - 1;
    const normalizedPattern = path.slice(sliceStart, sliceEnd);

    const current = routesMap.get(pattern) ?? { param: {} };
    current.param[normalizedPattern] = { segment, value: segment === "dynamic" ? "string" : "string[]" };
    routesMap.set(pattern, current);
}

/**
 * Generates the body of the `RouteParams` type from route patterns.
 *
 * Static patterns become `Record<string, never>`, dynamic segments become
 * required `string` properties, catch-all segments become required `string[]`,
 * and optional catch-all segments become optional `string[]`.
 *
 * @param values - Route patterns to convert.
 * @returns A TypeScript object type literal, or `{}` when no patterns are supplied.
 */
function routePatterToTsTypeParams(values: string[]): string {
    const routesMap = new Map<string, ParsedRouteParam>();

    for (const pattern of values) {
        const paths = pattern.split(path.sep);

        if (!pattern.startsWith("[") && !pattern.endsWith("]")) {
            routesMap.set(pattern, { param: {} });
        }

        for (const path of paths) {
            const isDynamic = path.startsWith("[") && path.endsWith("]");
            const isCatchAll = path.startsWith("[...") && path.endsWith("]");
            const isOptionalCatchAll = path.startsWith("[[...") && path.endsWith("]]");

            if (isOptionalCatchAll) {
                setPattern(routesMap, "optional", pattern, path);
                continue;
            }

            if (isCatchAll) {
                setPattern(routesMap, "catchAll", pattern, path);
                continue;
            }

            if (isDynamic) {
                setPattern(routesMap, "dynamic", pattern, path);
            }
        }
    }

    const params = [...routesMap.entries()].map(([key, value]) => ({ [key]: value }));

    const joined = `{\n${params
        .map((param) => {
            const [pattern, routeParam] = Object.entries(param)[0]!;

            const properties = Object.entries(routeParam.param)
                .map(([name, param]) => {
                    const isOptional = param.segment === "optional";
                    const propertyName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : JSON.stringify(name);

                    return `${propertyName}${isOptional ? "?" : ""}: ${param.value}`;
                })
                .join("; ");

            return properties ? `\t"${pattern}": { ${properties} }` : `\t"${pattern}": Record<string, never>`;
        })
        .join(";\n")}\n}`;

    return params.length === 0 ? "{}" : joined;
}

/**
 * Generates the body of the `RoutePattern` type from route patterns.
 *
 * @param values - Route patterns to include.
 * @returns A single string literal, a multiline union, or `never` for an empty list.
 */
function routePatternsToTsTypePatters(values: string[]): string {
    const strings = values.map((val) => JSON.stringify(val));

    const joined = `\n\t| ${strings.join("\n\t| ")}`;

    return strings.length <= 1 ? JSON.stringify(values[0]) || "never" : joined;
}

/**
 * Formats an exported TypeScript type alias.
 *
 * @param name - Type alias name.
 * @param value - Right-hand side of the alias.
 * @returns The alias declaration, including a trailing newline.
 */
function generateTypeAlias(name: string, value: string): string {
    return `export type ${name} = ${value};\n`;
}

export { generateTypeAlias, parseRoute, routePatternsToTsTypePatters, routePatterToTsTypeParams, type RouteSegment };
