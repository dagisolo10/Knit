import { Command } from "commander";

import { dev } from "./dev.js";

const program = new Command();

program.name("knit").description("File-based routing for NestJS applications");

program.command("dev").description("Start the application and restart it when source files change").action(dev);

program.action(() => {
    console.error("No command specified. Run `knit dev` to start the development server.");
    process.exitCode = 1;
});

program.parseAsync(process.argv);
