import * as p from "@clack/prompts";
import path from "path";

import { createCliColors } from "../cli-colors.js";
import type { FullType, Type } from "./types.js";

/**
 * Capitalizes the first character of a given string.
 *
 * @param value - The string to capitalize
 * @returns The capitalized string, or an empty string if input is blank
 */
export function capitalize(value: string): string {
    if (!value.trim()) return "";

    const split = value.split("");

    return split[0]!.toUpperCase() + split.slice(1, split.length).join("");
}

/**
 * Generates a PascalCase class name for controllers or modules based on route path segments,
 * stripping dynamic bracket syntax and appending the resource suffix.
 *
 * @param routePath - The route path used to derive class naming (e.g., "/users/[id]")
 * @param resourceType - The full resource type suffix ("module" or "controller")
 * @returns The computed TypeScript class name string
 */
export function generateClassName(routePath: string, resourceType: FullType) {
    const name = routePath
        .split(path.sep)
        .map((path) => (path.startsWith("[") && path.endsWith("]") ? path.slice(1, path.length - 1) : path))
        .map(capitalize)
        .join("");

    return capitalize(name) + capitalize(resourceType);
}

/**
 * Halts the generator spinner, displays an error message block, and safely exits the CLI process.
 *
 * @param spinner - The active Clack spinner instance
 * @param pc - The CLI color formatting utility object
 * @param message - The error message body to display
 * @param title - The title banner for the Clack note block
 */
export function abortGeneration(spinner: ReturnType<typeof p.spinner>, pc: ReturnType<typeof createCliColors>, message: string, title: string) {
    spinner.stop("Generation failed.");
    p.note(pc.red(message), title);
    p.outro(pc.red("Operation aborted."));
    process.exit(0);
}

/**
 * Checks if a given input matches any of the specified target values (supports shorthand aliases).
 *
 * @example
 * isType(resourceType, ["module", "mo"])
 * isType(resourceType, ["controller", "co"])
 */
export function isType<T extends Type>(value: string, targets: readonly T[]): boolean {
    return targets.includes(value as T);
}

/**
 * Validates that a route path starts with '/' and uses proper naming and bracket conventions.
 */
export function isValidRoutePath(value: string): boolean {
    if (!value || !value.trim()) return false;

    // 1. Must start with a forward slash
    if (!value.startsWith("/")) return false;

    // Remove the leading slash and split into segments (e.g., "/users/[id]" -> ["users", "[id]"])
    const cleanPath = value.slice(1);
    if (!cleanPath) return false;

    const segments = cleanPath.split("/");

    for (const segment of segments) {
        if (!segment) return false; // Catches double slashes like // or trailing slash

        // Check if it's a dynamic segment (wrapped in brackets)
        if (segment.startsWith("[") && segment.endsWith("]")) {
            const paramName = segment.slice(1, -1);
            // Ensure the parameter name inside isn't empty or full of weird symbols
            if (!paramName || !/^[a-zA-Z0-9_-]+$/.test(paramName)) {
                return false;
            }
        } else {
            // Static segment check: only letters, numbers, hyphens, and underscores
            if (!/^[a-zA-Z0-9_-]+$/.test(segment)) {
                return false;
            }
        }
    }

    return true;
}
