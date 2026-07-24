import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MicOff, Bot, User, Loader2, Zap, Copy, RefreshCw, Trash2, Volume2, VolumeX, Globe } from 'lucide-react'
import { suggestedPrompts } from '../utils/mockData'
import { assistantService } from '../services/api'
import { useToast } from './Toast'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
]

const INITIAL_MSG = {
  id: 1, role: 'assistant',
  content: "Hello! I'm **InvestiQ AI**, your crime intelligence assistant. I can analyze FIRs, detect patterns, search case histories, and generate investigation insights.\n\nHow can I assist you today?",
  timestamp: new Date()
}

export default function AIChat({ compact = false }) {
  const toast = useToast()
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [lang, setLang] = useState('en')
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Speech-to-Text
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { toast('Speech recognition not supported in this browser', 'error'); return }
    const rec = new SpeechRecognition()
    rec.lang = lang === 'kn' ? 'kn-IN' : 'en-IN'
    rec.interimResults = false
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }

  // Text-to-Speech
  const speak = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const plain = text.replace(/\*\*/g, '').replace(/^[#*\-+]\s/gm, '')
    const utt = new SpeechSynthesisUtterance(plain)
    utt.lang = lang === 'kn' ? 'kn-IN' : 'en-IN'
    utt.onstart = () => setSpeaking(true)
    utt.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(utt)
  }

  const stopSpeaking = () => { window.speechSynthesis.cancel(); setSpeaking(false) }

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const langInstruction = lang === 'kn' ? ' (Please respond in Kannada language)' : ''
    const fullMsg = msg + langInstruction

    const userMsg = { id: Date.now(), role: 'user', content: msg, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await assistantService.ask(fullMsg, history)
      const data = res.data
      const aiMsg = {
        id: Date.now() + 1, role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        confidence: data.confidence,
        sources: data.sources || []
      }
      setMessages(prev => [...prev, aiMsg])
      // Save to history
      assistantService.saveChatHistory(msg, data.response).catch(() => {})
    } catch (err) {
      const errMsg = err.response?.data?.error || 'AI service unavailable. Please ensure the Python API is running on port 5001.'
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: `⚠️ ${errMsg}`, timestamp: new Date() }])
    } finally { setLoading(false) }
  }

  const regenerate = async () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.id > lastUser.id)))
    await sendMessage(lastUser.content)
  }

  const copyMsg = (text) => {
    navigator.clipboard.writeText(text.replace(/\*\*/g, ''))
    toast('Copied to clipboard', 'success')
  }

  const clearChat = () => { setMessages([INITIAL_MSG]); window.speechSynthesis?.cancel() }

  const renderInline = (text) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
        : part
    )

  const formatContent = (text) =>
    text.split('\n').map((line, i) => {
      const t = line.trim()
      if (!t) return <div key={i} className="h-1" />
      if (/^\*\s/.test(t)) return (
        <div key={i} className="flex gap-2 text-gray-300 pl-2">
          <span className="text-primary mt-0.5">•</span><span>{renderInline(t.slice(2))}</span>
        </div>
      )
      if (/^\+\s/.test(t)) return (
        <div key={i} className="flex gap-2 text-gray-400 pl-6 text-xs">
          <span className="text-gray-600 mt-0.5">–</span><span>{renderInline(t.slice(2))}</span>
        </div>
      )
      if (/^\d+\.\s/.test(t)) return (
        <div key={i} className="flex gap-2 text-gray-300 pl-2">
          <span className="text-primary text-xs mt-0.5">{t.match(/^\d+/)[0]}.</span>
          <span>{renderInline(t.replace(/^\d+\.\s/, ''))}</span>
        </div>
      )
      if (/^#{1,3}\s/.test(t)) return (
        <p key={i} className="font-semibold text-white mt-2 mb-1">{renderInline(t.replace(/^#+\s/, ''))}</p>
      )
      return <p key={i} className="text-gray-300">{renderInline(t)}</p>
    })

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'h-[calc(100vh-8rem)]'}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-1 ml-auto">
          {/* Language switcher */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
            <Globe size={12} className="text-gray-500 ml-1.5" />
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`text-xs px-2 py-1 rounded-md transition-all ${lang === l.code ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}>
                {l.label}
              </button>
            ))}
          </div>
          <button onClick={clearChat} title="Clear chat"
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 px-1">
                    {msg.confidence && (
                      <span className="text-xs text-gray-600">Confidence: <span className="text-green">{msg.confidence}%</span></span>
                    )}
                    {msg.sources?.map(s => (
                      <span key={s} className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-500">{s}</span>
                    ))}
                    <button onClick={() => copyMsg(msg.content)} title="Copy"
                      className="p-1 rounded hover:bg-white/5 text-gray-600 hover:text-gray-300 transition-all">
                      <Copy size={11} />
                    </button>
                    <button onClick={() => speak(msg.content)} title="Read aloud"
                      className="p-1 rounded hover:bg-white/5 text-gray-600 hover:text-primary transition-all">
                      <Volume2 size={11} />
                    </button>
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
        {speaking && (
          <div className="flex items-center gap-2 mb-2 text-xs text-primary">
            <Volume2 size={12} className="animate-pulse" /> Speaking...
            <button onClick={stopSpeaking} className="text-gray-500 hover:text-red-400 ml-1"><VolumeX size={12} /></button>
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={lang === 'kn' ? 'ಪ್ರಶ್ನೆ ಕೇಳಿ...' : 'Ask about cases, criminals, patterns...'}
              className="input-field pr-10" />
            <Zap size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" />
          </div>
          {messages.length > 2 && (
            <button onClick={regenerate} disabled={loading} title="Regenerate last response"
              className="p-2.5 rounded-lg border border-white/10 hover:border-primary/30 text-gray-400 hover:text-primary transition-all disabled:opacity-40">
              <RefreshCw size={15} />
            </button>
          )}
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed">
            <Send size={16} />
          </button>
          <button onClick={listening ? stopListening : startListening}
            className={`p-2.5 rounded-lg border transition-all ${
              listening ? 'border-primary bg-primary/10 text-primary animate-pulse' : 'border-white/10 hover:border-primary/30 text-gray-400 hover:text-primary'
            }`} title={listening ? 'Stop listening' : 'Voice input'}>
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
