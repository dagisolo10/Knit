export interface TemplateVersions {
    coreVersion: string;
    commonVersion: string;
}

export const PKG_JSON_TEMPLATE = (projectName: string, versions: TemplateVersions) =>
    JSON.stringify(
        {
            name: projectName,
            version: "0.1.0",
            private: true,
            type: "module",
            scripts: {
                build: "tsc",
                dev: "knit dev",
                start: "node dist/main.js",
            },
            dependencies: {
                "@knitjs/core": `^${versions.coreVersion}`,
                "@knitjs/common": `^${versions.commonVersion}`,
            },
            devDependencies: {
                "@types/node": "^26.6.6",
                typescript: "^7.0.2",
            },
        },
        null,
        4,
    );

export const TSCONFIG_TEMPLATE = JSON.stringify(
    {
        compilerOptions: {
            outDir: "./dist",
            rootDir: "./src",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            target: "ES2022",
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            strict: true,
            skipLibCheck: true,
            resolveJsonModule: true,
            isolatedModules: true,
            incremental: true,
            types: ["node"],
        },
        include: ["src"],
    },
    null,
    4,
);

export const KNIT_CONFIG_TEMPLATE = `import { defineConfig } from "@knitjs/core";

export default defineConfig({});
`;

export const MAIN_TS_TEMPLATE = `import { KnitFactory, Logger } from "@knitjs/core";

async function bootstrap() {
    const app = await KnitFactory.create();
    const port = Number(process.env["PORT"] ?? 3000);

    await app.listen(port);

    Logger.log(\`🧶 Knit running on port \${port}\\n\`);
}

await bootstrap();
`;

export const ROOT_CONTROLLER_TEMPLATE = `import { KnitController, Get } from "@knitjs/common";

@KnitController()
export class RootController {
    @Get()
    welcome() {
        return { message: "Welcome to knit" };
    }
}
`;

export const README_TEMPLATE = `# Scaffolded Knit Application

File-based routing for NestJS, powered by Knit.

## Quickstart

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Commands

| Command        | Description                                                    |
| -------------- | -------------------------------------------------------------- |
| \`pnpm dev\`   | Start the development server with hot reload (\`knit dev\`).   |
| \`pnpm build\` | Compile TypeScript source (\`tsc\`).                           |
| \`pnpm start\` | Run the production build (\`node dist/main.js\`).              |

## Generate Code

| Command                                       | Description                                                |
| --------------------------------------------- | ---------------------------------------------------------- |
| \`pnpm knit generate module /users\`          | Create a feature module and root controller at \`/users\`. |
| \`pnpm knit generate controller /users/[id]\` | Create a sub-controller in an existing feature module.     |

## Shorthands

| Shorthand   | Full form      | Description                |
| ----------- | -------------- | -------------------------- |
| \`g\`       | \`generate\`   | Generate a resource.       |
| \`mo\`      | \`module\`     | Generate a feature module. |
| \`co\`      | \`controller\` | Generate a controller.     |

Controllers require their root feature module to exist first. Route directories map to paths, and bracket segments like \`[id]\` become route parameters such as \`:id\`.
`;
