import { access, readFile, writeFile } from "fs/promises";
import path from "path";

import { generateClassName, getRootSegment } from "./utils.js";

/**
 * Validates whether a given route path violates the sub-path module creation restriction.
 * Ensures modules are only created at the root feature level and not nested deeper.
 *
 * @param relativeSrcDir - The project-relative source directory path (e.g., "src/app")
 * @param routePath - The route path being evaluated (e.g., "/users" or "/users/[id]")
 * @returns A promise resolving to true if it's an illegal nested sub-module, false otherwise
 */
export async function subPathModuleRestriction(relativeSrcDir: string, routePath: string): Promise<boolean> {
    const targetDir = path.join(relativeSrcDir, routePath);
    const relative = path.relative(relativeSrcDir, targetDir);
    const segments = relative.split(path.sep);

    return relative.startsWith("..") || path.isAbsolute(relative) || segments.length > 1;
}

/**
 * Checks whether the root feature module file already exists on disk for a given route.
 *
 * @param relativeSrcDir - The project-relative source directory path (e.g., "src/app")
 * @param routePath - The route path to check (e.g., "/users" or "/users/[id]")
 * @returns A promise resolving to true if the root module file exists, false otherwise
 */
export async function rootModuleCheck(relativeSrcDir: string, routePath: string): Promise<boolean> {
    const routeRootDir = getRootSegment(routePath);
    const routePathRootModulePath = routeRootDir + ".module.ts";
    const targetPath = path.join(relativeSrcDir, routeRootDir, routePathRootModulePath);

    try {
        await access(targetPath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Checks if a controller file already exists at the target path.
 *
 * @param relativeSrcDir - The project-relative source directory path (e.g., "src/app")
 * @param routePath - The target route path where the controller is being created
 * @returns A promise resolving to true if a file collision occurs, false if safe to proceed
 */
export async function fileCollides(relativeSrcDir: string, routePath: string): Promise<boolean> {
    const controllerPath = path.join(relativeSrcDir, routePath, "controller.ts");

    try {
        await access(controllerPath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Registers a newly generated controller in its root feature module by adding the
 * controller import and appending its class to the module's `controllers` array.
 *
 * Call this only after the controller file has been written successfully.
 *
 * @param relativeSrcDir - The project-relative source directory path (e.g., "src/app")
 * @param routePath - The target route path where the controller was created
 */
export async function registerControllerInModule(relativeSrcDir: string, routePath: string): Promise<string> {
    const controllerPath = path.join(relativeSrcDir, routePath, "controller.ts");
    const routeRootDir = getRootSegment(routePath);

    const routePathRootModulePath = routeRootDir + ".module.ts";
    const moduleFilePath = path.join(relativeSrcDir, routeRootDir, routePathRootModulePath);

    const controllerClassName = generateClassName(routePath, "controller");

    const relativeControllerImportPath = "./" + path.relative(path.join(relativeSrcDir, routeRootDir), controllerPath).split(path.sep).join("/").replace(/\.ts$/, ".js");

    await updateFeatureModule(moduleFilePath, controllerClassName, relativeControllerImportPath);

    return moduleFilePath;
}

/**
 * Scans an existing feature module file and uses string manipulation / regex matching
 * to inject a new controller's import statement and register its class in the `controllers` array.
 *
 * @param moduleFilePath - The absolute or relative file path to the feature's `.module.ts` file
 * @param newControllerClassName - The generated TypeScript class name of the controller
 * @param relativeControllerImportPath - The formatted relative import path string pointing to the controller file
 */
async function updateFeatureModule(moduleFilePath: string, newControllerClassName: string, relativeControllerImportPath: string) {
    const content = await readFile(moduleFilePath, "utf8");

    const importStatement = `import { ${newControllerClassName} } from "${relativeControllerImportPath}";`;

    if (content.includes(newControllerClassName)) {
        return;
    }

    const lastImportEnd = findLastImportEnd(content);
    let updatedContent = lastImportEnd > 0 ? content.slice(0, lastImportEnd) + importStatement + "\n" + content.slice(lastImportEnd) : importStatement + "\n" + content;

    const controllersPattern = /controllers:\s*\[([\s\S]*?)\]/;
    const controllersMatch = updatedContent.match(controllersPattern);

    if (controllersMatch) {
        const existingControllers = controllersMatch[1]!.trim();
        const separator = existingControllers.length > 0 && !existingControllers.endsWith(",") ? ", " : "";

        const newControllersArray = `controllers: [${existingControllers}${separator}${newControllerClassName}]`;
        updatedContent = updatedContent.replace(controllersPattern, () => newControllersArray);
    } else {
        updatedContent = addControllersMetadata(updatedContent, newControllerClassName, moduleFilePath);
    }

    await writeFile(moduleFilePath, updatedContent, "utf8");
}

/**
 * Adds a `controllers` property to an existing `@Module` decorator when the module
 * does not declare one yet.
 *
 * @param content - The module source text
 * @param newControllerClassName - The controller class name to register
 * @param moduleFilePath - The module file path, used for error messages
 * @returns The updated module source text
 */
function addControllersMetadata(content: string, newControllerClassName: string, moduleFilePath: string): string {
    const modulePattern = /@Module\s*\(\s*\{([\s\S]*?)\}\s*\)/;
    const moduleMatch = content.match(modulePattern);

    if (!moduleMatch) {
        throw new Error(`Could not find an @Module decorator in ${moduleFilePath}. Add ${newControllerClassName} to the module's controllers manually.`);
    }

    const body = moduleMatch[1]!;
    const indent = body.match(/\n([ \t]+)\S/)?.[1] ?? "    ";
    const trimmedBody = body.trimEnd();
    const hasProperties = trimmedBody.trim().length > 0;
    const separator = hasProperties && !trimmedBody.endsWith(",") ? "," : "";
    const controllerProperty = `\n${indent}controllers: [${newControllerClassName}],`;
    const newBody = hasProperties ? `${trimmedBody}${separator}${controllerProperty}\n` : `${controllerProperty}\n`;

    return content.replace(modulePattern, () => `@Module({${newBody}})`);
}

/**
 * Finds the character offset immediately after the last top-level import declaration.
 *
 * The scan is line-based and tracks brace depth, so multi-line imports are handled
 * without letting the match extend into later declarations. Semicolonless imports
 * are supported because a declaration also ends when its braces close.
 *
 * @param content - The full source text of a module
 * @returns The offset after the last import declaration, or `0` when none are present
 */
function findLastImportEnd(content: string): number {
    const lines = content.split("\n");

    let offset = 0;
    let lastImportEnd = 0;
    let inImport = false;
    let braceDepth = 0;

    for (const line of lines) {
        const lineEnd = offset + line.length + 1;
        const trimmed = line.trim();

        if (!inImport) {
            if (/^import\s/.test(trimmed)) {
                inImport = true;
                braceDepth = countChar(line, "{") - countChar(line, "}");

                if (braceDepth === 0) {
                    lastImportEnd = lineEnd;
                    inImport = false;
                }
            }
        } else {
            braceDepth += countChar(line, "{") - countChar(line, "}");

            if (braceDepth <= 0) {
                lastImportEnd = lineEnd;
                inImport = false;
            }
        }

        offset = lineEnd;
    }

    return lastImportEnd;
}

function countChar(value: string, char: string): number {
    let count = 0;

    for (const current of value) {
        if (current === char) count++;
    }

    return count;
}

