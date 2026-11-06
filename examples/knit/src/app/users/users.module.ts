import { Module } from "@knit/core";
import { UsersController } from "./controller.js";

@Module({
    imports: [],
    controllers: [UsersController],
})
export class UsersModule {}

