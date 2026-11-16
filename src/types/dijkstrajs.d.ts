// Minimal declarations for dijkstrajs (no @types package available)
declare module 'dijkstrajs' {
  namespace dijkstra {
    /** Adjacency map: node -> (neighbour -> edge cost) */
    type Graph = Record<string, Record<string, number>>

    function single_source_shortest_paths (graph: Graph, s: string, d?: string): Record<string, string>
    function extract_shortest_path_from_predecessor_list (predecessors: Record<string, string>, d: string): string[]
    function find_path (graph: Graph, s: string, d: string): string[]
  }

  export = dijkstra
}
