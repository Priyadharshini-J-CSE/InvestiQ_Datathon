import { motion } from 'framer-motion'

const typeColors = {
  fir: 'bg-primary/20 border-primary/30',
  arrest: 'bg-green/20 border-green/30',
  evidence: 'bg-blue-500/20 border-blue-500/30',
  alert: 'bg-yellow-500/20 border-yellow-500/30',
  court: 'bg-purple-500/20 border-purple-500/30',
}

const dotColors = {
  fir: 'bg-primary',
  arrest: 'bg-green',
  evidence: 'bg-blue-400',
  alert: 'bg-yellow-400',
  court: 'bg-purple-400',
}

export default function Timeline({ activities }) {
  return (
    <div className="space-y-3">
      {activities.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3">
          <div className="flex flex-col items-center mt-1">
            <div className={`w-2.5 h-2.5 rounded-full ${dotColors[item.type] || 'bg-gray-500'}`} />
            {i < activities.length - 1 && <div className="w-px h-8 bg-white/5 mt-1" />}
          </div>
          <div className="flex-1 pb-2">
            <p className="text-sm text-gray-300">{item.text}</p>
            <span className="text-xs text-gray-600">{item.time}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
