import { watch } from "fs";

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
