import { Command } from "commander";

import { dev } from "./dev.js";

const program = new Command();

program.name("knit").description("File-based routing and type generation for your applications");

program.command("dev").description("Watch routes and generate types").action(dev);

program.action(() => {
    console.error("No command specified. Run `knit dev` to watch routes and generate types.");
    process.exitCode = 1;
});

program.parseAsync(process.argv);
