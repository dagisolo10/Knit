import { Get, Post } from "@nestjs/common";

import { Controller } from "./common/decorators/core/controller.decorator.js";

@Controller()
export class UserController {
    @Get()
    findAll() {}

    /**
     * Throws DuplicateRouteMethodException error
     */
    @Get()
    findOne() {}

    @Post()
    create() {}
}
