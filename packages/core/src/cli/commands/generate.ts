import * as p from "@clack/prompts";
import { rm } from "fs/promises";
import path from "path";

import { loadConfig } from "../../config.js";
import { createCliColors } from "../cli-colors.js";
import { generateFile } from "./file-generation.js";
import { fileCollides, registerControllerInModule, rootModuleCheck, subPathModuleRestriction } from "./module-checks.js";
import type { GeneratorArguments, ResourceTypeOptions, Type } from "./types.js";
import { abortGeneration, capitalize, getRootSegment, isType, isValidRoutePath } from "./utils.js";

/**
 * Main execution handler for the Knit code generator route command.
 * Orchestrates interactive prompts, argument parsing, architecture validation rules,
 * file scaffolding, and module patching.
 *
 * @param args - CLI arguments containing optional resource type and route name/path
 */
export async function generateRouteCommand(args: GeneratorArguments) {
    console.clear();
    const pc = createCliColors();
    const config = await loadConfig();
    p.intro(pc.cyan("🧶 Knit Code Generator"));

    let resourceType = args.resourceType;
    if (!resourceType) {
        const types: Type[] = ["controller", "module"];

        const options: ResourceTypeOptions[] = types.map((resourceType) => ({ value: resourceType, label: capitalize(resourceType) }));

        const res = await p.select({ options, message: "What would you like to generate?" });

        if (p.isCancel(res)) {
            p.cancel("Operation cancelled.");
            process.exit(0);
        }

        resourceType = res;
    }

    let routePath = args.name;
    if (!routePath) {
        const result = await p.text({
            message: "Enter the route path (e.g. /users or /users/[id]):",
            placeholder: "/users/[id]",
            validate: (value) => {
                if (!value?.trim()) return "Route path cannot be empty.";

                if (!isValidRoutePath(value)) {
                    return "Invalid route format. Must start with '/' and use alphanumeric segments or bracketed params (e.g., /users/[id]).";
                }
            },
        });

        if (p.isCancel(result)) {
            p.cancel("Operation cancelled.");
            process.exit(0);
        }

        routePath = result;
    }

    const validTypes: Type[] = ["controller", "co", "module", "mo"];
    if (!validTypes.includes(resourceType)) {
        p.cancel(`Unknown resource type "${resourceType}". Use module/mo or controller/co.`);
        process.exit(1);
    }

    if (!isValidRoutePath(routePath)) {
        p.cancel(`Invalid route path "${routePath}". It must start with '/' and use alphanumeric segments or bracketed params.`);
        process.exit(1);
    }

    const spinner = p.spinner();
    spinner.start(`Generating ${resourceType} for "${routePath}"...`);

    const relativeSrcDir = path.relative(process.cwd(), config.srcDir);

    const isModule = isType(resourceType, ["module", "mo"]);
    if (isModule) {
        const isSubPath = await subPathModuleRestriction(relativeSrcDir, routePath);
        if (isSubPath) {
            abortGeneration(
                spinner,
                pc,
                `Architectural violation: Modules can only be created at the root feature level.\nNested sub-modules like '${routePath}' are not allowed in V1.`,
                "Cannot Create Module",
            );
        }

        const moduleExists = await rootModuleCheck(relativeSrcDir, routePath);
        if (moduleExists) {
            const rootFeatureName = capitalize(getRootSegment(routePath));
            abortGeneration(spinner, pc, `${rootFeatureName} module already exists.`, "Cannot Create Module");
        }
    }

    const isController = isType(resourceType, ["controller", "co"]);
    if (isController) {
        const moduleExists = await rootModuleCheck(relativeSrcDir, routePath);
        if (!moduleExists) {
            const rootFeatureName = getRootSegment(routePath);
            abortGeneration(spinner, pc, `Feature module required. Create feature module first.\npnpm knit g module /${rootFeatureName}`, "Cannot create Controller");
        }

        const collides = await fileCollides(relativeSrcDir, routePath);
        if (collides) {
            const controllerPath = path.join(relativeSrcDir, routePath, "controller.ts");
            abortGeneration(spinner, pc, `Controller already exists at:\n ${controllerPath}`, "Cannot create Controller");
        }
    }

    let createdFiles: string[];

    try {
        createdFiles = await generateFile(relativeSrcDir, routePath, resourceType);
    } catch (error) {
        abortGeneration(spinner, pc, error instanceof Error ? error.message : String(error), "Cannot generate files");
    }

    const updatedFiles: string[] = [];

    if (isController) {
        try {
            const updatedFile = await registerControllerInModule(relativeSrcDir, routePath);
            updatedFiles.push(updatedFile);
        } catch (error) {
            await Promise.allSettled(createdFiles.map((file) => rm(file, { force: true })));
            abortGeneration(spinner, pc, error instanceof Error ? error.message : String(error), "Cannot register Controller");
        }
    }

    spinner.stop(`Generation complete!`);
    console.log();
    for (const file of createdFiles) {
        console.log(`  ${pc.green("CREATED")} ${file}`);
    }
    for (const file of updatedFiles) {
        console.log(`  ${pc.blue("UPDATED")} ${file}`);
    }

    p.outro(pc.green("✨ All done! Ready for development."));
}
