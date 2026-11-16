import * as Mode from './mode'
import NumericData = require('./numeric-data')
import AlphanumericData = require('./alphanumeric-data')
import ByteData = require('./byte-data')
import KanjiData = require('./kanji-data')
import * as Regex from './regex'
import * as Utils from './utils'
import dijkstra = require('dijkstrajs')
import type { GeneratedQRCodeSegment } from '../types'

/**
 * Segment data and (optional) mode, as accepted by fromArray().
 * Mode can be specified by name (eg. 'numeric') or as Mode object.
 */
export interface SegmentInput {
  data: string | number | ArrayLike<number> | ArrayBufferLike
  mode?: unknown
}

/**
 * Intermediate segment representation used to compute the optimal segmentation
 */
interface SegmentInfo {
  data: string
  mode: Mode.Mode
  length: number
}

interface GraphTableEntry {
  node: SegmentInfo
  lastCount: number
}

/**
 * Returns UTF8 byte length
 *
 * @param  str Input string
 * @return     Number of byte
 */
function getStringByteLength (str: string): number {
  return unescape(encodeURIComponent(str)).length
}

/**
 * Get a list of segments of the specified mode
 * from a string
 *
 * @param  regex Regex matching the segments
 * @param  mode  Segment mode
 * @param  str   String to process
 * @return       Array of object with segments data
 */
function getSegments (regex: RegExp, mode: Mode.Mode, str: string): Array<SegmentInfo & { index: number }> {
  const segments = []
  let result

  while ((result = regex.exec(str)) !== null) {
    segments.push({
      data: result[0],
      index: result.index,
      mode,
      length: result[0].length
    })
  }

  return segments
}

/**
 * Extracts a series of segments with the appropriate
 * modes from a string
 *
 * @param  dataStr Input string
 * @return         Array of object with segments data
 */
function getSegmentsFromString (dataStr: string): SegmentInfo[] {
  const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr)
  const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr)
  let byteSegs
  let kanjiSegs: Array<SegmentInfo & { index: number }>

  if (Utils.isKanjiModeEnabled()) {
    byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr)
    kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr)
  } else {
    byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr)
    kanjiSegs = []
  }

  const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs)

  return segs
    .sort(function (s1, s2) {
      return s1.index - s2.index
    })
    .map(function (obj) {
      return {
        data: obj.data,
        mode: obj.mode,
        length: obj.length
      }
    })
}

/**
 * Returns how many bits are needed to encode a string of
 * specified length with the specified mode
 *
 * @param  length String length
 * @param  mode   Segment mode
 * @return        Bit length
 */
function getSegmentBitsLength (length: number, mode: Mode.Mode): number {
  switch (mode) {
    case Mode.NUMERIC:
      return NumericData.getBitsLength(length)
    case Mode.ALPHANUMERIC:
      return AlphanumericData.getBitsLength(length)
    case Mode.KANJI:
      return KanjiData.getBitsLength(length)
    // Mode.BYTE (the only mode left: segments are built internally)
    default:
      return ByteData.getBitsLength(length)
  }
}

/**
 * Merges adjacent segments which have the same mode
 *
 * @param  segs Array of object with segments data
 * @return      Array of object with segments data
 */
function mergeSegments (segs: SegmentInfo[]): SegmentInfo[] {
  return segs.reduce(function (acc: SegmentInfo[], curr) {
    const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null
    if (prevSeg && prevSeg.mode === curr.mode) {
      acc[acc.length - 1].data += curr.data
      return acc
    }

    acc.push(curr)
    return acc
  }, [])
}

/**
 * Generates a list of all possible nodes combination which
 * will be used to build a segments graph.
 *
 * Nodes are divided by groups. Each group will contain a list of all the modes
 * in which is possible to encode the given text.
 *
 * For example the text '12345' can be encoded as Numeric, Alphanumeric or Byte.
 * The group for '12345' will contain then 3 objects, one for each
 * possible encoding mode.
 *
 * Each node represents a possible segment.
 *
 * @param  segs Array of object with segments data
 * @return      Array of object with segments data
 */
