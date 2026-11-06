import { Controller, RequestMethod, type ControllerOptions } from "@nestjs/common";
import { METHOD_METADATA } from "@nestjs/common/constants";

import { routeContext } from "../route-context.js";
import { DuplicateRouteMethodException } from "../exceptions/duplicate-route-method.exception.js";

export type KnitControllerOptions = Omit<ControllerOptions, "path">;

/**
 * Decorator that applies the current route path and validates controller
 * handlers.
 *
 * The route path is read from the route context established while loading the
 * controller module. Duplicate HTTP methods within the controller are detected
 * before NestJS's controller metadata is applied.
 *
 * @param options - Controller configuration options, excluding the path.
 * @returns A class decorator.
 * @throws {Error} If used outside a discovered route module.
 */
export function KnitController(options?: KnitControllerOptions): ClassDecorator {
    const context = routeContext.getStore();

    if (!context) {
        throw new Error("KnitController must be used within a discovered route.");
    }

    const nestController = Controller({ ...options, path: context.path });

    return (target) => {
        const methods = Object.getOwnPropertyNames(target.prototype);

        const registeredMethods = new Map<number, string>();

        for (const name of methods) {
            const descriptor = Object.getOwnPropertyDescriptor(target.prototype, name);

            if (!descriptor || typeof descriptor.value !== "function") continue;

            const handler = descriptor.value;

            if (typeof handler !== "function") continue;

            const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;

            if (requestMethod === undefined) continue;

            const existing = registeredMethods.get(requestMethod);

            if (existing) {
                throw new DuplicateRouteMethodException(RequestMethod[requestMethod], target.name, existing, name);
            }

            registeredMethods.set(requestMethod, name);
        }

        nestController(target);
    };
}
