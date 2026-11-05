# 🧶 Knit

**Type-safe file-based routing for NestJS.**

Knit maps your directory structure to NestJS controller routes while preserving the NestJS programming model. Controllers are still normal Nest controllers; Knit discovers them, derives their route paths, and registers them in a generated application module.

## Features

- **File-based routing** — Define route paths through your directory structure.
- **NestJS controllers** — Use Nest decorators such as `@Get()`, `@Post()`, and `@Param()` as usual.
- **Dynamic routes** — Directory names such as `[id]` become route parameters like `:id`.
- **Development watcher** — Restart the application when the entry point or source files change.
- **Configurable** — Configure the source directory and application entry point.
- **CLI** — Start the development workflow with one command.

## Getting Started

Start the development server:

```bash
pnpm knit dev
```

If `knit.config.ts` does not exist, Knit creates one with the default settings. The configured entry point must already exist.

## Project Structure

Knit discovers files named `controller.ts` under the configured source directory. A directory's path relative to `srcDir` becomes its route path.

```text
src/
├── app/
│   ├── controller.ts
│   ├── about/
│   │   └── controller.ts
│   └── users/
│       ├── controller.ts
│       └── [id]/
│           └── controller.ts
└── main.ts
```

| Controller file                | Route path   |
| ------------------------------ | ------------ |
| `app/controller.ts`            | `/`          |
| `app/about/controller.ts`      | `/about`     |
| `app/users/controller.ts`      | `/users`     |
| `app/users/[id]/controller.ts` | `/users/:id` |

Bracketed directory names are passed to NestJS as route parameters. Each `controller.ts` file must export exactly one controller class.

## Application Entry Point

Knit does not own the application bootstrap. The entry point creates the Nest application through `KnitFactory` and listens on a port:

```ts
import { KnitFactory, Logger } from "@knit/core";

async function bootstrap() {
    const app = await KnitFactory.create();
    const port = process.env["PORT"] ?? 3000;

    await app.listen(port);

    Logger.log(`🧶 Knit running on port ${port}`);
}

await bootstrap();
```

V1 expects an ESM-compatible entry point, so the example project uses `"type": "module"`.

## Controllers

Controllers use the standard NestJS decorators plus `@KnitController()`:

```ts
import { Get, KnitController, Param } from "@knit/core";

@KnitController()
export class UserController {
    @Get(":id")
    getUser(@Param("id") id: string) {
        return { id };
    }
}
```

`@KnitController()` takes the route path from the directory containing `controller.ts`. It also validates that the controller does not register the same HTTP method twice.

## Configuration

Knit reads `knit.config.ts` from the project root:

```ts
import { defineConfig } from "@knit/core";

export default defineConfig({
    srcDir: "./src/app",
    entryFile: "./src/main.ts",
});
```

| Option      | Default         | Description                                              |
| ----------- | --------------- | -------------------------------------------------------- |
| `srcDir`    | `./src/app`     | Directory scanned recursively for `controller.ts` files. |
| `entryFile` | `./src/main.ts` | Application entry point started by `knit dev`.           |

Both properties are optional. Relative paths are resolved from the project directory when the configuration is loaded. The entry file is responsible for creating and listening with the Nest application.

Changes to `knit.config.ts` require manually restarting `knit dev`.

## Development Workflow

`knit dev`:

1. Creates a default `knit.config.ts` if one is missing.
2. Validates the configured source directory and entry file.
3. Starts the entry point in a child Node.js process using Knit's bundled `tsx` loader.
4. Watches the source directory and entry point for changes.
5. Stops the previous child and starts a new one after changes are debounced.

Press Ctrl+C to stop the application; Knit also cleans up the child process on SIGINT and SIGTERM.

## CLI Commands

| Command         | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| `pnpm knit dev` | Start the application and restart it when source files change. |

## Roadmap

Knit currently focuses on filesystem-based controller discovery and NestJS application creation. Future development will expand the routing surface while retaining NestJS capabilities and architecture.

## License

MIT
