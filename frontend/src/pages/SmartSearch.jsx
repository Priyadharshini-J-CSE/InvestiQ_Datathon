import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'
import ResultCard from '../components/ResultCard'
import Loader from '../components/Loader'
import { searchService } from '../services/api'

const filters = ['All', 'FIR', 'Criminal', 'Vehicle', 'IPC', 'District']

export default function SmartSearch() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [source, setSource] = useState('')

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await searchService.semanticSearch(query, 12)
      const data = res.data
      // Normalize results from AI or DB fallback
      const raw = data.results || []
      const normalized = raw.map((r, i) => ({
        id: r.metadata?.fir_number || r.id || `result-${i}`,
        title: r.metadata?.crime_type || r.crime_type || 'Unknown Crime',
        status: r.metadata?.status || r.status || 'Unknown',
        accused: r.metadata?.criminal || r.metadata?.accused || r.accused || '—',
        district: r.metadata?.district || r.district || '—',
        filedDate: r.metadata?.date || r.date || '—',
        ipcSections: r.metadata?.ipc_sections || '—',
        aiSummary: r.content || r.description || '',
        matchScore: r.score ? Math.round(Math.max(0, 100 - r.score * 10)) : 80,
      }))
      setResults(normalized)
      setSource(data.source || 'semantic')
    } catch {
      setResults([])
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Smart Search</h1>
        <p className="text-gray-500 text-sm mt-1">Semantic vector search across all FIRs, criminals, and evidence</p>
      </div>

      {/* Search Bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="card border border-white/5">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by case description, accused name, IPC section, district..."
              className="input-field pl-12 py-3 text-base"
            />
          </div>
          <button type="submit" className="btn-primary px-6 flex items-center gap-2">
            <Search size={16} /> Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <SlidersHorizontal size={14} className="text-gray-500" />
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                activeFilter === f
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      {loading && <Loader text="Performing semantic search..." />}

      {!loading && searched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              Found <span className="text-white font-semibold">{results.length}</span> results
              {query && <> for "<span className="text-primary">{query}</span>"</>}
              {source && <span className="ml-2 text-xs text-gray-600">({source} search)</span>}
            </p>
            <span className="text-xs text-gray-600">Sorted by semantic relevance</span>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.map((fir, i) => <ResultCard key={fir.id} fir={fir} delay={i * 0.04} />)}
          </div>
        </div>
      )}

      {!searched && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Search the Intelligence Database</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Use natural language to search across 12,847 FIRs, criminal records, and evidence using AI-powered semantic search.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['Chain snatching Bengaluru', 'IPC 302 murder cases', 'Cyber fraud 2024', 'Repeat offenders Mysuru'].map(s => (
              <button key={s} onClick={() => { setQuery(s) }}
                className="text-xs bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 text-gray-400 hover:text-primary px-3 py-2 rounded-lg transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
