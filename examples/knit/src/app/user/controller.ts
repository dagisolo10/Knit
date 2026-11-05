import { Get, KnitController } from "@knit/core";

@KnitController()
export class UserController {
    @Get()
    getUser() {
        console.log(UserController.name, "IT FREAK'IN WORKS");
        return { message: "IT FREAK'IN WORKS" };
    }
}
