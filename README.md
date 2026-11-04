# 🧶 Knit

**Type-safe file-based routing for your applications.**

Knit is a TypeScript route type generator built around filesystem-based routing. It scans your route directory and generates TypeScript definitions for your routes and their parameters.

Knit aims to bring a file-based routing experience to NestJS while preserving everything that makes NestJS powerful.

> Currently, Knit provides route scanning, type generation, and CLI tooling. NestJS integration and runtime route registration are not yet implemented.

## Features

- **File-based routing** — Define routes through your project directory structure.
- **Type generation** — Automatically generate TypeScript route patterns and parameter types.
- **Dynamic routes** — Support dynamic segments, catch-all segments, and optional catch-all segments.
- **Development watcher** — Automatically regenerate route types when route files change.
- **Configurable** — Configure route directories, output directories, and route filenames.
- **CLI** — Initialize and run Knit through simple commands.

## Getting Started

Initialize Knit in your project:

```bash
pnpm knit init
```

Start the development watcher:

```bash
pnpm knit
```

Or explicitly run:

```bash
pnpm knit dev
```

## Project Structure

Knit discovers routes based on your configured source directory.

For example:

```text
src/
└── app/
    ├── route.ts
    ├── about/
    │   └── route.ts
    ├── users/
    │   ├── route.ts
    │   └── [id]/
    │       └── route.ts
    └── docs/
        └── [...slug]/
            └── route.ts
```

Each directory represents a URL segment, and a `route.ts` file identifies a route.

The structure above represents:

| Route file                    | Route pattern |
| ----------------------------- | ------------- |
| `app/route.ts`                | `/`           |
| `app/about/route.ts`          | `/about`      |
| `app/users/route.ts`          | `/users`      |
| `app/users/[id]/route.ts`     | `/users/:id`  |
| `app/docs/[...slug]/route.ts` | `/docs/*slug` |

Knit also supports optional catch-all segments using `[[...slug]]`.

## Configuration

Knit uses a `knit.config.ts` file in your project root.

```ts
import { defineConfig } from "@knit/core";

export default defineConfig({
    srcDir: "./src/app",
    outDir: "./src/types",
    routeFile: "route.ts",
});
```

| Option      | Description                                  |
| ----------- | -------------------------------------------- |
| `srcDir`    | Directory containing your route files.       |
| `outDir`    | Directory where generated types are written. |
| `routeFile` | Filename Knit uses to identify route files.  |

## Generated Types

Knit automatically generates TypeScript definitions from your filesystem routes.

The generated file contains two exports:

- `RoutePattern` — A union of all discovered route patterns.
- `RouteParams` — A mapping between each route pattern and its corresponding parameters.

For example, given these routes:

```text
src/app/
├── profile/
│   ├── route.ts
│   └── [[...docs]]/
│       └── route.ts
├── settings/
│   └── route.ts
└── user/
    ├── [...slug]/
    │   └── route.ts
    └── [id]/
        └── route.ts
```

Knit generates:

```ts
export type RoutePattern = "/profile" | "/profile/[[...docs]]" | "/settings" | "/user/[...slug]" | "/user/[id]";

export type RouteParams = {
    "/profile": Record<string, never>;
    "/profile/[[...docs]]": { docs?: string[] };
    "/settings": Record<string, never>;
    "/user/[...slug]": { slug: string[] };
    "/user/[id]": { id: string };
};
```

### Parameter Types

| Segment       | Parameter type          |
| ------------- | ----------------------- |
| `[id]`        | `{ id: string }`        |
| `[...slug]`   | `{ slug: string[] }`    |
| `[[...docs]]` | `{ docs?: string[] }`   |
| Static route  | `Record<string, never>` |

`Record<string, never>` ensures that static routes cannot accept arbitrary parameters.

These generated types provide a type-safe representation of your application's route structure.

## CLI Commands

| Command          | Description                               |
| ---------------- | ----------------------------------------- |
| `pnpm knit init` | Initialize Knit configuration.            |
| `pnpm knit`      | Start the development watcher.            |
| `pnpm knit dev`  | Start the development watcher explicitly. |

## Roadmap

Knit is being developed as an extension of NestJS.

The current focus is route discovery and type generation. Future development will introduce filesystem-based runtime routing while retaining NestJS capabilities and architecture.

## License

MIT
