import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import type { KnitConfig } from "../config.js";
import { generateTypeAlias, parseRoute, routePatternsToTsTypePatters, routePatterToTsTypeParams } from "../routing/parser.js";
import { scanRoutes } from "../routing/scanner.js";

const DEFAULT_OUT_FILE = "knit-routes.d.ts";

async function generateRouteTypes(options: KnitConfig): Promise<boolean> {
    const files = await scanRoutes(options.srcDir);
    const routes = files.map((file) => parseRoute(file, options.srcDir));

    const sortedPatterns = Array.from(routes).sort();

    const routePatterns = routePatternsToTsTypePatters(sortedPatterns);

    const routeParams = routePatterToTsTypeParams(sortedPatterns);

    const content = `/**
 * Auto-generated route types from ${path.relative(process.cwd(), options.srcDir)}.
 */

${generateTypeAlias("RoutePattern", routePatterns)}
${generateTypeAlias("RouteParams", routeParams)}
`;

    mkdirSync(path.dirname(options.outDir), { recursive: true });

    return writeFileIfChanged(path.join(options.outDir, DEFAULT_OUT_FILE), content);
}

function writeFileIfChanged(filePath: string, content: string): boolean {
    try {
        if (readFileSync(filePath, "utf8") === content) {
            return false;
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
        }
    }

    writeFileSync(filePath, content, "utf8");
    return true;
}

export { DEFAULT_OUT_FILE, generateRouteTypes };
