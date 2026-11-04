import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { generateTypeAlias, parseRoute, routePatternsToTsTypePatters, routePatterToTsTypeParams } from "../routing/parser.js";
import { scanRoutes } from "../routing/scanner.js";
import type { KnitConfig } from "../config.js";


const DEFAULT_OUT_FILE = "knit-routes.d.ts";

async function generateRouteTypes(config: KnitConfig): Promise<boolean> {
    const files = await scanRoutes(config.srcDir, config.routeFile);
    const routes = files.map((file) => parseRoute(file, config.srcDir));

    const sortedPatterns = Array.from(routes).sort();

    const routePatterns = routePatternsToTsTypePatters(sortedPatterns);

    const routeParams = routePatterToTsTypeParams(sortedPatterns);

    const content = `/**
 * Auto-generated route types from ${path.relative(process.cwd(), config.srcDir)}.
 */

${generateTypeAlias("RoutePattern", routePatterns)}
${generateTypeAlias("RouteParams", routeParams)}
`;

    mkdirSync(config.outDir, { recursive: true });

    return writeFileIfChanged(path.join(config.outDir, DEFAULT_OUT_FILE), content);
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
