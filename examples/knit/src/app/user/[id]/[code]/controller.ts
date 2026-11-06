import { Get, KnitController, KnitParam } from "@knit/core";

@KnitController()
export class UserIdCodeController {
    @Get()
    getUser(@KnitParam("id") id: string, @KnitParam("code") code: string) {
        return {
            id,
            code,
        };
    }
}
