import type { INestApplication, NestApplicationOptions, Type } from "@knit/common";
import { NestFactory } from "@nestjs/core";

import { loadConfig } from "../config.js";
import { KnitModule } from "../module/knit.module.js";
import { loadRoutes } from "../routing/route-loader.js";

export class KnitFactory {
    static async create(options?: NestApplicationOptions): Promise<INestApplication> {
        const config = await loadConfig();

        const routes = await loadRoutes(config.srcDir);

        const controllers = routes.map((route) => {
            const exports = Object.values(route.exports);

            if (exports.length !== 1 || typeof exports[0] !== "function") {
                throw new Error(`Expected exactly one controller class export in ${route.filePath}`);
            }

            return exports[0] as Type<unknown>;
        });

        const module = KnitModule.register(controllers);

        return NestFactory.create(module, options);
    }
}
