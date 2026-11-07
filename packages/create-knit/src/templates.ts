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
                "@knitjs/core": "^0.0.5",
                "@knitjs/common": "^0.0.2",
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
