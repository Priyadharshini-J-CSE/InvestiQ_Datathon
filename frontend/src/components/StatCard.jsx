import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ icon: Icon, label, value, change, changeType = 'up', color = '#FF2D2D', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, borderColor: 'rgba(255,45,45,0.3)' }}
      className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg" style={{ background: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${changeType === 'up' ? 'text-green' : 'text-primary'}`}>
            {changeType === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </motion.div>
  )
}
