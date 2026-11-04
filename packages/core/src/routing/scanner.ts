import { readdir } from "fs/promises";
import path from "path";

export async function scanRoutes(srcDir: string): Promise<string[]> {
    const entries = await readdir(srcDir, { withFileTypes: true });

    const routes: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(srcDir, entry.name);

        if (entry.isDirectory()) {
            routes.push(...(await scanRoutes(fullPath)));
        }

        if (entry.isFile() && entry.name === "page.tsx") {
            routes.push(fullPath);
        }
    }

    return routes;
}
