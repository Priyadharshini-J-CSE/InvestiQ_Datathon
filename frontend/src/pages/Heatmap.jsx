import { useState, useEffect } from 'react'
import { Map, Filter, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { dashboardService, firService } from '../services/api'
import { districts, crimeCategories } from '../utils/mockData'

export default function Heatmap() {
  const toast = useToast()
  const [heatData, setHeatData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterCrime, setFilterCrime] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await dashboardService.getHeatmap()
      setHeatData(res.data.data || [])
    } catch { toast('Failed to load heatmap data', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Aggregate by district
  const districtMap = {}
  heatData.forEach(r => {
    if (!r.district) return
    if (filterCrime && r.crime_type !== filterCrime) return
    if (filterDistrict && r.district !== filterDistrict) return
    districtMap[r.district] = (districtMap[r.district] || 0) + parseInt(r.count || 0)
  })

  const maxCount = Math.max(...Object.values(districtMap), 1)

  // If no live data, show all districts with 0
  const displayDistricts = districts.map(d => ({
    district: d,
    count: districtMap[d] || 0,
    intensity: districtMap[d] ? districtMap[d] / maxCount : 0
  })).sort((a, b) => b.count - a.count)

  const getColor = (intensity) => {
    const r = Math.round(255 * Math.min(1, intensity * 2))
    const g = Math.round(45 * (1 - intensity))
    return `rgba(${r}, ${g}, ${g}, ${intensity * 0.8 + 0.08})`
  }

  const topDistricts = displayDistricts.filter(d => d.count > 0).slice(0, 5)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Map size={20} className="text-primary" /> Crime Heatmap
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Geographic crime density across Karnataka</p>
        </div>
        <button onClick={load} disabled={loading}
          className="btn-ghost text-sm py-2 px-3 flex items-center gap-2 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-gray-500" />
        <select value={filterCrime} onChange={e => setFilterCrime(e.target.value)} className="input-field text-sm py-2 w-44">
          <option value="">All Crime Types</option>
          {crimeCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} className="input-field text-sm py-2 w-48">
          <option value="">All Districts</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-sm py-2 w-36" />
        <span className="text-gray-500 text-xs">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-sm py-2 w-36" />
        {(filterCrime || filterDistrict || dateFrom || dateTo) && (
          <button onClick={() => { setFilterCrime(''); setFilterDistrict(''); setDateFrom(''); setDateTo('') }}
            className="text-xs text-primary hover:underline">Clear</button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500">Crime Intensity:</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-3 rounded-full" style={{ background: 'linear-gradient(to right, rgba(20,20,20,0.5), rgba(255,45,45,0.9))' }} />
          <span className="text-xs text-gray-600">Low → High</span>
        </div>
        <span className="text-xs text-gray-600 ml-auto">
          {Object.keys(districtMap).length} districts with data
        </span>
      </div>

      {/* Heatmap Grid */}
      <div className="card">
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {displayDistricts.map((d, i) => (
            <motion.div key={d.district}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              className="rounded-xl p-3 text-center cursor-pointer transition-all relative group"
              style={{ background: getColor(d.intensity), border: `1px solid rgba(255,45,45,${d.intensity * 0.4 + 0.05})` }}>
              <div className="text-xs font-semibold text-white/90 mb-1 leading-tight">
                {d.district.split(' ').slice(0, 2).join(' ')}
              </div>
              <div className="text-lg font-bold text-white">{d.count.toLocaleString()}</div>
              <div className="text-xs text-white/50">cases</div>
              {d.intensity > 0.5 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top Districts */}
      {topDistricts.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Top Crime Districts</h3>
          <div className="space-y-3">
            {topDistricts.map((d, i) => (
              <div key={d.district} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                <span className="text-sm text-gray-300 flex-1">{d.district}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.count / maxCount) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                <span className="text-sm font-bold text-white w-12 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topDistricts.length === 0 && !loading && (
        <div className="card text-center py-12">
          <Map size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No crime data available. Add FIRs with district information to see the heatmap.</p>
        </div>
      )}
    </div>
  )
}
