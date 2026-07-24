import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileSearch, Upload, Loader2, Download, RefreshCw, FileText } from 'lucide-react'
import { aiService, firService } from '../services/api'
import { useToast } from '../components/Toast'

export default function AIReports() {
  const toast = useToast()
  const [firs, setFirs] = useState([])
  const [selectedFir, setSelectedFir] = useState('')
  const [customText, setCustomText] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('fir') // 'fir' | 'text'

  useEffect(() => {
    firService.getAll({ page: 1, limit: 50 })
      .then(r => setFirs(r.data.data || []))
      .catch(() => {})
  }, [])

  const summarize = async () => {
    setLoading(true)
    setSummary('')
    try {
      const payload = tab === 'fir'
        ? { fir_id: selectedFir }
        : { text: customText }
      const res = await aiService.summarize(payload.text, payload.fir_id)
      setSummary(res.data.summary || '')
    } catch (err) {
      toast(err.response?.data?.error || 'Summarization failed', 'error')
    } finally { setLoading(false) }
  }

  const exportPDF = () => {
    const content = `InvestiQ AI Report\n${'='.repeat(40)}\n\n${summary}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `investiq-report-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast('Report downloaded', 'success')
  }

  const renderSummary = (text) =>
    text.split('\n').map((line, i) => {
      const t = line.trim()
      if (!t) return <div key={i} className="h-1" />
      if (/^#{1,3}\s/.test(t)) return <p key={i} className="font-semibold text-white mt-3 mb-1 text-sm">{t.replace(/^#+\s/, '')}</p>
      if (/^[-*]\s/.test(t)) return (
        <div key={i} className="flex gap-2 text-gray-300 text-sm pl-2">
          <span className="text-primary mt-0.5">•</span><span>{t.slice(2)}</span>
        </div>
      )
      if (/^\*\*(.+)\*\*/.test(t)) return <p key={i} className="font-semibold text-white text-sm">{t.replace(/\*\*/g, '')}</p>
      return <p key={i} className="text-gray-300 text-sm">{t}</p>
    })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FileSearch size={20} className="text-primary" /> AI Reports & Summarizer
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Summarize FIRs, chargesheets, and investigation documents using AI</p>
      </div>

      <div className="card space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          {[{ id: 'fir', label: 'Summarize FIR' }, { id: 'text', label: 'Paste Document' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`text-sm px-4 py-2 rounded-lg border transition-all ${
                tab === t.id ? 'bg-primary/10 border-primary/30 text-primary' : 'border-white/10 text-gray-400 hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'fir' ? (
          <div className="flex gap-3">
            <select value={selectedFir} onChange={e => setSelectedFir(e.target.value)} className="input-field text-sm py-2 flex-1">
              <option value="">Select a FIR...</option>
              {firs.map(f => (
                <option key={f.id} value={f.id}>{f.fir_number} — {f.crime_type || 'Unknown'} ({f.district || ''})</option>
              ))}
            </select>
            <button onClick={summarize} disabled={!selectedFir || loading}
              className="btn-primary text-sm px-5 flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Summarize
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea value={customText} onChange={e => setCustomText(e.target.value)}
              placeholder="Paste FIR text, chargesheet, or investigation report here..."
              rows={6} className="input-field text-sm resize-none" />
            <button onClick={summarize} disabled={!customText.trim() || loading}
              className="btn-primary text-sm px-5 flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Summarize Document
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="card flex items-center justify-center py-12 gap-3">
          <Loader2 size={22} className="animate-spin text-primary" />
          <span className="text-gray-400 text-sm">Analyzing document with AI...</span>
        </div>
      )}

      {summary && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText size={14} className="text-primary" /> AI Summary
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={summarize} className="text-xs text-gray-500 hover:text-primary flex items-center gap-1">
                <RefreshCw size={11} /> Regenerate
              </button>
              <button onClick={exportPDF} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                <Download size={12} /> Export
              </button>
            </div>
          </div>
          <div className="border-t border-white/5 pt-3 space-y-1">
            {renderSummary(summary)}
          </div>
          <div className="pt-2 border-t border-white/5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <span className="text-xs text-gray-600">Generated by InvestiQ RAG + Groq LLM</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
