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
 * Uses depth-aware brace matching so that nested braces (e.g. `TypeOrmModule.forRoot({...})`)
 * do not prematurely end the match.
 *
 * @param content - The module source text
 * @param newControllerClassName - The controller class name to register
 * @param moduleFilePath - The module file path, used for error messages
 * @returns The updated module source text
 */
function addControllersMetadata(content: string, newControllerClassName: string, moduleFilePath: string): string {
    // Find the start of @Module(
    const moduleStartMatch = content.match(/@Module\s*\(\s*\{/);

    if (!moduleStartMatch) {
        throw new Error(`Could not find an @Module decorator in ${moduleFilePath}. Add ${newControllerClassName} to the module's controllers manually.`);
    }

    const openBracePos = moduleStartMatch.index! + moduleStartMatch[0].length - 1; // position of the opening {
    const bodyStart = openBracePos + 1;

    // Find the matching closing brace using a depth counter
    const closeBracePos = findMatchingCloseBrace(content, bodyStart);

    if (closeBracePos === -1) {
        throw new Error(`Could not find the closing brace of @Module in ${moduleFilePath}. Add ${newControllerClassName} to the module's controllers manually.`);
    }

    // Find the closing ) after the closing }
    const afterBrace = content.slice(closeBracePos + 1);
    const closingParenMatch = afterBrace.match(/^\s*\)/);
    if (!closingParenMatch) {
        throw new Error(`Could not find the closing parenthesis of @Module in ${moduleFilePath}. Add ${newControllerClassName} to the module's controllers manually.`);
    }

    const body = content.slice(bodyStart, closeBracePos);
    const indent = body.match(/\n([ \t]+)\S/)?.[1] ?? "    ";
    const trimmedBody = body.trimEnd();

    // Check if body has meaningful content (not just whitespace/comments)
    const hasProperties =
        trimmedBody
            .replace(/\/\/.*$/gm, "")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .trim().length > 0;

    const separator = hasProperties && !trimmedBody.endsWith(",") ? "," : "";
    const controllerProperty = `\n${indent}controllers: [${newControllerClassName}],`;
    const newBody = hasProperties ? `${trimmedBody}${separator}${controllerProperty}\n` : `${controllerProperty}\n`;

    const replacement = `@Module({${newBody}})`;
    const fullMatchEnd = closeBracePos + 1 + closingParenMatch[0].length;

    return content.slice(0, moduleStartMatch.index!) + replacement + content.slice(fullMatchEnd);
}

/**
 * Strips string literals and comments from source text so that brace counting
 * is not misled by `{` or `}` characters appearing inside strings or comments.
 *
 * Replaces the content of strings and comments with spaces to preserve offsets.
 */
function stripStringsAndComments(source: string): string {
    let result = "";
    let i = 0;

    while (i < source.length) {
        // Single-line comment
        if (source[i] === "/" && source[i + 1] === "/") {
            // Replace until end of line
            const end = source.indexOf("\n", i);
            if (end === -1) {
                result += " ".repeat(source.length - i);
                i = source.length;
            } else {
                result += " ".repeat(end - i);
                i = end;
            }
        }
        // Multi-line comment
        else if (source[i] === "/" && source[i + 1] === "*") {
            const end = source.indexOf("*/", i + 2);
            if (end === -1) {
                result += " ".repeat(source.length - i);
                i = source.length;
            } else {
                result += " ".repeat(end + 2 - i);
                i = end + 2;
            }
        }
        // Double-quoted string
        else if (source[i] === '"') {
            result += source[i];
            i++;
            while (i < source.length && source[i] !== '"') {
                if (source[i] === "\\") {
                    result += "  ";
                    i += 2;
                } else {
                    result += " ";
                    i++;
                }
            }
            if (i < source.length) {
                result += source[i]; // closing "
                i++;
            }
        }
        // Single-quoted string
        else if (source[i] === "'") {
            result += source[i];
            i++;
            while (i < source.length && source[i] !== "'") {
                if (source[i] === "\\") {
                    result += "  ";
                    i += 2;
                } else {
                    result += " ";
                    i++;
                }
            }
            if (i < source.length) {
                result += source[i]; // closing '
                i++;
            }
        }
        // Template literal
        else if (source[i] === "`") {
            result += source[i];
            i++;
            while (i < source.length && source[i] !== "`") {
                if (source[i] === "\\") {
                    result += "  ";
                    i += 2;
                } else {
                    result += " ";
                    i++;
                }
            }
            if (i < source.length) {
                result += source[i]; // closing `
                i++;
            }
        } else {
            result += source[i];
            i++;
        }
    }

    return result;
}

/**
 * Finds the position of the closing brace that matches the opening brace
 * at the given start position. Uses a depth counter that ignores braces
 * inside string literals and comments.
 *
 * @param content - The full source text
 * @param start - The position immediately after the opening `{`
 * @returns The index of the matching `}`, or `-1` if not found
 */
function findMatchingCloseBrace(content: string, start: number): number {
    // Extract the substring from the start position and strip strings/comments
    const substring = content.slice(start);
    const cleaned = stripStringsAndComments(substring);

    let depth = 1; // We start after the opening {, so depth is 1

    for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === "{") {
            depth++;
        } else if (cleaned[i] === "}") {
            depth--;
            if (depth === 0) {
                return start + i;
            }
        }
    }

    return -1;
}

/**
 * Counts occurrences of a character in a line, ignoring characters that appear
 * inside string literals or comments.
 *
 * @param line - A single line of source code
 * @param char - The character to count (`{` or `}`)
 * @returns The number of occurrences outside strings and comments
 */
function countCharOutsideStringsAndComments(line: string, char: string): number {
    const cleaned = stripStringsAndComments(line);
    let count = 0;

    for (const current of cleaned) {
        if (current === char) count++;
    }

    return count;
}

/**
 * Finds the character offset immediately after the last top-level import declaration.
 *
 * The scan is line-based and tracks brace depth (ignoring braces in strings and
 * comments), so multi-line imports are handled without letting the match extend
 * into later declarations. Semicolonless imports are supported because a declaration
 * also ends when its braces close. As a fallback, a line containing `from "..."`
 * or a bare `import "..."` is treated as the end of an import even if brace depth
 * is inconclusive.
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
                braceDepth = countCharOutsideStringsAndComments(line, "{") - countCharOutsideStringsAndComments(line, "}");

                // A bare side-effect import like `import "module";` has no braces
                // and ends on the same line.
                if (braceDepth === 0) {
                    lastImportEnd = lineEnd;
                    inImport = false;
                }
            }
        } else {
            // Check if this line ends the import via `from "..."` or `import "..."`
            // This handles multiline imports where brace counting might be unreliable
            if (/from\s+["'`]/.test(trimmed) || /^import\s+["'`]/.test(trimmed)) {
                lastImportEnd = lineEnd;
                inImport = false;
                continue;
            }

            braceDepth += countCharOutsideStringsAndComments(line, "{") - countCharOutsideStringsAndComments(line, "}");

            if (braceDepth <= 0) {
                lastImportEnd = lineEnd;
                inImport = false;
            }
        }

        offset = lineEnd;
    }

    return lastImportEnd;
}
