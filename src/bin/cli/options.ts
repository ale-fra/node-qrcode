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
