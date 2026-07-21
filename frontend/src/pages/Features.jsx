import { motion } from 'framer-motion'
import { Search, GitBranch, Network, Clock, Mic, TrendingUp, Scale, Globe, Camera, FileText, Shield, MapPin } from 'lucide-react'
import { features } from '../utils/mockData'

const iconMap = { Search, GitBranch, Network, Clock, Mic, TrendingUp, Scale, Globe, Camera, FileText, Shield, MapPin }

export default function Features() {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-4">
          <span className="text-sm text-primary font-medium">Platform Capabilities</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-4xl font-black text-white mb-3">
          Powered by Advanced AI
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-xl mx-auto">
          12 specialized AI modules working together to transform crime investigation
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {features.map((f, i) => {
          const Icon = iconMap[f.icon] || Shield
          return (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, borderColor: `${f.color}40` }}
              className="card border border-white/5 cursor-pointer group transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                  <Icon size={22} style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1.5 group-hover:text-white transition-colors">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
