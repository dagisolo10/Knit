import "reflect-metadata";

/**
 * Public entry point for `@knitjs/core`.
 *
 * Re-exports all symbols from `@knitjs/common` for backward compatibility,
 * plus the application factory, configuration helpers, and internal modules.
 */

// Re-export everything from @knitjs/common (decorators, exceptions, NestJS common)
export * from "@knitjs/common";

// Factory
export { KnitFactory } from "./factory/knit-factory.js";

// Configuration
export { defineConfig, type KnitConfig, type ResolvedKnitConfig } from "./config.js";

// Module
export { KnitModule } from "./module/knit.module.js";
