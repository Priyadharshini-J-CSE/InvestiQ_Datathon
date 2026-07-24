import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, RefreshCw, MapPin, Loader2 } from 'lucide-react'
import { aiService } from '../services/api'
import { useToast } from '../components/Toast'
import { districts } from '../utils/mockData'

export default function PredictiveAnalytics() {
  const toast = useToast()
  const [district, setDistrict] = useState('')
  const [predictions, setPredictions] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const res = await aiService.predict(district || 'all districts')
      setPredictions(res.data.predictions || '')
    } catch (err) {
      toast(err.response?.data?.error || 'Prediction failed', 'error')
    } finally { setLoading(false) }
  }

  const renderPredictions = (text) =>
    text.split('\n').map((line, i) => {
      const t = line.trim()
      if (!t) return <div key={i} className="h-1" />
      if (/^#{1,3}\s/.test(t)) return <p key={i} className="font-semibold text-white mt-3 mb-1">{t.replace(/^#+\s/, '')}</p>
      if (/^[-*]\s/.test(t)) return (
        <div key={i} className="flex gap-2 text-gray-300 text-sm pl-2">
          <span className="text-primary mt-0.5">•</span>
          <span>{t.slice(2)}</span>
        </div>
      )
      if (/^\d+\.\s/.test(t)) return (
        <div key={i} className="flex gap-2 text-gray-300 text-sm pl-2">
          <span className="text-primary text-xs mt-0.5">{t.match(/^\d+/)[0]}.</span>
          <span>{t.replace(/^\d+\.\s/, '')}</span>
        </div>
      )
      return <p key={i} className="text-gray-300 text-sm">{t}</p>
    })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" /> Predictive Analytics
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">AI-powered crime predictions based on historical data</p>
      </div>

      <div className="card flex flex-wrap items-center gap-3">
        <MapPin size={14} className="text-gray-500" />
        <select value={district} onChange={e => setDistrict(e.target.value)} className="input-field text-sm py-2 w-52">
          <option value="">All Districts</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button onClick={run} disabled={loading} className="btn-primary text-sm py-2 px-5 flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
          Generate Predictions
        </button>
      </div>

      {!predictions && !loading && (
        <div className="card text-center py-16">
          <TrendingUp size={32} className="text-gray-600 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-1">AI Crime Predictions</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Select a district and click Generate to get AI-powered predictions on crime hotspots,
            repeat offender patterns, and high-risk areas.
          </p>
        </div>
      )}

      {loading && (
        <div className="card flex items-center justify-center py-16 gap-3">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="text-gray-400">Analyzing historical crime data...</span>
        </div>
      )}

      {predictions && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              Predictions {district ? `— ${district}` : '— All Districts'}
            </h3>
            <button onClick={run} className="text-xs text-gray-500 hover:text-primary flex items-center gap-1">
              <RefreshCw size={11} /> Regenerate
            </button>
          </div>
          <div className="space-y-1">{renderPredictions(predictions)}</div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <span className="text-xs text-gray-600">Powered by InvestiQ RAG + Groq LLM</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
