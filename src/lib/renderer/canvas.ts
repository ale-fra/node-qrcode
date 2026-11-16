import * as Utils from './utils'
import type { QRCode } from '../types'
import type { RendererOptionsInput } from './utils'

/**
 * Minimal 2D context interface used by the renderer
 * (implemented by browsers' CanvasRenderingContext2D and node canvas libraries)
 */
export interface CanvasContext2DLike {
  clearRect (x: number, y: number, w: number, h: number): void
  createImageData (sw: number, sh: number): { data: { [index: number]: number } }
  putImageData (imagedata: any, dx: number, dy: number): void
}

/**
 * Minimal canvas interface used by the renderer
 * (implemented by HTMLCanvasElement and node canvas libraries)
 */
export interface CanvasLike {
  width: number
  height: number
  style?: { width: string, height: string } | Record<string, any>
  getContext (contextId: '2d'): CanvasContext2DLike | null
  toDataURL (type?: string, quality?: any): string
}

function clearCanvas (ctx: CanvasContext2DLike, canvas: CanvasLike, size: number): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!canvas.style) canvas.style = {}
  canvas.height = size
  canvas.width = size
  canvas.style.height = size + 'px'
  canvas.style.width = size + 'px'
}

function getCanvasElement (): CanvasLike {
  try {
    return document.createElement('canvas')
  } catch (e) {
    throw new Error('You need to specify a canvas element')
  }
}

function isCanvas (canvas: unknown): canvas is CanvasLike {
  return !!canvas && !!(canvas as CanvasLike).getContext
}

export function render (qrData: QRCode, options?: RendererOptionsInput): CanvasLike
export function render (qrData: QRCode, canvas: CanvasLike | undefined, options?: RendererOptionsInput): CanvasLike
export function render (qrData: QRCode, canvas?: CanvasLike | RendererOptionsInput, options?: RendererOptionsInput): CanvasLike {
  let opts = options
  let canvasEl = canvas as CanvasLike

  if (typeof opts === 'undefined' && !isCanvas(canvas)) {
    opts = canvas
    canvas = undefined
  }

  if (!canvas) {
    canvasEl = getCanvasElement()
  }

  const rendererOpts = Utils.getOptions(opts)
  const size = Utils.getImageWidth(qrData.modules.size, rendererOpts)

  const ctx = canvasEl.getContext('2d') as CanvasContext2DLike
  const image = ctx.createImageData(size, size)
  Utils.qrToImageData(image.data, qrData, rendererOpts)

  clearCanvas(ctx, canvasEl, size)
  ctx.putImageData(image, 0, 0)

  return canvasEl
}

export function renderToDataURL (qrData: QRCode, options?: RendererOptionsInput): string
export function renderToDataURL (qrData: QRCode, canvas: CanvasLike | undefined, options?: RendererOptionsInput): string
export function renderToDataURL (qrData: QRCode, canvas?: CanvasLike | RendererOptionsInput, options?: RendererOptionsInput): string {
  let opts = options

  if (typeof opts === 'undefined' && !isCanvas(canvas)) {
    opts = canvas
    canvas = undefined
  }

  if (!opts) opts = {}

  const canvasEl = render(qrData, canvas as CanvasLike | undefined, opts)

  const type = opts.type || 'image/png'
  const rendererOpts = opts.rendererOpts || {}

  return canvasEl.toDataURL(type, rendererOpts.quality)
}
