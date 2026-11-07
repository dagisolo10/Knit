export const PKG_JSON_TEMPLATE = (projectName: string) =>
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
                "@knit/common": "workspace:*",
                "@knit/core": "workspace:*",
            },
            devDependencies: {
                "@types/node": "^26.6.6",
                typescript: "^5.0.0",
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

export const KNIT_CONFIG_TEMPLATE = `import { defineConfig } from "@knit/core";

export default defineConfig({});
`;

export const MAIN_TS_TEMPLATE = `import { KnitFactory, Logger } from "@knit/core";

async function bootstrap() {
    const app = await KnitFactory.create();
    const port = process.env["PORT"] ?? 3000;

    await app.listen(port);

    Logger.log(\`🧶 Knit running on port \${port}\\n\`);
}

await bootstrap();
`;

export const ROOT_CONTROLLER_TEMPLATE = `import { KnitController, Get } from "@knit/common";

@KnitController()
export class RootController {
    @Get()
    welcome() {
        return { message: "Welcome to knit" };
    }
}
`;
