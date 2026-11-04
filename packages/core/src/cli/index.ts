import { Command } from "commander";

import { init } from "./init.js";
import { dev } from "./dev.js";


const program = new Command();

program.name("knit").description("File-based routing and type generation for your applications");

program.command("init").description("Initialize Knit in your project").action(init);

program.command("dev", { isDefault: true }).description("Watch routes and generate types").action(dev);

program.parseAsync(process.argv);
