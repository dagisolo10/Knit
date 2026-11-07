import { Module } from "@knitjs/common";

import { UsersController } from "./controller.js";

@Module({
    imports: [],
    controllers: [UsersController],
})
export class UsersModule {}
