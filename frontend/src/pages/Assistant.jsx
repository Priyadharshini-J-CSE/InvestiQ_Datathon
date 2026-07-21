import { motion } from 'framer-motion'
import { Bot, Zap, Brain, FileText, Users, Search, TrendingUp } from 'lucide-react'
import AIChat from '../components/AIChat'
import { suggestedPrompts } from '../utils/mockData'

const capabilities = [
  { icon: Search, text: 'Semantic FIR Search' },
  { icon: Brain, text: 'Pattern Detection' },
  { icon: Users, text: 'Criminal Profiling' },
  { icon: FileText, text: 'Document Summary' },
  { icon: TrendingUp, text: 'Crime Analytics' },
  { icon: Zap, text: 'Legal Lookup' },
]

export default function Assistant() {
  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Left Panel */}
      <div className="w-72 flex-shrink-0 space-y-4">
        <div className="card border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <Bot size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">InvertiQ AI</h3>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green rounded-full animate-pulse" />
                <span className="text-xs text-green">Online</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Powered by RAG + FAISS vector search over 12,847 FIRs, chargesheets, and court judgements.
          </p>
        </div>

        <div className="card border border-white/5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Capabilities</h4>
          <div className="space-y-2">
            {capabilities.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-gray-400">
                <Icon size={13} className="text-primary" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="card border border-white/5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Suggested Queries</h4>
          <div className="space-y-2">
            {suggestedPrompts.slice(4).map(p => (
              <div key={p} className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer py-1 border-b border-white/5 last:border-0 transition-colors">
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 card border border-white/5 overflow-hidden p-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <Bot size={16} className="text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">AI Investigation Assistant</h2>
            <p className="text-xs text-gray-500">Natural language crime intelligence queries</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-600">Model: InvertiQ-RAG-v2</span>
            <div className="w-2 h-2 bg-green rounded-full animate-pulse" />
          </div>
        </div>
        <AIChat />
      </motion.div>
    </div>
  )
}
