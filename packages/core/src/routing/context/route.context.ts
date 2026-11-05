import { AsyncLocalStorage } from "async_hooks";

export interface RouteContext {
    path: string;
}

export const routeContext = new AsyncLocalStorage<RouteContext>();
