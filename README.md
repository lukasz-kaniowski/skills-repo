# Skills Repo

A platform for uploading, managing, and browsing reusable software skills. Built as a TypeScript monorepo with an API server, CLI tool, and web UI.

## Architecture

```
apps/
  api/   — REST API server (Hono) for skill storage and retrieval
  cli/   — Command-line tool for uploading skills
  ui/    — Web interface for browsing skills (Next.js)
packages/
  types/ — Shared TypeScript type definitions
```

## Prerequisites

- Node.js >= 20
- [pnpm](https://pnpm.io/) 10.17+

## Getting Started

```bash
pnpm install
pnpm run dev
```

The API server runs on `http://localhost:3001` and the UI on `http://localhost:3000`.

## Scripts

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `pnpm run dev`     | Start all apps in development mode |
| `pnpm run build`   | Build all packages                 |
| `pnpm run test`    | Run tests                          |
| `pnpm run typecheck` | Type-check all packages          |
| `pnpm run lint`    | Lint all packages                  |
| `pnpm run clean`   | Remove build artifacts and node_modules |

A [justfile](./justfile) is also provided — run `just` to see available commands. `just check` runs typecheck, lint, and test together.

## API Endpoints

| Method | Path                              | Description                    |
| ------ | --------------------------------- | ------------------------------ |
| GET    | `/`                               | Health check                   |
| GET    | `/skills`                         | List all skills                |
| POST   | `/skills`                         | Upload a skill (tarball)       |
| GET    | `/skills/:name/:version`          | Get skill details              |
| GET    | `/skills/:name/:version/files/*`  | Serve individual skill files   |

## Skill Format

Skills are packaged as tarballs containing a `skill.json` manifest:

```json
{
  "name": "my-skill",
  "version": "1.0.0",
  "description": "Optional description"
}
```

Constraints:
- Names must match `^[a-z0-9][a-z0-9-]*$`
- Versions must match `^[a-zA-Z0-9][a-zA-Z0-9.\-+]*$`
- Maximum tarball size: 5 MB
