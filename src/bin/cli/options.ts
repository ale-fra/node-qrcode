import * as path from 'path'
import type { QRCodePdfRendererOptions } from '../../lib'
import type { CliArgs } from './parser'

/**
 * Library options built from the command line arguments
 * (values are validated by the library)
 */
export interface CliOptions {
  version?: number
  errorCorrectionLevel?: string
  type?: string
  small: boolean
  inverse: boolean
  maskPattern?: number
  margin?: number
  width?: number
  scale?: number
  rendererOpts?: QRCodePdfRendererOptions
  color: {
    light?: string
    dark?: string
  }
}

/**
 * Maps the command line arguments to library options
 */
export function getOptions (args: CliArgs): CliOptions {
  return {
    version: args.qversion,
    errorCorrectionLevel: args.error,
    type: args.type,
    small: !!args.small,
    inverse: !!args.inverse,
    maskPattern: args.mask,
    margin: args.qzone,
    width: args.width,
    scale: args.scale,
    color: {
      light: args.lightcolor,
      dark: args.darkcolor
    }
  }
}

export function getOutputType (args: CliArgs): string {
  return (args.type || (args.output ? path.extname(args.output).slice(1) : '')).toLowerCase()
}

/** Warn when PDF or grid options are ignored, as in the JavaScript CLI. */
export function getPdfOptions (args: CliArgs, warn: (message: string) => void): QRCodePdfRendererOptions | undefined {
  const pdfOptions = ['page-size', 'size', 'top', 'left', 'gap', 'columns', 'rows'] as const
  const gridOptions = ['gap', 'columns', 'rows'] as const
  const usedPdf = pdfOptions.filter((key) => args[key] !== undefined)
  const usedGrid = gridOptions.filter((key) => args[key] !== undefined)
  const isPdf = getOutputType(args) === 'pdf'
  if (usedPdf.length && !isPdf) {
    warn('Warning: --' + usedPdf.join(', --') + ' only used for PDF output, ignoring')
  } else if (usedGrid.length && !args.batch) {
    warn('Warning: --' + usedGrid.join(', --') + ' only used with --batch, ignoring')
  }
  if (!isPdf) return undefined
  return {
    pageSize: args['page-size'],
    size: args.size,
    top: args.top,
    left: args.left,
    gap: args.gap,
    columns: args.columns,
    rows: args.rows
  }
}
