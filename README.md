# node-qrcode
> QR code/2d barcode generator.

[![npm](https://img.shields.io/npm/v/qrcode.svg?style=flat-square)](https://www.npmjs.com/package/qrcode)
[![npm](https://img.shields.io/npm/dt/qrcode.svg?style=flat-square)](https://www.npmjs.com/package/qrcode)
[![npm](https://img.shields.io/npm/l/qrcode.svg?style=flat-square)](https://github.com/soldair/node-qrcode/blob/master/license)

- [Highlights](#highlights)
- [Installation](#installation)
- [Usage](#usage)
- [Error correction level](#error-correction-level)
- [QR Code capacity](#qr-code-capacity)
- [Encoding Modes](#encoding-modes)
- [Binary data](#binary-data)
- [Multibyte characters](#multibyte-characters)
- [API](#api)
- [GS1 QR Codes](#gs1-qr-codes)
- [Credits](#credits)
- [License](#license)

## Highlights
- Works on server and client (and react native with svg)
- CLI utility
- Save QR code as image
- Support for Numeric, Alphanumeric, Kanji and Byte mode
- Support for mixed modes
- Support for chinese, cyrillic, greek and japanese characters
- Support for multibyte characters (like emojis :smile:)
- Auto generates optimized segments for best data compression and smallest QR Code size
- App agnostic readability, QR Codes by definition are app agnostic

## Installation
Inside your project folder do:

```shell
npm install --save qrcode
```

or, install it globally to use `qrcode` from the command line to save qrcode images or generate ones you can view in your terminal.

```shell
npm install -g qrcode
```

Requires Node.js >= 22.13 (browsers: see [Browser](#browser)).

## Usage
### CLI

```
Usage: qrcode [options] <input string>

QR Code options:
  -v, --qversion  QR Code symbol version (1 - 40)                       [number]
  -e, --error     Error correction level           [choices: "L", "M", "Q", "H"]
  -m, --mask      Mask pattern (0 - 7)                                  [number]

Renderer options:
  -t, --type        Output type           [choices: "png", "svg", "utf8", "pdf"]
  -i, --inverse     Invert colors                                      [boolean]
  -w, --width       Image width (px)                                    [number]
  -s, --scale       Scale factor                                        [number]
  -q, --qzone       Quiet zone size                                     [number]
  -l, --lightcolor  Light RGBA hex color
  -d, --darkcolor   Dark RGBA hex color
      --small       Output smaller QR code to terminal                 [boolean]

PDF options (sizes in mm):
      --page-size  Page size
                    [choices: "A4", "A3", "A5", "Letter", "Legal"] [default: A4]
      --size       QR code size, quiet zone included      [number] [default: 50]
      --top        Distance from the top edge of the page
                                                    [number] [default: centered]
      --left       Distance from the left edge of the page
                                                    [number] [default: centered]
      --gap        Space between codes (--batch)           [number] [default: 5]
      --columns    Codes per row (--batch)    [number] [default: as many as fit]
      --rows       Rows per page (--batch)    [number] [default: as many as fit]
      --batch      One QR code per input line (stdin) or argument, laid out on a
                   grid over as many pages as needed                   [boolean]

Options:
  -o, --output   Output file
  -h, --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]

Examples:
  qrcode "some text"                        Draw in terminal window
  qrcode -o out.png "some text"             Save as png image
  qrcode -d F00 -o out.png "some text"      Use red as foreground color
  qrcode -o out.pdf --size 40 --top 20      Place a 40 mm QR code on an A4 PDF
  --left 20 "some text"
  qrcode -o sheet.pdf --batch --size 30 <   One 30 mm QR code per line, as many
  urls.txt                                  pages as needed
```
If not specified, output type is guessed from file extension.<br>
Recognized extensions are `png`, `svg`, `txt` and `pdf`.

#### Printing (PDF)
Save the QR code on a printable page (A4 by default), with its size and position in millimetres:

```shell
# 50 mm code centered on an A4 page
qrcode -o qrcode.pdf "some text"

# 40 mm code, 20 mm from the top-left corner of a Letter page
qrcode -o qrcode.pdf --page-size Letter --size 40 --top 20 --left 20 "some text"
```
The PDF is vector-based, so the code stays sharp at any size. `--size` includes the quiet zone (`--qzone`).

With `--batch`, each line of the input (or each argument) becomes its own QR code. The codes are laid out on a grid, row by row, adding pages as needed:

```shell
# one 30 mm code per line of urls.txt, as many per page as fit
qrcode -o sheet.pdf --batch --size 30 < urls.txt

# label sheet: 4 x 6 codes of 40 mm, 8 mm apart, grid starting 8 mm from the top and 13 mm from the left
qrcode -o labels.pdf --batch --size 40 --gap 8 --columns 4 --rows 6 --top 8 --left 13 < ids.txt

# codes given as arguments
qrcode -o sheet.pdf --batch "https://example.com/a" "https://example.com/b"
```
Blank lines are skipped. Without `--columns`/`--rows`, as many codes as fit are placed while keeping 10 mm from the page edges; without `--top`/`--left` the grid is centered. Every page uses the same grid, so the codes line up with pre-cut label sheets. Print at 100% ("actual size") to keep the exact dimensions.

PDF output and `toPdf` are Node.js features. Browser entry points and bundles
support canvas, image data URLs and SVG; they do not include the PDF writer.

### Browser
`node-qrcode` can be used in browser through module bundlers like [Browserify](https://github.com/substack/node-browserify) and [Webpack](https://github.com/webpack/webpack) or by including the precompiled bundle present in `build/` folder.

#### Module bundlers
```html
<!-- index.html -->
<html>
  <body>
    <canvas id="canvas"></canvas>
    <script src="bundle.js"></script>
  </body>
</html>
```

```javascript
// index.js -> bundle.js
var QRCode = require('qrcode')
var canvas = document.getElementById('canvas')

QRCode.toCanvas(canvas, 'sample text', function (error) {
  if (error) console.error(error)
  console.log('success!');
})
```

#### Precompiled bundle
```html
<canvas id="canvas"></canvas>

<script src="/build/qrcode.js"></script>
<script>
  QRCode.toCanvas(document.getElementById('canvas'), 'sample text', function (error) {
    if (error) console.error(error)
    console.log('success!');
  })
</script>
```

If you install through `npm`, precompiled files will be available in `node_modules/qrcode/build/` folder.

The precompiled bundle have support for [Internet Explorer 10+, Safari 5.1+, and all evergreen browsers](https://browserl.ist/?q=defaults%2C+IE+%3E%3D+10%2C+Safari+%3E%3D+5.1).

### NodeJS
Require the module `qrcode`

```javascript
var QRCode = require('qrcode')

QRCode.toDataURL('I am a pony!', function (err, url) {
  console.log(url)
})
```

render a qrcode for the terminal
```js
var QRCode = require('qrcode')

QRCode.toString('I am a pony!',{type:'terminal'}, function (err, url) {
  console.log(url)
})
```

### ES6/ES7
Promises and Async/Await can be used in place of callback function.

```javascript
import QRCode from 'qrcode'

// With promises
QRCode.toDataURL('I am a pony!')
  .then(url => {
    console.log(url)
  })
  .catch(err => {
    console.error(err)
  })

// With async/await
const generateQR = async text => {
  try {
    console.log(await QRCode.toDataURL(text))
  } catch (err) {
    console.error(err)
  }
}
```

### TypeScript
Type definitions are included in the package: [@types/qrcode](https://www.npmjs.com/package/@types/qrcode) is no longer needed and can be removed.<br>
Type names are the same as in `@types/qrcode`.

```typescript
import QRCode from 'qrcode'
import type { QRCodeToDataURLOptions } from 'qrcode'

const options: QRCodeToDataURLOptions = { errorCorrectionLevel: 'H', margin: 2 }
const url: string = await QRCode.toDataURL('I am a pony!', options)
```

With the precompiled bundles (`<script>` tags), the types of the `QRCode` global can be referenced with:

```typescript
/// <reference types="qrcode/build/qrcode" />
/// <reference types="qrcode/build/qrcode.tosjis" />
```

## Error correction level
Error correction capability allows to successfully scan a QR Code even if the symbol is dirty or damaged.
Four levels are available to choose according to the operating environment.

Higher levels offer a better error resistance but reduce the symbol's capacity.<br>
If the chances that the QR Code symbol may be corrupted are low (for example if it is showed through a monitor)
is possible to safely use a low error level such as `Low` or `Medium`.

Possible levels are shown below:

| Level            | Error resistance |
|------------------|:----------------:|
| **L** (Low)      | **~7%**          |
| **M** (Medium)   | **~15%**         |
| **Q** (Quartile) | **~25%**         |
| **H** (High)     | **~30%**         |

The percentage indicates the maximum amount of damaged surface after which the symbol becomes unreadable.

Error level can be set through `options.errorCorrectionLevel` property.<br>
If not specified, the default value is `M`.

```javascript
QRCode.toDataURL('some text', { errorCorrectionLevel: 'H' }, function (err, url) {
  console.log(url)
})
```

## QR Code capacity
Capacity depends on symbol version and error correction level. Also encoding modes may influence the amount of storable data.

The QR Code versions range from version **1** to version **40**.<br>
Each version has a different number of modules (black and white dots), which define the symbol's size.
For version 1 they are `21x21`, for version 2 `25x25` e so on.
Higher is the version, more are the storable data, and of course bigger will be the QR Code symbol.

The table below shows the maximum number of storable characters in each encoding mode and for each error correction level.

| Mode         | L    | M    | Q    | H    |
|--------------|------|------|------|------|
| Numeric      | 7089 | 5596 | 3993 | 3057 |
| Alphanumeric | 4296 | 3391 | 2420 | 1852 |
| Byte         | 2953 | 2331 | 1663 | 1273 |
| Kanji        | 1817 | 1435 | 1024 | 784  |

**Note:** Maximum characters number can be different when using [Mixed modes](#mixed-modes).

QR Code version can be set through `options.version` property.<br>
If no version is specified, the more suitable value will be used. Unless a specific version is required, this option is not needed.

```javascript
QRCode.toDataURL('some text', { version: 2 }, function (err, url) {
  console.log(url)
})
```

## Encoding modes
Modes can be used to encode a string in a more efficient way.<br>
A mode may be more suitable than others depending on the string content.
A list of supported modes are shown in the table below:

| Mode         | Characters                                                | Compression                               |
|--------------|-----------------------------------------------------------|-------------------------------------------|
| Numeric      | 0, 1, 2, 3, 4, 5, 6, 7, 8, 9                              | 3 characters are represented by 10 bits   |
| Alphanumeric | 0–9, A–Z (upper-case only), space, $, %, *, +, -, ., /, : | 2 characters are represented by 11 bits   |
| Kanji        | Characters from the Shift JIS system based on JIS X 0208  | 2 kanji are represented by 13 bits        |
| Byte         | Characters from the ISO/IEC 8859-1 character set          | Each characters are represented by 8 bits |

Choose the right mode may be tricky if the input text is unknown.<br>
In these cases **Byte** mode is the best choice since all characters can be encoded with it. (See [Multibyte characters](#multibyte-characters))<br>
However, if the QR Code reader supports mixed modes, using [Auto mode](#auto-mode) may produce better results.

### Mixed modes
Mixed modes are also possible. A QR code can be generated from a series of segments having different encoding modes to optimize the data compression.<br>
However, switching from a mode to another has a cost which may lead to a worst result if it's not taken into account.
See [Manual mode](#manual-mode) for an example of how to specify segments with different encoding modes.

### Auto mode
By **default**, automatic mode selection is used.<br>
The input string is automatically splitted in various segments optimized to produce the shortest possible bitstream using mixed modes.<br>
This is the preferred way to generate the QR Code.

For example, the string **ABCDE12345678?A1A** will be splitted in 3 segments with the following modes:

| Segment  | Mode         |
|----------|--------------|
| ABCDE    | Alphanumeric |
| 12345678 | Numeric      |
| ?A1A     | Byte         |

Any other combinations of segments and modes will result in a longer bitstream.<br>
If you need to keep the QR Code size small, this mode will produce the best results.

### Manual mode
If auto mode doesn't work for you or you have specific needs, is also possible to manually specify each segment with the relative mode.
In this way no segment optimizations will be applied under the hood.<br>
Segments list can be passed as an array of object:

```javascript
  var QRCode = require('qrcode')

  var segs = [
    { data: 'ABCDEFG', mode: 'alphanumeric' },
    { data: '0123456', mode: 'numeric' }
  ]

  QRCode.toDataURL(segs, function (err, url) {
    console.log(url)
  })
```

### Kanji mode
With kanji mode is possible to encode characters from the Shift JIS system in an optimized way.<br>
Unfortunately, there isn't a way to calculate a Shifted JIS values from, for example, a character encoded in UTF-8, for this reason a conversion table from the input characters to the SJIS values is needed.<br>
This table is not included by default in the bundle to keep the size as small as possible.

If your application requires kanji support, you will need to pass a function that will take care of converting the input characters to appropriate values.

An helper method is provided by the lib through an optional file that you can include as shown in the example below.

**Note:** Support for Kanji mode is only needed if you want to benefit of the data compression, otherwise is still possible to encode kanji using Byte mode (See [Multibyte characters](#multibyte-characters)).

```javascript
  var QRCode = require('qrcode')
  var toSJIS = require('qrcode/helper/to-sjis')

  QRCode.toDataURL(kanjiString, { toSJISFunc: toSJIS }, function (err, url) {
    console.log(url)
  })
```

With precompiled bundle:

```html
<canvas id="canvas"></canvas>

<script src="/build/qrcode.js"></script>
<script src="/build/qrcode.tosjis.js"></script>
<script>
  QRCode.toCanvas(document.getElementById('canvas'),
    'sample text', { toSJISFunc: QRCode.toSJIS }, function (error) {
    if (error) console.error(error)
    console.log('success!')
  })
</script>
```

## Binary data
QR Codes can hold arbitrary byte-based binary data. If you attempt to create a binary QR Code by first converting the data to a JavaScript string, it will fail to encode propery because string encoding adds additional bytes. Instead, you must pass a [`Uint8ClampedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray) or compatible array, or a Node [Buffer](https://nodejs.org/api/buffer.html), as follows:

```javascript
// Regular array example
// WARNING: Element values will be clamped to 0-255 even if your data contains higher values.
const QRCode = require('qrcode')
QRCode.toFile(
  'foo.png',
  [{ data: [253,254,255], mode: 'byte' }],
  ...options...,
  ...callback...
)
```

```javascript
// Uint8ClampedArray example
const QRCode = require('qrcode')

QRCode.toFile(
  'foo.png',
  [{ data: new Uint8ClampedArray([253,254,255]), mode: 'byte' }],
  ...options...,
  ...callback...
)
```

```javascript
// Node Buffer example
// WARNING: Element values will be clamped to 0-255 even if your data contains higher values.
const QRCode = require('qrcode')

QRCode.toFile(
  'foo.png',
  [{ data: Buffer.from([253,254,255]), mode: 'byte' }],
  ...options...,
  ...callback...
)
```

TypeScript users: binary segments are supported by the bundled type definitions (`data: Buffer | Uint8Array | Uint8ClampedArray`), no `// @ts-ignore` is needed.

## Multibyte characters
Support for multibyte characters isn't present in the initial QR Code standard, but is possible to encode UTF-8 characters in Byte mode.

QR Codes provide a way to specify a different type of character set through ECI (Extended Channel Interpretation), but it's not fully implemented in this lib yet.

Most QR Code readers, however, are able to recognize multibyte characters even without ECI.

Note that a single Kanji/Kana or Emoji can take up to 4 bytes.

## API
Browser:
- [create()](#createtext-options)
- [toCanvas()](#tocanvascanvaselement-text-options-cberror)
- [toDataURL()](#todataurltext-options-cberror-url)
- [toString()](#tostringtext-options-cberror-string)

Server:
- [create()](#createtext-options)
- [toCanvas()](#tocanvascanvas-text-options-cberror)
- [toDataURL()](#todataurltext-options-cberror-url-1)
- [toString()](#tostringtext-options-cberror-string-1)
- [toBuffer()](#tobuffertext-options-cberror-buffer)
- [toPdf()](#topdftexts-options-cberror-buffer)
- [toFile()](#tofilepath-text-options-cberror)
- [toFileStream()](#tofilestreamstream-text-options)

### Browser API
#### `create(text, [options])`
Creates QR Code symbol and returns a qrcode object.

##### `text`
Type: `String|Array`

Text to encode or a list of objects describing segments.

##### `options`
See [QR Code options](#qr-code-options).

##### `returns`
Type: `Object`

```javascript
// QRCode object
{
  modules,              // Bitmatrix class with modules data
  version,              // Calculated QR Code version
  errorCorrectionLevel, // Error Correction Level
  maskPattern,          // Calculated Mask pattern
  segments              // Generated segments
}
```

<br>

#### `toCanvas(canvasElement, text, [options], [cb(error)])`
#### `toCanvas(text, [options], [cb(error, canvas)])`
Draws qr code symbol to canvas.<br>
If `canvasElement` is omitted a new canvas is returned.

##### `canvasElement`
Type: `DOMElement`

Canvas where to draw QR Code.

##### `text`
Type: `String|Array`

Text to encode or a list of objects describing segments.

##### `options`
See [Options](#options).

##### `cb`
Type: `Function`

Callback function called on finish.

##### Example
```javascript
QRCode.toCanvas('text', { errorCorrectionLevel: 'H' }, function (err, canvas) {
  if (err) throw err

  var container = document.getElementById('container')
  container.appendChild(canvas)
})
```

<br>

#### `toDataURL(text, [options], [cb(error, url)])`
#### `toDataURL(canvasElement, text, [options], [cb(error, url)])`
Returns a Data URI containing a representation of the QR Code image.<br>
If provided, `canvasElement` will be used as canvas to generate the data URI.

##### `canvasElement`
Type: `DOMElement`

Canvas where to draw QR Code.

##### `text`
Type: `String|Array`

Text to encode or a list of objects describing segments.

##### `options`
- ###### `type`
  Type: `String`<br>
  Default: `image/png`

  Data URI format.<br>
  Possible values are: `image/png`, `image/jpeg`, `image/webp`.<br>

- ###### `rendererOpts.quality`
  Type: `Number`<br>
  Default: `0.92`

  A Number between `0` and `1` indicating image quality if the requested type is `image/jpeg` or `image/webp`.

See [Options](#options) for other settings.

##### `cb`
Type: `Function`

Callback function called on finish.

##### Example
```javascript
var opts = {
  errorCorrectionLevel: 'H',
  type: 'image/jpeg',
  quality: 0.3,
  margin: 1,
  color: {
    dark:"#010599FF",
    light:"#FFBF60FF"
  }
}

QRCode.toDataURL('text', opts, function (err, url) {
  if (err) throw err

  var img = document.getElementById('image')
  img.src = url
})
```
<br>

#### `toString(text, [options], [cb(error, string)])`

Returns a string representation of the QR Code.<br>


##### `text`
Type: `String|Array`

Text to encode or a list of objects describing segments.

##### `options`
- ###### `type`
  Type: `String`<br>
  Default: `utf8`

  Output format.<br>
  Possible values are: `terminal`,`utf8`, and `svg`.

See [Options](#options) for other settings.

##### `cb`
Type: `Function`

Callback function called on finish.

##### Example
```javascript
QRCode.toString('http://www.google.com', function (err, string) {
  if (err) throw err
  console.log(string)
})
```

<br>


### Server API
#### `create(text, [options])`
See [create](#createtext-options).

<br>

#### `toCanvas(canvas, text, [options], [cb(error)])`
Draws qr code symbol to a canvas object implementing the canvas API, like
[node-canvas](https://github.com/Automattic/node-canvas) or [@napi-rs/canvas](https://github.com/Brooooooklyn/canvas).

##### `text`
Type: `String|Array`

Text to encode or a list of objects describing segments.

##### `options`
See [Options](#options).

##### `cb`
Type: `Function`

Callback function called on finish.

<br>

#### `toDataURL(text, [options], [cb(error, url)])`
Returns a Data URI containing a representation of the QR Code image.<br>
Node.js supports `image/png`, `pdf` and `application/pdf`. PDF returns a `data:application/pdf;base64,...` URL. Types `svg`, `utf8` and `txt` return an error.

##### `text`
Type: `String|Array`

Text to encode or a list of objects describing segments.

##### `options`
See [Options](#options) for other settings.

##### `cb`
Type: `Function`

Callback function called on finish.

<br>

#### `toBuffer(text, [options], [cb(error, buffer)])`
Returns a Buffer containing a PNG image or vector PDF of the QR Code.<br>
Accepts `png`, `image/png`, `pdf` and `application/pdf`. Types `svg`, `utf8` and `txt` return an error.

##### `text`
Type: `String|Array`

Text to encode or a list of objects describing segments.

##### `options`
- ###### `rendererOpts.deflateLevel`
  Type: `Number`<br>
  Default: `9`

  Compression level for deflate.

- ###### `rendererOpts.deflateStrategy`
  Type: `Number`<br>
  Default: `3`

  Compression strategy for deflate.

See [Options](#options) for other settings.

##### `cb`
Type: `Function`

Callback function called on finish.

##### Example
```javascript
const buffer = await QRCode.toBuffer('Some text', { scale: 8 })
```

<br>

#### `toString(text, [options], [cb(error, string)])`
Returns a string representation of the QR Code.<br>
If choosen output format is `svg` it will returns a string containing xml code.

##### `text`
Type: `String|Array`

Text to encode or a list of objects describing segments.

##### `options`
- ###### `type`
  Type: `String`<br>
  Default: `utf8`

  Output format.<br>
  Possible values are: `utf8`, `svg`, `terminal`.

See [Options](#options) for other settings.

##### `cb`
Type: `Function`

Callback function called on finish.

##### Example
```javascript
QRCode.toString('http://www.google.com', function (err, string) {
  if (err) throw err
  console.log(string)
})
```

<br>

#### `toFile(path, text, [options], [cb(error)])`
Saves QR Code to image file.<br>
If `options.type` is not specified, the format will be guessed from file extension.<br>
Recognized extensions are `png`, `svg`, `txt`.

##### `path`
Type: `String`

Path where to save the file.

##### `text`
Type: `String|Array`

Text to encode or a list of objects describing segments.

##### `options`
- ###### `type`
  Type: `String`<br>
  Default: `png`

  Output format.<br>
  Possible values are: `png`, `svg`, `utf8`, `pdf` and `application/pdf`.

- ###### `rendererOpts.deflateLevel` **(png only)**
  Type: `Number`<br>
  Default: `9`

  Compression level for deflate.

- ###### `rendererOpts.deflateStrategy` **(png only)**
  Type: `Number`<br>
  Default: `3`

  Compression strategy for deflate.

- ###### `rendererOpts.pageSize` **(pdf only)**
  Type: `String`<br>
  Default: `A4`

  Page size: `A4`, `A3`, `A5`, `Letter` or `Legal` (case-insensitive, portrait).

- ###### `rendererOpts.size` **(pdf only)**
  Type: `Number`<br>
  Default: `50`

  Size of the QR code in millimetres, quiet zone (`margin`) included.
  `width` and `scale` do not apply to PDF.

- ###### `rendererOpts.top`, `rendererOpts.left` **(pdf only)**
  Type: `Number`<br>
  Default: centered on the page

  Distance in millimetres from the top and left edges of the page to the QR code (quiet zone included).
  An error is returned if the code does not fit on the page.

See [Options](#options) for other settings.

##### `cb`
Type: `Function`

Callback function called on finish.

##### Example
```javascript
QRCode.toFile('path/to/filename.png', 'Some text', {
  color: {
    dark: '#00F',  // Blue dots
    light: '#0000' // Transparent background
  }
}, function (err) {
  if (err) throw err
  console.log('done')
})
```

<br>

#### `toPdf(texts, [options], [cb(error, buffer)])`
Places several QR codes on a grid in a PDF document, row by row, adding pages as needed.
Returns a Promise resolving to a `Buffer` if no callback is given.

##### `texts`
Type: `Array`

One entry per QR code: a string, or a list of segments as accepted by [create](#createtext-options).

##### `options`
Options for all codes, see [Options](#options). The grid is configured with `rendererOpts` (sizes in millimetres):

- `pageSize`: `A4` (default), `A3`, `A5`, `Letter` or `Legal`
- `size`: size of each code, quiet zone included. Default `50`
- `gap`: space between codes. Default `5`
- `columns`, `rows`: codes per row and rows per page. Default: as many as fit, keeping 10 mm from the page edges
- `top`, `left`: position of the grid's top-left corner. Default: grid centered on the page

An error is returned if the grid does not fit on the page, or if a text cannot be encoded (`Item N: ...`).

##### `cb`
Type: `Function`

Callback function called on finish.

##### Example
```javascript
const fs = require('fs')

const urls = ['https://example.com/1', 'https://example.com/2', 'https://example.com/3']
QRCode.toPdf(urls, { rendererOpts: { size: 30, gap: 5, columns: 4 } })
  .then(pdf => fs.promises.writeFile('sheet.pdf', pdf))
```

<br>

#### `toFileStream(stream, text, [options])`
Writes QR Code image to stream. Only works with `png` format for now.<br>
Errors are emitted on the stream (`'error'` event): there is no callback and no promise.

##### `stream`
Type: `stream.Writable`

Node stream.

##### `text`
Type: `String|Array`

Text to encode or a list of objects describing segments.

##### `options`
See [Options](#options).

<br>

### Options

#### QR Code options
##### `version`
  Type: `Number`<br>

  QR Code version. If not specified the more suitable value will be calculated.

##### `errorCorrectionLevel`
  Type: `String`<br>
  Default: `M`

  Error correction level.<br>
  Possible values are `low, medium, quartile, high` or `L, M, Q, H`.

##### `maskPattern`
  Type: `Number`<br>

  Mask pattern used to mask the symbol.<br>
  Possible values are `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`.<br>
  If not specified the more suitable value will be calculated.

##### `toSJISFunc`
  Type: `Function`<br>

  Helper function used internally to convert a kanji to its Shift JIS value.<br>
  Provide this function if you need support for Kanji mode.

#### Renderers options
##### `margin`
  Type: `Number`<br>
  Default: `4`

  Define how much wide the quiet zone should be.

##### `scale`
  Type: `Number`<br>
  Default: `4`

  Scale factor. A value of `1` means 1px per modules (black dots).

##### `small`
  Type: `Boolean`<br>
  Default: `false`

  Relevant only for terminal renderer. Outputs smaller QR code.

##### `width`
  Type: `Number`<br>

  Forces a specific width for the output image.<br>
  If width is too small to contain the qr symbol, this option will be ignored.<br>
  Takes precedence over `scale`.

##### `color.dark`
Type: `String`<br>
Default: `#000000ff`

Color of dark module. Value must be in hex format (RGBA).<br>
Note: dark color should always be darker than `color.light`.

##### `color.light`
Type: `String`<br>
Default: `#ffffffff`

Color of light module. Value must be in hex format (RGBA).<br>

<br>

## GS1 QR Codes
There was a real good discussion here about them. but in short any qrcode generator will make gs1 compatible qrcodes, but what defines a gs1 qrcode is a header with metadata that describes your gs1 information.

https://github.com/soldair/node-qrcode/issues/45


## Credits
This library is based on the MIT-licensed "QRCode for JavaScript" project.

## License
[MIT](https://github.com/soldair/node-qrcode/blob/master/license)

The word "QR Code" is registered trademark of:<br>
DENSO WAVE INCORPORATED
