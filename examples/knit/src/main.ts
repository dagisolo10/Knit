import { KnitFactory, Logger } from "@knitjs/core";

async function bootstrap() {
    const app = await KnitFactory.create();

    const port = process.env["PORT"] ?? 3000;

    await app.listen(port);

    console.log();
    Logger.log(`🧶 Knit running on port ${port}\n`);
}

await bootstrap();
