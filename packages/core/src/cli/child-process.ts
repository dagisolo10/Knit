import * as p from "@clack/prompts";
import { spawn, type ChildProcess } from "child_process";

const TSX_LOADER = import.meta.resolve("tsx");

/**
 * Starts the configured application entry point in a child process.
 *
 * The child runs through Node's `--import` hook using the `tsx` loader resolved
 * from `@knit/core`, so the application does not need to install `tsx` itself.
 * The child inherits the parent's stdio, which keeps terminal output and
 * interactive shutdown behavior consistent with the dev command.
 *
 * @param entryFile - Absolute path to the application entry point.
 * @returns The spawned child process.
 */
export function startApplication(entryFile: string): ChildProcess {
    const child = spawn(process.execPath, ["--import", TSX_LOADER, entryFile], { stdio: "inherit" });

    child.on("error", (error) => {
        p.log.error(`Failed to start Knit application: ${error.message}`);
    });

    return child;
}

/**
 * Stops an application child process and waits for it to exit.
 *
 * A graceful `SIGTERM` is sent first. If the process is still running after
 * `timeoutMs`, `SIGKILL` is used so an unresponsive child cannot block restarts
 * or shutdown indefinitely. Calling this for an already exited process is a
 * no-op.
 *
 * @param child - Child process to stop.
 * @param timeoutMs - Grace period before forcing termination, in milliseconds.
 * @returns A promise that resolves once the child has exited.
 */
export async function stopApplication(child: ChildProcess, timeoutMs = 5000): Promise<void> {
    if (hasExited(child)) return;

    await new Promise<void>((resolve) => {
        let settled = false;
        let forceKillTimer: ReturnType<typeof setTimeout> | undefined;

        const finish = () => {
            if (settled) return;

            settled = true;

            if (forceKillTimer !== undefined) {
                clearTimeout(forceKillTimer);
            }

            child.off("exit", finish);
            resolve();
        };

        child.once("exit", finish);

        forceKillTimer = setTimeout(() => {
            if (!hasExited(child)) {
                child.kill("SIGKILL");
            }
        }, timeoutMs);

        child.kill("SIGTERM");

        if (hasExited(child)) {
            finish();
        }
    });
}

function hasExited(child: ChildProcess): boolean {
    return child.exitCode !== null || child.signalCode !== null;
}
