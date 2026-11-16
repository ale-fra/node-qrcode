# Package check

Checks the package as it is published and used by consumers. Not part of the
published package.

```sh
pnpm run package-check
```

1. packs the package (`pnpm pack`: clean build, as for a release)
2. installs the tarball with npm in a project created outside of the repository
   (nothing can be resolved from the repository `node_modules`)
3. runs the checks, then removes the project

| Checks (`src/checks/`) | |
| --- | --- |
| `contents` | published entries, package.json entry points, documented files, no stale compiled file, source maps resolvable |
| `runtime` | `require()`, `import`, README TypeScript example, installed CLI |
| `types` | public API usage compiles with 4 common compiler configurations; invalid usages are rejected; the same usage compiles against `@types/qrcode`; types of the browser bundles' global |
| `bundlers` | esbuild and browserify bundles use the browser entry point (no server code), default and named imports |

Consumer files are in `fixtures/` (`runtime/`, `types/`, `bundlers/`).
`fixtures/types/usage*.ts` must stay valid for `@types/qrcode`: code written
against the community typings must keep compiling with the bundled ones.
