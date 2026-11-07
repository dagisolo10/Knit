#!/usr/bin/env node
import * as p from "@clack/prompts";
import { existsSync } from "fs";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import pc from "picocolors";

import { KNIT_CONFIG_TEMPLATE, MAIN_TS_TEMPLATE, PKG_JSON_TEMPLATE, ROOT_CONTROLLER_TEMPLATE, TSCONFIG_TEMPLATE } from "./templates.js";

async function run() {
    p.intro(pc.cyan("🧶 Create Knit Project"));

    let targetDirInput = process.argv[2];

    if (!targetDirInput) {
        const res = await p.text({
            message: "Where should we create your Knit application?",
            placeholder: "./my-knit-app",
            defaultValue: "my-knit-app",
            validate: (value) => {
                if (!value?.trim()) return "Target directory cannot be empty.";
                // Reject dangerous paths
                const resolved = path.resolve(process.cwd(), value);
                const cwd = process.cwd();
                if (resolved === cwd || resolved === path.dirname(cwd)) {
                    return "Cannot create project in current or parent directory.";
                }
            },
        });

        if (p.isCancel(res)) {
            p.cancel("Operation cancelled.");
            process.exit(0);
        }

        targetDirInput = res;
    }

    const projectPath = path.resolve(process.cwd(), targetDirInput);
    const projectName = path.basename(projectPath);

    // Validate project name is a valid npm package name
    if (!/^[a-z0-9@][a-z0-9@._-]*$/.test(projectName) || projectName.startsWith("-") || projectName.endsWith("-")) {
        p.log.error(pc.red(`"${projectName}" is not a valid package name. Use lowercase letters, numbers, hyphens, underscores, or dots.`));
        process.exit(1);
    }

    if (existsSync(projectPath)) {
        p.log.error(pc.red(`Directory '${targetDirInput}' already exists.`));
        process.exit(1);
    }

    const spinner = p.spinner();
    spinner.start(`Bootstrapping ${pc.cyan(projectName)}...`);

    try {
        // 1. Create directory structure (Zero loose app files—only feature directories!)
        const rootDir = path.join(projectPath, "src", "app");
        await mkdir(rootDir, { recursive: true });

        // 2. Write Root Config & Bootstrap Files
        await writeFile(path.join(projectPath, "package.json"), PKG_JSON_TEMPLATE(projectName));
        await writeFile(path.join(projectPath, "tsconfig.json"), TSCONFIG_TEMPLATE);
        await writeFile(path.join(projectPath, "knit.config.ts"), KNIT_CONFIG_TEMPLATE);
        await writeFile(path.join(projectPath, "src", "main.ts"), MAIN_TS_TEMPLATE);

        // 3. Write Starter Controller
        await writeFile(path.join(rootDir, "controller.ts"), ROOT_CONTROLLER_TEMPLATE);

        spinner.stop(pc.green("Project structure created successfully!"));

        // Quote the directory in case it contains spaces
        const quotedDir = targetDirInput.includes(" ") ? `'${targetDirInput}'` : targetDirInput;
        p.note(`cd ${quotedDir}\n` + `pnpm install  # (or npm install)\n` + `pnpm dev      # starts Knit file watcher & dev server`, "Next Steps");

        p.outro(pc.green("✨ All set! Happy building with Knit."));
    } catch (err) {
        spinner.stop(pc.red("Project creation failed."));
        // Clean up partial project directory on failure
        await rm(projectPath, { recursive: true, force: true });
        p.log.error(pc.red(err instanceof Error ? err.message : String(err)));
        process.exit(1);
    }
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
