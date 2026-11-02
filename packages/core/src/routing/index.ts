import { createCliColors } from "@/cli-colors";
import { generateRouteTypes } from "@/routing/generate-route-types";
import { watchRoutes } from "@/routing/watcher";

export const appDir = "./test-fixtures/app";
export const outPath = "./src/routing/knit-routes.d.ts";

const pc = createCliColors();

async function generate() {
    const changed = await generateRouteTypes(appDir, outPath);

    const message = changed ? pc.greenBright("Types generated in " + outPath) : pc.gray("Skipped generating types, no file changes");

    const log = [pc.dim("[") + pc.bold(pc.blue("KNIT")) + pc.dim("]"), pc.dim("[") + pc.bold(pc.cyan("TYPE")) + pc.dim("]"), pc.dim("[") + pc.bold(pc.yellow("GENERATE")) + pc.dim("]"), message].join(" ");

    console.log(log);
}

await generate();

watchRoutes(appDir, generate);
