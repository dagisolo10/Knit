import path from "path";

export function parseRoute(filePath: string, appDir: string): string {
    const relativePath = path.relative(appDir, path.dirname(filePath));

    return relativePath === "" ? "/" : `/${relativePath.split(path.sep).join("/")}`;
}

export function routePatterToTsTypeParams(values: string[]): string {
    const routesMap = new Map<string, Record<string, string>>();

    for (const pattern of values) {
        const paths = pattern.split("/");

        if (!pattern.startsWith("[")) {
            routesMap.set(pattern, {});
        }

        for (const path of paths) {
            if (path.startsWith("[") || path.endsWith("]")) {
                const normalizedPath = path.slice(1, path.length - 1);

                const current = routesMap.get(pattern) ?? {};
                current[normalizedPath] = "string";
                routesMap.set(pattern, current);
            }
        }
    }

    const params = [...routesMap.entries()].map(([key, value]) => ({ [key]: value }));

    return `\n    | ${params
        .map((param) => {
            const [route, routeParams] = Object.entries(param)[0]!;

            const properties = Object.entries(routeParams)
                .map(([name, type]) => `${name}: ${type}`)
                .join("; ");

            return `{ "${route}": { ${properties} } }`;
        })
        .join("\n    | ")}`;
}

export function routePatternsToTsTypePatters(values: string[]): string {
    return `\n    | ${values.map((val) => JSON.stringify(val)).join("\n    | ")}`;
}

export function generateTypeAlias(name: string, value: string): string {
    return `export type ${name} = ${value};\n`;
}
