import { mkdir, writeFile } from "fs/promises";
import path from "path";

import type { Type } from "./types.js";
import { generateClassName, isType } from "./utils.js";

/**
 * Scaffolds and writes generated code files (controllers and modules) to the disk
 * based on the provided resource type and route path.
 *
 * @param relativeSrcDir - The project-relative source directory path (e.g., "src/app")
 * @param routePath - The target route subpath or name (e.g., "users" or "users/[id]")
 * @param resourceType - The type of resource to generate ("module", "mo", "controller", or "co")
 * @returns A promise resolving to an array of file paths that were created
 */
export async function generateFile(relativeSrcDir: string, routePath: string, resourceType: Type) {
    const targetDir = path.join(relativeSrcDir, routePath);

    await mkdir(targetDir, { recursive: true });

    const createdFiles: string[] = [];

    const isModule = isType(resourceType, ["module", "mo"]);

    if (isModule) {
        const controllerPath = path.join(targetDir, "controller.ts");
        const content = generateContent(routePath, "controller");
        await writeFile(controllerPath, content, "utf8");
        createdFiles.push(controllerPath);
    }

    const filePath = path.join(targetDir, isModule ? `${routePath}.module.ts` : "controller.ts");
    const content = generateContent(routePath, resourceType);
    await writeFile(filePath, content, "utf8");
    createdFiles.push(filePath);

    return createdFiles;
}

/**
 * Generates the boilerplate file content for either a Knit controller or module class.
 *
 * @param routePath - The route identifier used to derive class naming conventions
 * @param type - Specifies whether to generate controller or module text content
 * @returns A formatted string containing the TypeScript file code
 */
function generateContent(routePath: string, type: Type): string {
    const module = generateClassName(routePath, "module");
    const controller = generateClassName(routePath, "controller");

    const isController = isType(type, ["controller", "co"]);

    if (isController) {
        const controllerContent = `import { KnitController } from "@knit/core";

@KnitController()
export class ${controller} {}

`;
        return controllerContent;
    }

    const moduleContent = `import { Module } from "@knit/core";
import { ${controller} } from "./controller.js";

@Module({
    imports: [],
    controllers: [${controller}],
})
export class ${module} {}

`;

    return moduleContent;
}
