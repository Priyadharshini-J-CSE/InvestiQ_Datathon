import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Network, RefreshCw, Search, Info } from 'lucide-react'
import { aiService } from '../services/api'
import Loader from '../components/Loader'
import { useToast } from '../components/Toast'

const NODE_COLORS = {
  criminal: '#FF2D2D',
  fir:      '#42A5F5',
  officer:  '#00D26A',
  gang:     '#FFB74D',
  default:  '#888',
}

function NetworkGraph({ nodes, edges }) {
  const svgRef = useRef(null)
  const [positions, setPositions] = useState({})
  const [dragging, setDragging] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!nodes.length) return
    const pos = {}
    const cx = 500, cy = 300, r = 220
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length
      pos[n.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
    })
    setPositions(pos)
  }, [nodes])

  const handleMouseDown = (e, id) => {
    e.stopPropagation()
    setDragging(id)
    setSelected(id)
  }

  const handleMouseMove = (e) => {
    if (!dragging || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    setPositions(p => ({ ...p, [dragging]: { x: e.clientX - rect.left, y: e.clientY - rect.top } }))
  }

  const handleMouseUp = () => setDragging(null)

  const selectedNode = nodes.find(n => n.id === selected)

  return (
    <div className="relative">
      <svg ref={svgRef} width="100%" viewBox="0 0 1000 600" className="bg-white/2 rounded-xl border border-white/5 cursor-grab"
        onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#444" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const s = positions[e.source], t = positions[e.target]
          if (!s || !t) return null
          return (
            <g key={i}>
              <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#333" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 4} fill="#555" fontSize="9" textAnchor="middle">{e.label}</text>
            </g>
          )
        })}
        {nodes.map(n => {
          const p = positions[n.id]
          if (!p) return null
          const color = NODE_COLORS[n.type] || NODE_COLORS.default
          const isSelected = selected === n.id
          return (
            <g key={n.id} onMouseDown={ev => handleMouseDown(ev, n.id)} style={{ cursor: 'pointer' }}>
              <circle cx={p.x} cy={p.y} r={isSelected ? 22 : 16}
                fill={color} fillOpacity={0.2} stroke={color} strokeWidth={isSelected ? 2.5 : 1.5} />
              <text x={p.x} y={p.y + 4} fill={color} fontSize="9" textAnchor="middle" fontWeight="600">
                {n.type === 'fir' ? '📄' : n.type === 'officer' ? '👮' : n.type === 'gang' ? '⚠️' : '🔴'}
              </text>
              <text x={p.x} y={p.y + 28} fill="#aaa" fontSize="9" textAnchor="middle">
                {n.label?.length > 12 ? n.label.slice(0, 12) + '…' : n.label}
              </text>
            </g>
          )
        })}
      </svg>

      {selectedNode && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="absolute top-3 right-3 card border border-white/10 w-56 text-xs space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ background: NODE_COLORS[selectedNode.type] || '#888' }} />
            <span className="font-semibold text-white capitalize">{selectedNode.type}</span>
          </div>
          <p className="text-gray-300">{selectedNode.label}</p>
          {selectedNode.risk && <p className="text-gray-500">Risk: <span className="text-primary">{selectedNode.risk}</span></p>}
          <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-400 mt-1">✕ Close</button>
        </motion.div>
      )}
    </div>
  )
}

export default function CriminalNetwork() {
  const toast = useToast()
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  const load = async (q = '') => {
    setLoading(true)
    try {
      const res = await aiService.network(q || 'criminal network gang associates')
      setNodes(res.data.nodes || [])
      setEdges(res.data.edges || [])
    } catch { toast('Failed to load network data', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const legend = [
    { type: 'criminal', label: 'Criminal', color: NODE_COLORS.criminal },
    { type: 'fir',      label: 'FIR',      color: NODE_COLORS.fir },
    { type: 'officer',  label: 'Officer',  color: NODE_COLORS.officer },
    { type: 'gang',     label: 'Gang',     color: NODE_COLORS.gang },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Network size={20} className="text-primary" /> Criminal Network Analysis
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Visualize relationships between criminals, FIRs, gangs and officers</p>
        </div>
        <button onClick={() => load(query)} disabled={loading}
          className="btn-ghost text-sm py-2 px-3 flex items-center gap-2 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="card flex gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(query)}
            placeholder="Search network by criminal name, gang, FIR..."
            className="input-field pl-9 py-2 text-sm" />
        </div>
        <button onClick={() => load(query)} className="btn-primary px-4 text-sm">Analyze</button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {legend.map(l => (
          <div key={l.type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
            <span className="text-xs text-gray-400">{l.label}</span>
          </div>
        ))}
        <span className="text-xs text-gray-600 ml-auto">{nodes.length} nodes · {edges.length} connections</span>
      </div>

      {loading ? <Loader text="Building criminal network..." /> : (
        nodes.length > 0
          ? <NetworkGraph nodes={nodes} edges={edges} />
          : (
            <div className="card text-center py-16">
              <Network size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No network data found. Try a different search query.</p>
            </div>
          )
      )}

      <div className="card flex items-start gap-2 text-xs text-gray-500">
        <Info size={13} className="text-primary mt-0.5 flex-shrink-0" />
        Drag nodes to rearrange. Click a node to view details. Network is built from FIR, criminal, and gang data in the database.
      </div>
    </div>
  )
}
