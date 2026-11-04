import { Command } from "commander";

import { dev } from "./dev.js";

const program = new Command();

program.name("knit").description("File-based routing and type generation for your applications");

program.command("dev").description("Watch routes and generate types").action(dev);

program.parseAsync(process.argv);
