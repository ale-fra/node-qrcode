/**
 * Input stream: process.stdin, or any readable stream of strings
 */
export interface InputStream {
  isTTY?: boolean
  setEncoding (encoding: BufferEncoding): unknown
  read (): string | null
  on (event: 'readable' | 'end', listener: () => void): unknown
}

/**
 * Reads the text to encode.
 *
 * In a terminal (TTY) the text is taken from the command line arguments,
 * otherwise it is read from the input stream (eg. `echo text | qrcode`).
 * If the stream has no data, the command line arguments are used.
 *
 * @param stdin   Input stream
 * @param argText Text from the command line arguments
 * @param cb      Called with the text to encode
 */
export function readInput (stdin: InputStream, argText: string, cb: (text: string) => void): void {
  if (stdin.isTTY) {
    cb(argText)
    return
  }

  let text = ''
  stdin.setEncoding('utf8')
  stdin.on('readable', function () {
    const chunk = stdin.read()
    if (chunk !== null) {
      text += chunk
    }
  })

  stdin.on('end', function () {
    // this process can be run as a command outside of a tty so if there was no
    // data on stdin read from argv
    cb(text.length ? text : argText)
  })
}

/** One code per nonblank stdin line or positional argument. Preserve spaces. */
export function getBatchInputs (stdinText: string, args: Array<string | number>): string[] {
  return stdinText.length
    ? stdinText.split(/\r?\n/).filter((line) => line.trim().length)
    : args.map(String)
}
