# Migration check

Behavioural comparison between the original JavaScript implementation (1.5.4)
and the TypeScript build. Not part of the published package.

```sh
pnpm run migration-check
```

builds the package, takes a snapshot of it and compares it with the reference
snapshot of the JavaScript implementation.
Known and accepted differences are listed, with their reason, in
`expected-differences.json`: any other difference makes the command fail.

## Reference

The reference snapshot is a generated file: it is not committed, but re-created
from git history by `src/reference.ts` (about 20 seconds, first run only):
commit `3848ed2c17de5bcdead487417dbf14c5dd017f8d` in this standalone repository
is extracted with `git archive`, installed with `npm ci --ignore-scripts`
and its original lockfile, then built explicitly. The harness supplies its own
canvas implementation; reference native canvas install scripts are unnecessary.

The attachment referenced monorepo commit `0558146` and path `node-qrcode/`.
That history is unavailable here. This check deliberately uses the verifiable
upstream base instead. Bug fixes relative to that base are enumerated as narrow,
value-constrained expected differences, alongside TypeScript interop differences.
No reference tag is needed; an optional `migration-reference/upstream-1.5.4`
tag must resolve to the pinned upstream SHA.

## What is recorded

About 1350 deterministic entries (big outputs are stored as sha256 hashes):

| Section (`src/snapshot/sections/`) | Content |
| --- | --- |
| `surface` | exports of every module (names, types, prototypes, statics) |
| `core` | tables and pure functions (Galois field, Reed-Solomon, capacities, format/version bits, ...) |
| `create` | `create()` over ~550 inputs: random mixed-charset texts, all versions, EC levels and masks, segments, invalid inputs |
| `renderers`, `arguments` | public API: every renderer/option/type, callbacks and promises, argument validation, malformed options |
| `files` | `toFile()` (type from option or extension), `toFileStream()` |
| `browser` | browser entry point with @napi-rs/canvas (pixels compared, not PNG bytes) |
| `cli` | command line interface (child process) |
| `bundle` | browser bundles, run in a VM context |
| `kanji` | kanji mode (global state: runs last) |

## Tools

```sh
tsx tools/migration-check/src/snapshot.ts <packageRoot> <out.json[.gz]>
tsx tools/migration-check/src/compare.ts <reference> <candidate> [expected-differences.json]
tsx tools/migration-check/src/reference.ts <out.json[.gz]>
```
