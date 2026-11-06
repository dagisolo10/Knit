import "reflect-metadata";

/**
 * Public entry point for `@knit/common`.
 *
 * Re-exports all NestJS common symbols, as well as Knit-specific decorators,
 * exceptions, and the route context infrastructure.
 */

// Re-export all NestJS common symbols
export * from "@nestjs/common";

// Knit decorators
export * from "./decorators/index.js";

// Knit exceptions
export * from "./exceptions/index.js";

// Route context (used internally by decorators and by the core route loader)
export { routeContext, type RouteContext, type ParsedRouteParam } from "./route-context.js";
