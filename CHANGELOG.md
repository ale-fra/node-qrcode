# 2.0.0 (unreleased)

The library is now written in TypeScript. Its behaviour is unchanged, except for
the points below: outputs were compared with 1.5.4 on ~1350 cases (QR codes,
renderers, files, browser entry point, CLI, browser bundles).

### Breaking changes

* **Node.js >= 22.13** (`engines`). The previous declaration (`>=10.13`) was
  not accurate: the library did not work on Node.js 10 (`TextEncoder is not
  defined`). Browsers are not affected (same syntax level and bundles as before).
* **Dependencies**: yargs 15 -> 18 (CLI), pngjs 5 -> 7, dijkstrajs 1.0.2 -> 1.0.3.
  Outputs are identical (PNG files included); the CLI help layout changed
  slightly (options without short alias are indented).
* **TypeScript types are bundled** (`types` in package.json): `@types/qrcode` is
  no longer needed and should be removed. The type names are the same and code
  written against `@types/qrcode` keeps compiling, with a few differences where
  `@types/qrcode` did not match the runtime:
  * `toFileStream()` returns `void` (it never returned a promise; errors are
    emitted on the stream). Its callback overloads are deprecated: the callback
    was never called.
  * `toCanvas(canvas, ...)` resolves/calls back with the canvas (was `void`).
  * `helper/to-sjis` returns `number | undefined` (undefined for unsupported characters).
  * wider option types: `errorCorrectionLevel` accepts level objects, byte
    segments accept strings and arrays of bytes, `type: 'image/png'` for
    `toBuffer()`/`toFileStream()`.
* **CLI file**: `bin/qrcode` is now `bin/qrcode.js`. The `qrcode` command is
  unchanged: only scripts running the file by its path are affected.
* **Internal modules** (deep imports such as `qrcode/lib/core/bit-matrix`):
  classes must be instantiated with `new`, and their static methods are no
  longer enumerable.
* **Strict mode**: invalid options (eg. a string instead of the options object)
  still fail, with a different error message.

### Features

* Default export: `import QRCode from 'qrcode'` works with bundlers and
  TypeScript, with or without `esModuleInterop`.
* Types for the browser bundles' `QRCode` global:
  `/// <reference types="qrcode/build/qrcode" />` (and `qrcode/build/qrcode.tosjis`).
* Source maps for all the published files (TypeScript sources included).

### Bug fixes

* `toDataURL()`: the callback was called twice (the second time with a
  `TypeError`) when the image could not be rendered.
* `toDataURL()`/`toBuffer()` with `type: 'svg' | 'utf8' | 'txt'` failed with
  "renderFunc is not a function": they now report that only png is supported.
* `null` options are treated as omitted options (they threw a `TypeError`).
* README: the kanji example used `build/qrcode.min.js` and
  `build/qrcode.tosjis.min.js`, which do not exist (`build/qrcode.js`, `build/qrcode.tosjis.js`).

### Documentation

* README: `toBuffer()` documented, CLI help updated (`--inverse` was missing),
  `toFileStream()` error reporting, Node.js requirement, TypeScript usage.
* `instruction.md`: installation, tests, test verification and smoke tests.
* `CONTRIBUTING.md`: development guide (layout, scripts, test conventions).

Note: releases 1.4.0 to 1.5.4 are not listed in this file.


## [1.3.3](https://github.com/soldair/node-qrcode/compare/v1.3.2...v1.3.3) (2019-01-16)

fixing security vulnerabillities reported by users of snyk and `npm audit` major
versions of deps were bumped and should only impact development of qrcode.


## [1.3.2](https://github.com/soldair/node-qrcode/compare/v1.3.0...v1.3.2) (2019-01-16)


### Bug Fixes

* forgot can-promise replacement ([2514445](https://github.com/soldair/node-qrcode/commit/2514445))
* replacing can-promise ([8197d78](https://github.com/soldair/node-qrcode/commit/8197d78))
* security vulnerabillities and a ref to new Buffer ([a40c757](https://github.com/soldair/node-qrcode/commit/a40c757))



# [1.3.0](https://github.com/soldair/node-qrcode/compare/v1.2.1...v1.3.0) (2018-10-01)



## [1.2.1](https://github.com/soldair/node-qrcode/compare/v1.2.0...v1.2.1) (2018-06-06)



# [1.2.0](https://github.com/soldair/node-qrcode/compare/v1.1.0...v1.2.0) (2017-12-28)



# [1.1.0](https://github.com/soldair/node-qrcode/compare/v1.0.1...v1.1.0) (2017-12-28)



## [1.0.1](https://github.com/soldair/node-qrcode/compare/v1.0.0...v1.0.1) (2017-12-27)



# [1.0.0](https://github.com/soldair/node-qrcode/compare/v0.9.0...v1.0.0) (2017-11-08)

no breaking changes. promoting to a stable semver

# [0.9.0](https://github.com/soldair/node-qrcode/compare/v0.8.2...v0.9.0) (2017-07-22)



## [0.8.2](https://github.com/soldair/node-qrcode/compare/v0.8.0...v0.8.2) (2017-05-23)



# [0.8.0](https://github.com/soldair/node-qrcode/compare/v0.7.1...v0.8.0) (2017-03-30)



## [0.7.1](https://github.com/soldair/node-qrcode/compare/v0.7.0...v0.7.1) (2017-03-17)



# [0.7.0](https://github.com/soldair/node-qrcode/compare/v0.6.0...v0.7.0) (2017-02-27)



# [0.6.0](https://github.com/soldair/node-qrcode/compare/v0.5.0...v0.6.0) (2017-02-24)



# [0.5.0](https://github.com/soldair/node-qrcode/compare/v0.4.4...v0.5.0) (2016-09-19)



## [0.4.4](https://github.com/soldair/node-qrcode/compare/v0.4.3...v0.4.4) (2016-08-25)



## [0.4.3](https://github.com/soldair/node-qrcode/compare/v0.4.0...v0.4.3) (2016-08-16)



# [0.4.0](https://github.com/soldair/node-qrcode/compare/0.2.10...v0.4.0) (2015-09-17)



## [0.1.1](https://github.com/soldair/node-qrcode/compare/v0.1.0...v0.1.1) (2011-04-17)



# [0.1.0](https://github.com/soldair/node-qrcode/compare/0.0.3...v0.1.0) (2011-04-17)



## [0.0.3](https://github.com/soldair/node-qrcode/compare/0.0.2...0.0.3) (2011-02-27)



## 0.0.2 (2010-12-27)



