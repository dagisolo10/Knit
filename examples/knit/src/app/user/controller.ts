import { Get, KnitController } from "@knit/core";

@KnitController()
export class UserController {
    @Get()
    getUser() {
        return { message: "IT FREAK'IN WORKS" };
    }
}
