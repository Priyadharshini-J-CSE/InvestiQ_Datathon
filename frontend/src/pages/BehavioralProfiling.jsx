import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Search, Loader2, RefreshCw, User } from 'lucide-react'
import { aiService, criminalService } from '../services/api'
import { useToast } from '../components/Toast'

export default function BehavioralProfiling() {
  const toast = useToast()
  const [criminals, setCriminals] = useState([])
  const [selected, setSelected] = useState(null)
  const [profile, setProfile] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    criminalService.getAll({ page: 1, limit: 50 })
      .then(r => setCriminals(r.data.data || []))
      .catch(() => {})
  }, [])

  const generate = async (criminal) => {
    setSelected(criminal)
    setProfile('')
    setLoading(true)
    try {
      const res = await aiService.behavioralProfile(criminal.criminal_id, criminal.name)
      setProfile(res.data.profile || '')
    } catch (err) {
      toast(err.response?.data?.error || 'Profile generation failed', 'error')
    } finally { setLoading(false) }
  }

  const filtered = criminals.filter(c =>
    !search || (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.criminal_id || '').toLowerCase().includes(search.toLowerCase())
  )

  const renderProfile = (text) =>
    text.split('\n').map((line, i) => {
      const t = line.trim()
      if (!t) return <div key={i} className="h-1" />
      if (/^#{1,3}\s/.test(t)) return <p key={i} className="font-semibold text-white mt-3 mb-1 text-sm">{t.replace(/^#+\s/, '')}</p>
      if (/^[-*]\s/.test(t)) return (
        <div key={i} className="flex gap-2 text-gray-300 text-sm pl-2">
          <span className="text-primary mt-0.5">•</span><span>{t.slice(2)}</span>
        </div>
      )
      return <p key={i} className="text-gray-300 text-sm">{t}</p>
    })

  const riskColor = (r) => r === 'High' ? 'text-primary' : r === 'Medium' ? 'text-yellow-400' : 'text-green'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain size={20} className="text-primary" /> Behavioral Profiling
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">AI-generated criminal behavioral profiles from case history</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Criminal List */}
        <div className="card space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search criminal..." className="input-field pl-8 py-2 text-sm" />
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {filtered.length === 0 && <p className="text-gray-600 text-xs text-center py-4">No criminals found</p>}
            {filtered.map(c => (
              <button key={c.id} onClick={() => generate(c)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm flex items-center gap-2 ${
                  selected?.id === c.id ? 'bg-primary/10 border border-primary/20 text-primary' : 'hover:bg-white/5 text-gray-300'
                }`}>
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <User size={13} className="text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.name || c.criminal_id}</p>
                  <p className={`text-xs ${riskColor(c.risk_level)}`}>{c.risk_level || 'Unknown'} Risk</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Panel */}
        <div className="md:col-span-2 card min-h-[400px]">
          {!selected && !loading && (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <Brain size={32} className="text-gray-600 mb-3" />
              <p className="text-gray-500 text-sm">Select a criminal from the list to generate their behavioral profile</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span className="text-gray-400 text-sm">Generating behavioral profile...</span>
            </div>
          )}

          {selected && profile && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <User size={16} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{selected.name || selected.criminal_id}</h3>
                    <p className={`text-xs ${riskColor(selected.risk_level)}`}>{selected.risk_level || 'Unknown'} Risk · {selected.criminal_id}</p>
                  </div>
                </div>
                <button onClick={() => generate(selected)} className="text-xs text-gray-500 hover:text-primary flex items-center gap-1">
                  <RefreshCw size={11} /> Regenerate
                </button>
              </div>
              <div className="border-t border-white/5 pt-3 space-y-1">
                {renderProfile(profile)}
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-xs text-gray-600">Generated by InvestiQ RAG + Groq LLM</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
