import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { generateTypeAlias, parseRoute, routePatternsToTsTypePatters, routePatterToTsTypeParams } from "../routing/parser.js";
import { scanRoutes } from "../routing/scanner.js";
import type { KnitConfig } from "../config.js";


/** Default filename for the generated route declaration file. */
const DEFAULT_OUT_FILE = "knit-routes.d.ts";

/**
 * Scans configured route files and writes `RoutePattern` and `RouteParams`
 * type declarations to the configured output directory.
 *
 * Patterns are sorted before generation so the output is deterministic. The
 * output directory is created if needed, and the file is written only when its
 * content changes.
 *
 * @param config - Knit configuration containing route and output locations.
 * @returns `true` if the output file was written, or `false` if it was already up to date.
 * @throws {Error} If scanning route files or creating/writing the output fails.
 */
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

/**
 * Writes content only when it differs from the existing file.
 *
 * A missing output file is treated as a change and created. Other read errors
 * are rethrown.
 *
 * @param filePath - Destination file path.
 * @param content - Desired file contents.
 * @returns `true` when the file was written, or `false` when it was unchanged.
 * @throws {NodeJS.ErrnoException} If reading fails for a reason other than a missing
 * file, or if writing fails.
 */
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
