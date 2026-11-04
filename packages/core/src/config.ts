import path from "path";
import { tsImport } from "tsx/esm/api";

interface KnitConfig {
    srcDir: string;
    outDir: string;
}

function defineConfig(config: KnitConfig): KnitConfig {
    return config;
}

async function loadConfig(cwd = process.cwd()): Promise<KnitConfig> {
    const configPath = path.resolve(cwd, "knit.config.ts");

    const { default: config } = await tsImport(configPath, import.meta.url);

    if (!config || typeof config !== "object") {
        throw new Error("Invalid Knit config: expected a default export.");
    }

    if (!config.srcDir || !config.outDir) {
        throw new Error("Knit config must define srcDir and outDir.");
    }

    return {
        srcDir: path.resolve(cwd, config.srcDir),
        outDir: path.resolve(cwd, config.outDir),
    };
}

export { defineConfig, loadConfig, type KnitConfig };
