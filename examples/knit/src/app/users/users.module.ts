import { Module } from "@knit/common";
import { UsersController } from "./controller.js";

@Module({
    imports: [],
    controllers: [UsersController],
})
export class UsersModule {}

