// Run with: pnpm run browser (Node.js >= 22.18, builds the library first)
// then open http://localhost:3031
import express from 'express'
import fs from 'fs'
import path from 'path'
import canvasutil from 'canvasutil'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import type { Canvas } from '@napi-rs/canvas'
import QRCode from '../lib/index.js'

type EffectArgs = Record<string, string | undefined>
type EffectCallback = (error: Error | null, canvas?: Canvas) => void
type EffectHandler = (args: EffectArgs, cb: EffectCallback) => void

const dirname = import.meta.dirname
const app = express()

app.get('/qrcode.js', (_req, res) => {
  res.set('content-type', 'text/javascript')
  fs.createReadStream(path.join(dirname, '..', 'build', 'qrcode.js')).pipe(res)
})

app.get('/qrcode.tosjis.js', (_req, res) => {
  res.set('content-type', 'text/javascript')
  fs.createReadStream(path.join(dirname, '..', 'build', 'qrcode.tosjis.js')).pipe(res)
})

app.get('/', function (_req, res) {
  fs.readFile(path.join(dirname, 'clientside.html'), function (err, data) {
    res.send(data ? data.toString() : err)
  })
})

const effectHandlers: Record<string, EffectHandler> = {}

app.get('/generate', function (req, res) {
  const q = (req.query || {}) as EffectArgs

  let effect = q.effect || 'plain'
  if (!effectHandlers[effect]) {
    effect = 'plain'
  }

  effectHandlers[effect](q, function (error, canvas) {
    if (!error) {
      (canvas as Canvas).encode('png').then(function (buf) {
        res.header('Content-Type', 'image/png')
        res.send(buf)
      }, function (err: Error) {
        res.status(500).send(err.message)
      })
    } else {
      const msg = error.message + '\n' + error.stack
      res.header('Content-Type', 'text/plain')
      res.send(msg)
      console.error(msg)
    }
  })
})

effectHandlers.bacon = function (args, cb) {
  args.src = path.join(dirname, 'images', 'bacon-love.png')
  effectHandlers.image(args, cb)
}

effectHandlers.rounded = function (args, cb) {
  const canvas = createCanvas(200, 200)
  QRCode.toCanvas(canvas, args.text || '', function (err) {
    if (err) {
      cb(err, canvas)
      return
    }

    const tpx = new canvasutil.PixelCore()
    const luma709Only = canvasutil.conversionLib.luma709Only
    const up: number[] = []
    const down: number[] = []
    const left: number[] = []
    const right: number[] = []
    let upPx: number | undefined
    let downPx: number | undefined
    let leftPx: number | undefined
    let rightPx: number | undefined
    let r
    let t
    let l
    let d
    let corner = 0

    tpx.threshold = 100

    tpx.iterate(canvas, function (px, i, len, pixels, w, _h, pixelCore) {
      corner = 0

      // is dark
      if (luma709Only(px.r, px.g, px.b) < pixelCore.threshold) {
        if (i - w > 0) {
          upPx = (i - w) * 4
          up[0] = pixels[upPx + 0]
          up[1] = pixels[upPx + 1]
          up[2] = pixels[upPx + 2]
        }

        if (i + w <= len) {
          downPx = (i + w) * 4
          down[0] = pixels[downPx + 0]
          down[1] = pixels[downPx + 1]
          down[2] = pixels[downPx + 2]
        }

        // have left pixel but no wrapping
        if (i % w !== 0) {
          leftPx = (i - 1) * 4
          left[0] = pixels[leftPx + 0]
          left[1] = pixels[leftPx + 1]
          left[2] = pixels[leftPx + 2]
        }

        if (i % w !== w - 1) {
          rightPx = (i + 1) * 4
          right[0] = pixels[rightPx + 0]
          right[1] = pixels[rightPx + 1]
          right[2] = pixels[rightPx + 2]
        }

        r = rightPx ? luma709Only(right[0], right[1], right[2]) : 0
        t = upPx ? luma709Only(up[0], up[1], up[2]) : 0
        l = leftPx ? luma709Only(left[0], left[1], left[2]) : 0
        d = downPx ? luma709Only(down[0], down[1], down[2]) : 0

        if (l > pixelCore.threshold) { // if left is light and i am dark
          if (t > pixelCore.threshold) { // if top is light and i am dark
            corner = 1
            if (rightPx !== undefined) pixels[rightPx + 4] = 100
          } else if (d > pixelCore.threshold) { // if bottom is light and i am dark
            if (rightPx !== undefined) pixels[rightPx + 4] = 100
            corner = 1
          }
        } else if (r > pixelCore.threshold) {
          if (t > pixelCore.threshold) { // if top is light and i am dark
            corner = 1
          } else if (d > pixelCore.threshold) { // if bottom is light and i am dark
            corner = 1
          }
        }

        if (corner) {
          px.a = 50
        }
      }
    })
    cb(null, canvas)
  })
}

effectHandlers.image = function (args, cb) {
  loadImage(args.src || '').then((img) => {
    const convert = canvasutil.conversionLib
    const canvas = createCanvas(200, 200)
    QRCode.toCanvas(canvas, args.text || '', function (err) {
      if (err) {
        cb(err)
        return
      }

      const codeCtx = canvas.getContext('2d')
      const frame = codeCtx.getImageData(0, 0, canvas.width, canvas.width)
      const tpx = new canvasutil.PixelCore()
      const baconCanvas = createCanvas(canvas.width, canvas.width)
      const ctx = baconCanvas.getContext('2d')
      const topThreshold = Number(args.darkThreshold) || 25
      const bottomThreshold = Number(args.lightThreshold) || 75

      tpx.threshold = 50

      // scale image
      let w = canvas.width
      let h = canvas.height

      if (img.width > img.height) {
        w = w * (canvas.height / h)
        h = canvas.height
      } else {
        h = h * (canvas.height / w)
        w = canvas.width
      }
      ctx.drawImage(img, 0, 0, w, h)

      try {
        tpx.iterate(baconCanvas, function (px, i, _l, _pixels, _w, _h, pixelCore) {
          const luma = (0.2125 * px.r + 0.7154 * px.g + 0.0721 * px.b)
          const codeLuma = convert.luma709Only(frame.data[i * 4], frame.data[i * 4 + 1], frame.data[i * 4 + 2])
          let yuv
          let rgb

          if (codeLuma > pixelCore.threshold) {
            if (luma < bottomThreshold) {
              yuv = convert.rgbToYuv(px.r, px.g, px.b)

              rgb = convert.yuvToRgb(bottomThreshold, yuv[1], yuv[2])

              px.r = rgb[0]
              px.g = rgb[1]
              px.b = rgb[2]
              px.a = 255
            }
          } else {
            if (luma > topThreshold) {
              yuv = convert.rgbToYuv(px.r, px.g, px.b)

              rgb = convert.yuvToRgb(topThreshold, yuv[1], yuv[2])

              px.r = rgb[0]
              px.g = rgb[1]
              px.b = rgb[2]
            }
          }
        })
      } catch (e) {
        cb(e as Error)
        return
      }

      cb(null, baconCanvas)
    })
  }, (error: Error) => {
    cb(error)
  })
}

effectHandlers.plain = function (args, cb) {
  const canvas = createCanvas(200, 200)
  const text = args.text || ''
  QRCode.toCanvas(canvas, text || '', function (err) {
    cb(err || null, canvas)
  })
}

app.listen(3031)
console.log('listening on 3031')
