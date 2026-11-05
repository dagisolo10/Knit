import { Module, type DynamicModule, type Type } from "@nestjs/common";

@Module({})
export class KnitModule {
    static register(controllers: Type<unknown>[]): DynamicModule {
        return {
            controllers,
            module: KnitModule,
        };
    }
}
