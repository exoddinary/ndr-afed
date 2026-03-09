"use client"

import { useState, useEffect } from "react"
import { Network, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

type GraphNode = {
  id: string
  type: string
  name: string
  properties?: Record<string, unknown>
}

type GraphEdge = {
  type: string
  from: string
  to: string
  confidence?: number
  provenance?: string
  method?: string
}

type BlockNetwork = {
  block: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  summary: {
    wells: number
    fields: number
    operators: number
  }
}

export function GraphPreview() {
  const [isOpen, setIsOpen] = useState(false)
  const [blockId, setBlockId] = useState("F03")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BlockNetwork | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchGraph = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/graph/preview?format=block-network&block=${blockId}`)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch when opened
  useEffect(() => {
    if (isOpen && !data) {
      fetchGraph()
    }
  }, [isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-colors"
      >
        <Network className="w-4 h-4" />
        Knowledge Graph
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Network className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Knowledge Graph Explorer</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Block:</label>
            <input
              type="text"
              value={blockId}
              onChange={(e) => setBlockId(e.target.value.toUpperCase())}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="F03"
            />
            <button
              onClick={fetchGraph}
              disabled={loading}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
            >
              {loading ? "Loading..." : "Explore"}
            </button>
          </div>

          {data && (
            <div className="flex items-center gap-4 text-sm text-gray-600 ml-auto">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {data.summary.wells} Wells
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {data.summary.fields} Fields
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                {data.summary.operators} Operators
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* Network Visualization (Simple List View) */}
              <div className="grid grid-cols-3 gap-4">
                {/* Wells */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Wells ({data.summary.wells})
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {data.nodes
                      .filter((n) => n.type === "WELL")
                      .slice(0, 20)
                      .map((well) => (
                        <li key={well.id} className="text-blue-800 truncate">
                          {well.name}
                        </li>
                      ))}
                    {data.summary.wells > 20 && (
                      <li className="text-blue-600/60 text-xs italic">
                        +{data.summary.wells - 20} more...
                      </li>
                    )}
                  </ul>
                </div>

                {/* Fields */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Fields ({data.summary.fields})
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {data.nodes
                      .filter((n) => n.type === "FIELD")
                      .map((field) => (
                        <li key={field.id} className="text-green-800 truncate">
                          {field.name}
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Operators */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Operators ({data.summary.operators})
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {data.nodes
                      .filter((n) => n.type === "OPERATOR")
                      .map((op) => (
                        <li key={op.id} className="text-orange-800 truncate">
                          {op.name}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              {/* Relationships Table */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Relationships</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">From</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">To</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Confidence</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.edges.slice(0, 50).map((edge, i) => {
                        const fromNode = data.nodes.find((n) => n.id === edge.from)
                        const toNode = data.nodes.find((n) => n.id === edge.to)
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                  edge.type.includes("WELL")
                                    ? "bg-blue-100 text-blue-700"
                                    : edge.type.includes("FIELD")
                                      ? "bg-green-100 text-green-700"
                                      : edge.type.includes("OPERATOR")
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {edge.type.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-700 truncate max-w-[150px]">
                              {fromNode?.name || edge.from}
                            </td>
                            <td className="px-3 py-2 text-gray-700 truncate max-w-[150px]">
                              {toNode?.name || edge.to}
                            </td>
                            <td className="px-3 py-2">
                              {edge.confidence ? (
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded text-xs ${
                                    edge.confidence > 0.8
                                      ? "bg-green-100 text-green-700"
                                      : edge.confidence > 0.6
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {(edge.confidence * 100).toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-500 text-xs">
                              {edge.method}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {data.edges.length > 50 && (
                    <p className="text-center text-gray-400 text-xs py-2">
                      +{data.edges.length - 50} more relationships
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!data && !loading && !error && (
            <div className="text-center text-gray-400 py-12">
              Enter a block ID (e.g., F03, K06) to explore its knowledge graph
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
          <span>
            The knowledge graph connects wells, fields, and operators through spatial
            intersections
          </span>
          <a
            href="/api/graph/preview?format=summary"
            target="_blank"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            View API →
          </a>
        </div>
      </div>
    </div>
  )
}
