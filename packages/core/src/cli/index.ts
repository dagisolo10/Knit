import { Command } from "commander";

import { generateRouteCommand } from "./commands/generate.js";
import type { Type } from "./commands/types.js";
import { dev } from "./dev.js";

const program = new Command();

program.name("knit").description("File-based routing for NestJS applications").version("0.1.0");

// Dev command
program.command("dev").description("Start the application in development mode with hot-reloading").action(dev);

// Generate command (supports alias 'g')
program
    .command("generate")
    .alias("g")
    .description("Generate a feature module or nested sub-controller")
    .argument("[type]", "Type of resource to generate ('module'/'mo' or 'controller'/'co')")
    .argument("[name]", "Route path specification (e.g., /users or /users/[id])")
    .action(async (type: Type, name: string) => await generateRouteCommand({ resourceType: type, name }));

// Fallback for empty or unrecognized commands
program.action(() => {
    console.error("Error: No command specified.");
    console.log();
    program.outputHelp();
    process.exitCode = 1;
});

program.parseAsync(process.argv);
