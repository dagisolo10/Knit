import { AsyncLocalStorage } from "async_hooks";

import type { ParsedRouteParam } from "../parser.js";

export interface RouteContext {
    path: string;
    param: ParsedRouteParam;
}

export const routeContext = new AsyncLocalStorage<RouteContext>();
