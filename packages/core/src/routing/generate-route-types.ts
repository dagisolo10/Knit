import { generateTypeAlias, parseRoute, routePatternsToTsTypePatters, routePatterToTsTypeParams } from "@/routing/parser";
import { scanRoutes } from "@/routing/scanner";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export async function generateRouteTypes(appDir: string, outPath: string): Promise<boolean> {
    const files = await scanRoutes(appDir);
    const routes = files.map((file) => parseRoute(file, appDir));

    const sortedPatterns = Array.from(routes).sort();

    const routePatterns = routePatternsToTsTypePatters(sortedPatterns);
    const routeParams = routePatterToTsTypeParams(sortedPatterns);

    const content = `/**
 * Auto-generated route types from src/app.
 */

${generateTypeAlias("RoutePattern", routePatterns)}
${generateTypeAlias("RouteParams", routeParams)}
`;

    mkdirSync(path.dirname(outPath), { recursive: true });

    return writeFileIfChanged(outPath, content);
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
