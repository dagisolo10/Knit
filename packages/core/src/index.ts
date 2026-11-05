import "reflect-metadata";

/**
 * Public entry point for `@knit/core`.
 */

// Factory
export { KnitFactory } from "./knit-factory.js";

// Configuration
export { defineConfig, type KnitConfig } from "./config.js";

// Common
export * from "./common/index.js";
