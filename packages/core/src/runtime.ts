import { register } from "tsx/esm/api";

import { KnitFactory } from "./knit-factory.js";

register();

const app = await KnitFactory.create();

await app.listen(process.env["PORT"] ?? 3000);
