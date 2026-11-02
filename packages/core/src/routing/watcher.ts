import { watch } from "fs";
import path from "path";

export async function watchRoutes(appDir: string, onChange: () => Promise<void>) {
    const { signal } = new AbortController();

    const watcher = watch(appDir, { recursive: true, signal }, (_, filename) => {
        if (!filename) return;

        if (path.basename(filename) === "page.tsx") {
            onChange();
        }
    });

    return watcher;
}
