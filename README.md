# Knit

**A modular, TypeScript-first full-stack framework for Node.js.**

Knit aims to bring together a cohesive developer experience for building full-stack applications, combining React, convention-based routing, and a structured backend architecture.

## Project Status

Knit is currently in its early development stage. Its architecture and foundational packages are being developed incrementally.

APIs, package structures, and conventions are subject to change.

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **UI:** React
- **Package Manager:** pnpm
- **Monorepo:** Turborepo
- **Build:** TypeScript Compiler (`tsc`)
- **Development Tooling:** Vite

## Repository Structure

```text
Knit/
├── packages/
│   └── core/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.*.json
```

## Getting Started

### Prerequisites

- Node.js 24 or later
- pnpm 12 or later

### Installation

```bash
git clone https://github.com/dagisolo10/Knit
cd Knit
pnpm install
```

### Build

Build all packages:

```bash
pnpm build
```

Build a specific package:

```bash
pnpm --filter @knit/core build
```

## Development

Run the development tasks:

```bash
pnpm dev
```

Run type checks:

```bash
pnpm check-types
```

Run linting:

```bash
pnpm lint
```

Format the code:

```bash
pnpm format
```

## License

Not yet determined.