function buildNodes (segs: SegmentInfo[]): SegmentInfo[][] {
  const nodes = []
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]

    switch (seg.mode) {
      case Mode.NUMERIC:
        nodes.push([seg,
          { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
          { data: seg.data, mode: Mode.BYTE, length: seg.length }
        ])
        break
      case Mode.ALPHANUMERIC:
        nodes.push([seg,
          { data: seg.data, mode: Mode.BYTE, length: seg.length }
        ])
        break
      case Mode.KANJI:
        nodes.push([seg,
          { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
        ])
        break
      case Mode.BYTE:
        nodes.push([
          { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
        ])
    }
  }

  return nodes
}

/**
 * Builds a graph from a list of nodes.
 * All segments in each node group will be connected with all the segments of
 * the next group and so on.
 *
 * At each connection will be assigned a weight depending on the
 * segment's byte length.
 *
 * @param  nodes   Array of object with segments data
 * @param  version QR Code version
 * @return         Graph of all possible segments
 */
function buildGraph (nodes: SegmentInfo[][], version: number): { map: dijkstra.Graph, table: Record<string, GraphTableEntry> } {
  const table: Record<string, GraphTableEntry> = {}
  const graph: dijkstra.Graph = { start: {} }
  let prevNodeIds = ['start']

  for (let i = 0; i < nodes.length; i++) {
    const nodeGroup = nodes[i]
    const currentNodeIds = []

    for (let j = 0; j < nodeGroup.length; j++) {
      const node = nodeGroup[j]
      const key = '' + i + j

      currentNodeIds.push(key)
      table[key] = { node, lastCount: 0 }
      graph[key] = {}

      for (let n = 0; n < prevNodeIds.length; n++) {
        const prevNodeId = prevNodeIds[n]

        if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
          graph[prevNodeId][key] =
            getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) -
            getSegmentBitsLength(table[prevNodeId].lastCount, node.mode)

          table[prevNodeId].lastCount += node.length
        } else {
          if (table[prevNodeId]) table[prevNodeId].lastCount = node.length

          graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) +
            4 + Mode.getCharCountIndicator(node.mode, version) // switch cost
        }
      }
    }

    prevNodeIds = currentNodeIds
  }

  for (let n = 0; n < prevNodeIds.length; n++) {
    graph[prevNodeIds[n]].end = 0
  }

  return { map: graph, table }
}

/**
 * Builds a segment from a specified data and mode.
 * If a mode is not specified, the more suitable will be used.
 *
 * Note: returns undefined if modesHint is a custom (non built-in) mode object.
 *
 * @param  data      Input data
 * @param  modesHint Data mode
 * @return           Segment
 */
function buildSingleSegment (data: SegmentInput['data'], modesHint: unknown): GeneratedQRCodeSegment | undefined {
  let mode
  // non-string data is coerced to string by the regex tests
  const bestMode = Mode.getBestModeForData(data as string)

  mode = Mode.from(modesHint, bestMode)

  // Make sure data can be encoded
  if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
    throw new Error('"' + data + '"' +
      ' cannot be encoded with mode ' + Mode.toString(mode) +
      '.\n Suggested mode is: ' + Mode.toString(bestMode))
  }

  // Use Mode.BYTE if Kanji support is disabled
  if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
    mode = Mode.BYTE
  }

  switch (mode) {
    case Mode.NUMERIC:
      return new NumericData(data as string | number)

    case Mode.ALPHANUMERIC:
      return new AlphanumericData(data as string)

    case Mode.KANJI:
      return new KanjiData(data as string)

    case Mode.BYTE:
      return new ByteData(data as string | ArrayLike<number> | ArrayBufferLike)
  }
}

/**
 * Builds a list of segments from an array.
 * Array can contain Strings or Objects with segment's info.
 *
 * For each item which is a string, will be generated a segment with the given
 * string and the more appropriate encoding mode.
 *
 * For each item which is an object, will be generated a segment with the given
 * data and mode.
 * Objects must contain at least the property "data".
 * If property "mode" is not present, the more suitable mode will be used.
 *
 * @param  array Array of objects with segments data
 * @return       Array of Segments
 */
export function fromArray (array: ReadonlyArray<string | SegmentInput>): GeneratedQRCodeSegment[] {
  return array.reduce(function (acc: GeneratedQRCodeSegment[], seg) {
    if (typeof seg === 'string') {
      acc.push(buildSingleSegment(seg, null) as GeneratedQRCodeSegment)
    } else if (seg.data) {
      acc.push(buildSingleSegment(seg.data, seg.mode) as GeneratedQRCodeSegment)
    }

    return acc
  }, [])
}

/**
 * Builds an optimized sequence of segments from a string,
 * which will produce the shortest possible bitstream.
 *
 * @param  data    Input string
 * @param  version QR Code version
 * @return         Array of segments
 */
export function fromString (data: string, version: number): GeneratedQRCodeSegment[] {
  const segs = getSegmentsFromString(data)

  const nodes = buildNodes(segs)
  const graph = buildGraph(nodes, version)
  const path = dijkstra.find_path(graph.map, 'start', 'end')

  const optimizedSegs = []
  for (let i = 1; i < path.length - 1; i++) {
    optimizedSegs.push(graph.table[path[i]].node)
  }

  return fromArray(mergeSegments(optimizedSegs))
}

/**
 * Splits a string in various segments with the modes which
 * best represent their content.
 * The produced segments are far from being optimized.
 * The output of this function is only used to estimate a QR Code version
 * which may contain the data.
 *
 * @param  data Input string
 * @return      Array of segments
 */
export function rawSplit (data: string): GeneratedQRCodeSegment[] {
  return fromArray(
    getSegmentsFromString(data)
  )
}
