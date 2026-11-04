import { watch } from "fs";

/**
 * Watches a route directory for changes and regenerates route types.
 *
 * File events are debounced by 100 ms, and regenerations are chained so they
 * run sequentially instead of concurrently. Regeneration failures are logged
 * and do not stop the watcher.
 *
 * The watcher is not exposed, so it remains active until the process exits.
 *
 * @param srcDir - Directory to watch recursively.
 * @param onChange - Async callback invoked after the debounce interval to regenerate output.
 * @returns A promise that resolves once the watcher has been created.
 */
export async function watchRoutes(srcDir: string, onChange: () => Promise<void>) {
    let generation = Promise.resolve();
    let debounceTimer: ReturnType<typeof setTimeout>;

    const queueGeneration = () => {
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            generation = generation
                .then(() => onChange())
                .catch((error) => {
                    console.error("[KNIT] Failed to regenerate route types:", error);
                });
        }, 100);
    };

    const { signal } = new AbortController();

    watch(srcDir, { recursive: true, signal }, queueGeneration);
}
