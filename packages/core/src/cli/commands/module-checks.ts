import { access, readFile, writeFile } from "fs/promises";
import path from "path";

import { generateClassName } from "./utils.js";

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
    const routeRootDir = routePath.split(path.sep)[0]!;
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
 * If it does not exist, it automatically computes relative import paths and patches
 * the parent feature module to register the new controller.
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
    } catch {}

    const routeRootDir = routePath.split(path.sep)[0]!;
    const routePathRootModulePath = routeRootDir + ".module.ts";
    const moduleFilePath = path.join(relativeSrcDir, routeRootDir, routePathRootModulePath);

    const controllerClassName = generateClassName(routePath, "controller");

    const fullControllerImportPath = path.relative(relativeSrcDir, controllerPath);
    const relativeControllerPath = "./" + fullControllerImportPath.split(path.sep).slice(1, fullControllerImportPath.length).join(path.sep);
    const relativeControllerImportPath = relativeControllerPath
        .split(path.sep)
        .map((path) => (path.includes("controller.ts") ? "controller.js" : path))
        .join(path.sep);

    await updateFeatureModule(moduleFilePath, controllerClassName, relativeControllerImportPath);

    return false;
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

    const lastImportIndex = content.lastIndexOf("import ");
    const nextNewlineAfterImport = content.indexOf("\n", lastImportIndex);

    let updatedContent = content.slice(0, nextNewlineAfterImport + 1) + importStatement + "\n" + content.slice(nextNewlineAfterImport + 1);

    const controllersMatch = updatedContent.match(/controllers:\s*\[([\s\S]*?)\]/);

    if (controllersMatch) {
        const existingControllers = controllersMatch[1]!.trim();
        const separator = existingControllers.length > 0 && !existingControllers.endsWith(",") ? ", " : "";

        const newControllersArray = `controllers: [${existingControllers}${separator}${newControllerClassName}]`;
        updatedContent = updatedContent.replace(/controllers:\s*\[([\s\S]*?)\]/, newControllersArray);
    }

    await writeFile(moduleFilePath, updatedContent, "utf8");
}
