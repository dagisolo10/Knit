import { access, writeFile } from "fs/promises";
import * as p from "@clack/prompts";
import path from "path";


export async function init() {
    p.intro("🧶 Knit · Project setup");

    const configPath = path.resolve(process.cwd(), "knit.config.ts");

    try {
        await access(configPath);

        const overwrite = await p.confirm({
            message: "knit.config.ts already exists. Overwrite it?",
            initialValue: false,
        });

        if (p.isCancel(overwrite) || !overwrite) {
            p.cancel("Initialization cancelled.");
            return;
        }
    } catch {
        // Config doesn't exist yet. Continue.
    }

    const projectType = await p.select({
        message: "What kind of project are you setting up?",
        options: [
            { value: "frontend", label: "Frontend", hint: "React, Next.js, etc." },
            { value: "backend", label: "Backend", hint: "NestJS, etc." },
        ],
    });

    if (p.isCancel(projectType)) {
        p.cancel("Initialization cancelled.");
        return;
    }

    const srcDir = await p.text({
        message: "Where are your route files located?",
        placeholder: "./src/app",
        initialValue: "./src/app",
        defaultValue: "./src/app",
        validate: (value) => (value?.trim().length === 0 ? "Source directory is required." : undefined),
    });

    if (p.isCancel(srcDir)) {
        p.cancel("Initialization cancelled.");
        return;
    }

    const outDir = await p.text({
        message: "Where should Knit generate route types?",
        placeholder: "./src/types",
        initialValue: "./src/types",
        defaultValue: "./src/types",
        validate: (value) => (value?.trim().length === 0 ? "Output directory is required." : undefined),
    });

    if (p.isCancel(outDir)) {
        p.cancel("Initialization cancelled.");
        return;
    }

    const routeFile = projectType === "frontend" ? "page.tsx" : "route.ts";

    const config = `import { defineConfig } from "@knit/core";

export default defineConfig({
    srcDir: ${JSON.stringify(srcDir.trim())},
    outDir: ${JSON.stringify(outDir.trim())},
    routeFile: ${JSON.stringify(routeFile)},
});
`;

    await writeFile(configPath, config, "utf-8");

    p.note(
        [
            "Configuration file created: knit.config.ts",
            `Project type: ${projectType}`,
            `Source directory: ${srcDir}`,
            `Output directory: ${outDir}`,
            `Route file: ${routeFile}`,
            "",
            "You can edit knit.config.ts anytime to customize these settings.",
        ].join("\n"),
        "Configuration",
    );

    p.outro("Knit is ready! Run `pnpm knit` to start watching your routes.");
}
