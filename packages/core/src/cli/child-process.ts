import * as p from "@clack/prompts";
import { ChildProcess, spawn } from "child_process";
import { fileURLToPath } from "url";

export function startRuntime(): ChildProcess {
    const runtimePath = fileURLToPath(new URL("../runtime.js", import.meta.url));

    const child = spawn(process.execPath, [runtimePath], { stdio: "inherit" });

    child.on("error", (error) => {
        p.log.error(`Failed to start Knit runtime: ${error.message}`);
    });

    return child;
}
