# @knitjs/core

Core runtime engine, application bootstrapper, and `knit` CLI for Knit applications.

## Installation

```bash
pnpm add @knitjs/core @knitjs/common
```

## Usage

Start the development server with hot reload:

```bash
pnpm knit dev
```

Bootstrap an application with `KnitFactory`:

```ts
import { KnitFactory, Logger } from "@knitjs/core";

const app = await KnitFactory.create();
await app.listen(3000);

Logger.log("Knit running on port 3000");
```

## License

ISC
