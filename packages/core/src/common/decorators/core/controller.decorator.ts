import { Controller as NestController, RequestMethod, type ControllerOptions } from "@nestjs/common";
import { METHOD_METADATA } from "@nestjs/common/constants";

import { DuplicateRouteMethodException } from "../../exceptions/duplicate-route-method.exception.js";

/**
 * Decorator that extends NestJS's Controller decorator with route validation.
 *
 * Detects duplicate HTTP methods within a controller before applying
 * NestJS's original controller metadata.
 *
 * @param prefixOrOptions - Route prefix or controller configuration options.
 * @returns A class decorator.
 */
export function Controller(prefixOrOptions?: string | string[] | ControllerOptions): ClassDecorator {
    let nestController: ClassDecorator;

    if (typeof prefixOrOptions === "string" || Array.isArray(prefixOrOptions)) {
        nestController = NestController(prefixOrOptions);
    } else if (prefixOrOptions) {
        nestController = NestController(prefixOrOptions);
    } else {
        nestController = NestController();
    }

    return (target) => {
        const methods = Object.getOwnPropertyNames(target.prototype);

        const registeredMethods = new Map<number, string>();

        for (const name of methods) {
            const handler = target.prototype[name];

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
