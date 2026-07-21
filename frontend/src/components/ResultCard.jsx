import { motion } from 'framer-motion'
import { ExternalLink, Eye, Brain } from 'lucide-react'

const statusColors = {
  'Active': 'badge-red',
  'Pending': 'badge-yellow',
  'Closed': 'badge-green',
  'Under Investigation': 'badge-blue',
}

export default function ResultCard({ fir, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ borderColor: 'rgba(255,45,45,0.2)' }}
      className="card border border-white/5 hover:shadow-glow-sm transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-primary">{fir.id}</span>
            <span className={statusColors[fir.status] || 'badge-gray'}>{fir.status}</span>
          </div>
          <h3 className="text-sm font-semibold text-white">{fir.title}</h3>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">{fir.matchScore}%</div>
          <div className="text-xs text-gray-500">Match</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-400">
        <div><span className="text-gray-600">Accused:</span> {fir.accused}</div>
        <div><span className="text-gray-600">Filed:</span> {fir.filedDate}</div>
        <div><span className="text-gray-600">District:</span> {fir.district}</div>
        <div><span className="text-gray-600">IPC:</span> {fir.ipcSections}</div>
      </div>

      <div className="bg-white/3 rounded-lg p-3 mb-3 border border-white/5">
        <div className="flex items-center gap-1.5 mb-1">
          <Brain size={12} className="text-primary" />
          <span className="text-xs font-medium text-primary">AI Summary</span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{fir.aiSummary}</p>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5">
          <ExternalLink size={12} /> Open
        </button>
        <button className="flex-1 btn-ghost text-xs py-2 flex items-center justify-center gap-1.5">
          <Eye size={12} /> View Details
        </button>
      </div>
    </motion.div>
  )
}
