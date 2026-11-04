import path from "path";


interface ParsedRouteParam {
    param: Record<string, { value: string; segment: RouteSegment }>;
}

type RouteSegment = "static" | "dynamic" | "optional" | "catchAll";

function parseRoute(filePath: string, srcDir: string): string {
    const relativePath = path.relative(srcDir, path.dirname(filePath));

    return relativePath === "" ? "/" : `/${relativePath.split(path.sep).join("/")}`;
}

function setPattern(routesMap: Map<string, ParsedRouteParam>, segment: Exclude<RouteSegment, "static">, pattern: string, path: string) {
    const sliceStart = segment === "optional" ? 5 : segment === "catchAll" ? 4 : 1;
    const sliceEnd = segment === "optional" ? path.length - 2 : path.length - 1;
    const normalizedPattern = path.slice(sliceStart, sliceEnd);

    const current = routesMap.get(pattern) ?? { param: {} };
    current.param[normalizedPattern] = { segment, value: segment === "dynamic" ? "string" : "string[]" };
    routesMap.set(pattern, current);
}

function routePatterToTsTypeParams(values: string[]): string {
    const routesMap = new Map<string, ParsedRouteParam>();

    for (const pattern of values) {
        const paths = pattern.split("/");

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

function routePatternsToTsTypePatters(values: string[]): string {
    const strings = values.map((val) => JSON.stringify(val));

    const joined = `\n\t| ${strings.join("\n\t| ")}`;

    return strings.length <= 1 ? JSON.stringify(values[0]) || "never" : joined;
}

function generateTypeAlias(name: string, value: string): string {
    return `export type ${name} = ${value};\n`;
}

export { generateTypeAlias, parseRoute, routePatternsToTsTypePatters, routePatterToTsTypeParams, type RouteSegment };
