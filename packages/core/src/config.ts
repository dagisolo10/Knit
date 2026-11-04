import { tsImport } from "tsx/esm/api";
import { pathToFileURL } from "url";
import path from "path";


interface KnitConfig {
    srcDir: string;
    outDir: string;
    routeFile: string;
}

function defineConfig(config: KnitConfig): KnitConfig {
    return config;
}

async function loadConfig(cwd = process.cwd()): Promise<KnitConfig> {
    const configPath = path.resolve(cwd, "knit.config.ts");

    const configUrl = pathToFileURL(configPath).href;

    const { default: config } = await tsImport(configUrl, import.meta.url);

    if (!config || typeof config !== "object") {
        throw new Error("Invalid Knit config: expected a default export.");
    }

    const required: (keyof KnitConfig)[] = ["srcDir", "outDir", "routeFile"];

    const missing = required.filter((key) => !config[key]);

    if (missing.length) {
        throw new Error(`Knit config is missing required properties: ${missing.join(", ")}`);
    }

    return {
        srcDir: path.resolve(cwd, config.srcDir),
        outDir: path.resolve(cwd, config.outDir),
        routeFile: path.resolve(cwd, config.routeFile),
    };
}

export { defineConfig, loadConfig, type KnitConfig };
