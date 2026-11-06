import { AsyncLocalStorage } from "async_hooks";

/**
 * Accumulates parameter definitions while building the `RouteParams` type for
 * a single route pattern.
 */
export type ParsedRouteParam = string[] | null;

export interface RouteContext {
    path: string;
    param: ParsedRouteParam;
}

export const routeContext = new AsyncLocalStorage<RouteContext>();
