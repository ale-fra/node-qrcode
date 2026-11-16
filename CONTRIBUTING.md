# qrcode Contributing Guidelines

- Always search for a related issue before starting a new issue.
- Always choose a concise, helpful issue name.
- Always stay on-topic. If you've got a new bug report or feature request, put it in its own issue.
- Always be polite to other people.
- Never post private information, such as torrent or tracker names, IP addresses, etc.

Issues that break the rules may be deleted and locked without warning.

## qrcode is an OPEN Open Source Project

Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

## Rules

There are a few basic ground-rules for contributors:

1. **No `--force` pushes** or modifying the Git history in any way.
1. **External API changes and significant modifications** should be subject to a **pull request** to solicit feedback from other contributors.
1. Pull requests to solicit feedback are *encouraged* for any other non-trivial contribution but left to the discretion of the contributor.
1. Use a non-`master` branch for ongoing work.
1. Contributors should attempt to adhere to the prevailing code style.
1. Install dependencies with `pnpm install` (the pnpm version is pinned in `package.json` via `packageManager`; `corepack enable` will pick it up) and run `pnpm test` locally before submitting your PR to catch easy-to-miss style & testing issues

## Development

Requirements: Node.js >= 22.18 (`.nvmrc`; `devEngines` in `package.json`, checked by the
build and test scripts since pnpm does not check it), pnpm (version pinned in `package.json`).
See [README.md](README.md) for usage and the commands below for development checks.

### Layout

| Folder | Content |
| --- | --- |
| `src/` | TypeScript sources: `src/{lib,helper,bin}` compile to `./{lib,helper,bin}` (the published paths) |
| `test/` | tap tests (TypeScript plus the imported PDF assertion corpus in CommonJS): `unit/` mirrors `src/`, `e2e/` tests the public API and the CLI, `utils/` shared test helpers, `fixtures/` expected outputs |
| `examples/` | examples (TypeScript, run directly by Node.js) |
| `tools/` | development tools: `node-version/` (Node.js version check), `compile-check/` (keeps compiled files consistent with `src/` before incremental builds), `migration-check/` (behavioural comparison with the JavaScript implementation), `package-check/` (checks of the published package, as used by consumers) |
| `rollup.config.ts` | browser bundles (`build/`, not committed) |

Each folder is a TypeScript project (`tsconfig.json`, sharing `tsconfig.base.json`);
the root `tsconfig.json` references all of them.

### Scripts

| Command | |
| --- | --- |
| `pnpm build` | compiles the library (incremental) and the browser bundles (`build/`) |
| `pnpm typecheck` | builds/type-checks all the projects (incremental, `tsc -b`) |
| `pnpm watch` | incremental build in watch mode |
| `pnpm lint` | ESLint ([neostandard](https://github.com/neostandard/neostandard)), cached |
| `pnpm test` | lint + type-check, then the tests with coverage |
| `pnpm clean` | removes all the build outputs and caches |
| `pnpm run migration-check` | compares the build with the JavaScript implementation (see `tools/migration-check/README.md`) |
| `pnpm run package-check` | checks the package as published: contents, CommonJS/ESM/CLI, types, bundlers (see `tools/package-check/README.md`) |
| `pnpm run ci` | everything above: test, migration-check, package-check (entry point for continuous integration) |

Notes:

- Tests run against the compiled library (what is published): `pnpm test` builds it first.
- Coverage must be 100% for every module of the library, including modules which no test
  loads (see `.nycrc.json`): a new module needs tests.
- Intentional misuse of the API in tests is marked with `// @ts-expect-error: <reason>`.
- Tests which replace (stub) functions of a module must import it with `import x = require('x')`.

## Releases

Declaring formal releases remains the prerogative of the project maintainer.

## Changes to this arrangement

*Thanks to [Rod Vagg](https://github.com/rvagg) and the [LevelUP](https://github.com/rvagg/node-levelup) project for coming up with this model of open source contribution.*
