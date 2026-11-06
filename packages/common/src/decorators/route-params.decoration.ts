import { Param, type ParameterDecoratorOptions, type PipeTransform, type Type } from "@nestjs/common";

import { routeContext } from "../route-context.js";

/**
 * Route-aware parameter decorator for Knit.
 *
 * Extends NestJS's `@Param` decorator with runtime validation against the
 * currently evaluated route context stored in `AsyncLocalStorage`.
 *
 * @param property - The route parameter name to extract, a pipe, or parameter decorator options.
 * @param optionsOrPipe - Optional parameter options or transformation pipe(s).
 * @param pipes - Additional transformation pipes.
 * @returns A NestJS parameter decorator.
 *
 * @throws {Error} If used outside of a discovered Knit route context.
 * @throws {Error} If used on a static route that contains no dynamic parameters.
 * @throws {Error} If the specified route parameter does not exist in the current route path.
 */
export function KnitParam(
    property?: string | (Type<PipeTransform> | PipeTransform) | ParameterDecoratorOptions,
    optionsOrPipe?: ParameterDecoratorOptions | Type<PipeTransform> | PipeTransform,
    ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator {
    const context = routeContext.getStore();

    if (!context) {
        throw new Error("KnitParam must be used within a discovered route.");
    }

    if (!context.param) {
        throw new Error(`Cannot use KnitParam on static route "${context.path}" because it has no route parameters.`);
    }

    if (typeof property === "string") {
        if (!context.param.includes(property)) {
            throw new Error(`Route parameter "${property}" does not exist in "${context.path}".`);
        }
    }

    const args = [property, optionsOrPipe, ...pipes].filter((arg) => arg !== undefined);

    return Reflect.apply(Param, undefined, args) as ParameterDecorator;
}
