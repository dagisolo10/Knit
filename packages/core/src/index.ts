import "reflect-metadata";

/**
 * Public entry point for `@knit/core`.
 *
 * Re-exports all symbols from `@knit/common` for backward compatibility,
 * plus the application factory, configuration helpers, and internal modules.
 */

// Re-export everything from @knit/common (decorators, exceptions, NestJS common)
export * from "@knit/common";

// Factory
export { KnitFactory } from "./factory/knit-factory.js";

// Configuration
export { defineConfig, type KnitConfig, type ResolvedKnitConfig } from "./config.js";

// Module
export { KnitModule } from "./module/knit.module.js";
