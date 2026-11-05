import { Get, KnitController } from "@knit/core";

@KnitController()
export class RootController {
    @Get()
    health() {
        return {
            message: "🧶 Knit running",
            timestamp: new Date().toLocaleString(),
        };
    }
}
