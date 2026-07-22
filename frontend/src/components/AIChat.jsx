import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Bot, User, Loader2, Zap } from 'lucide-react'
import { suggestedPrompts } from '../utils/mockData'
import { assistantService } from '../services/api'

export default function AIChat({ compact = false }) {
  const [messages, setMessages] = useState([
    {
      id: 1, role: 'assistant',
      content: "Hello! I'm **InvestiQ AI**, your crime intelligence assistant. I can analyze FIRs, detect patterns, search case histories, and generate investigation insights.\n\nHow can I assist you today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setError(null)
    const userMsg = { id: Date.now(), role: 'user', content: msg, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await assistantService.ask(msg, history)
      const data = res.data
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        confidence: data.confidence,
        sources: data.sources || []
      }])
    } catch (err) {
      const errMsg = err.response?.data?.error || 'AI service unavailable. Please ensure the Python API is running on port 5001.'
      setError(errMsg)
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        content: `⚠️ ${errMsg}`,
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const formatContent = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-white mt-2 mb-1">{line.replace(/\*\*/g, '')}</p>
      }
      if (line.startsWith('•')) return <p key={i} className="text-gray-300 pl-2">{line}</p>
      if (/^\d\./.test(line)) return <p key={i} className="text-gray-300 pl-2">{line}</p>
      if (line.startsWith('*') && line.endsWith('*')) return <p key={i} className="text-xs text-gray-500 italic mt-2">{line.replace(/\*/g, '')}</p>
      return <p key={i} className="text-gray-300">{line}</p>
    })
  }

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'h-[calc(100vh-8rem)]'}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === 'assistant' ? 'bg-primary/20 border border-primary/30' : 'bg-white/10'
              }`}>
                {msg.role === 'assistant' ? <Bot size={16} className="text-primary" /> : <User size={16} className="text-gray-300" />}
              </div>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed space-y-0.5 ${
                  msg.role === 'user' ? 'bg-primary/20 border border-primary/20 text-white' : 'bg-white/5 border border-white/5'
                }`}>
                  {formatContent(msg.content)}
                </div>
                {msg.confidence && (
                  <div className="flex items-center gap-3 px-1">
                    <span className="text-xs text-gray-600">Confidence: <span className="text-green">{msg.confidence}%</span></span>
                    <div className="flex gap-1">
                      {msg.sources?.map(s => (
                        <span key={s} className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-500">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                <span className="text-xs text-gray-600 px-1">
                  {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Bot size={16} className="text-primary" />
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="text-primary animate-spin" />
              <span className="text-sm text-gray-400">Analyzing intelligence database...</span>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-600 mb-2">Suggested queries:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.slice(0, 4).map(p => (
              <button key={p} onClick={() => sendMessage(p)}
                className="text-xs bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 text-gray-400 hover:text-primary px-3 py-1.5 rounded-lg transition-all">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask about cases, criminals, patterns..."
              className="input-field pr-10"
            />
            <Zap size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" />
          </div>
          <button onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed">
            <Send size={16} />
          </button>
          <button className="p-2.5 rounded-lg border border-white/10 hover:border-primary/30 text-gray-400 hover:text-primary transition-all">
            <Mic size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
