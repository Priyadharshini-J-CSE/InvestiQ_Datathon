import { useState, useEffect } from 'react'
import { FileBarChart, Download, FileText, Users, Gavel, Scale, Calendar, Loader2 } from 'lucide-react'
import ChartCard from '../components/ChartCard'
import { useToast } from '../components/Toast'
import { firService, criminalService, chargeService, convictionService, arrestService } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const REPORT_TYPES = [
  { key: 'fir', label: 'FIR Report', icon: FileText, color: '#FF2D2D', service: firService },
  { key: 'criminal', label: 'Criminal Report', icon: Users, color: '#E53935', service: criminalService },
  { key: 'charge', label: 'Charges Report', icon: Gavel, color: '#FF6B6B', service: chargeService },
  { key: 'conviction', label: 'Conviction Report', icon: Scale, color: '#00D26A', service: convictionService },
  { key: 'arrest', label: 'Arrest Report', icon: Calendar, color: '#42A5F5', service: arrestService },
]

function exportCSV(data, filename) {
  if (!data.length) return
  const keys = Object.keys(data[0])
  const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${(row[k] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const toast = useToast()
  const [activeType, setActiveType] = useState('fir')
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [chartData, setChartData] = useState([])

  const active = REPORT_TYPES.find(r => r.key === activeType)

  const load = async () => {
    setLoading(true)
    try {
      const res = await active.service.getAll({ limit: 500 })
      const rows = res.data.data || []
      setData(rows)
      setTotal(res.data.total || rows.length)
      // Build monthly chart
      const monthly = {}
      rows.forEach(r => {
        const d = r.date || r.arrest_date || r.conviction_date || r.filed_date || r.created_at
        if (d) {
          const m = new Date(d).toLocaleString('default', { month: 'short' })
          monthly[m] = (monthly[m] || 0) + 1
        }
      })
      setChartData(Object.entries(monthly).map(([month, count]) => ({ month, count })))
    } catch { toast('Failed to load report data', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [activeType])

  const filtered = data.filter(r => {
    if (!dateFrom && !dateTo) return true
    const d = r.date || r.arrest_date || r.conviction_date || r.filed_date || r.created_at
    if (!d) return true
    const dt = new Date(d)
    if (dateFrom && dt < new Date(dateFrom)) return false
    if (dateTo && dt > new Date(dateTo)) return false
    return true
  })

  const handleExportCSV = () => {
    if (!filtered.length) return toast('No data to export', 'error')
    exportCSV(filtered, `${activeType}_report_${Date.now()}.csv`)
    toast('CSV exported successfully')
  }

  const handleExportJSON = () => {
    if (!filtered.length) return toast('No data to export', 'error')
    exportJSON(filtered, `${activeType}_report_${Date.now()}.json`)
    toast('JSON exported successfully')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileBarChart size={20} className="text-primary" /> Reports
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Generate and export reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
            <Download size={14} /> CSV
          </button>
          <button onClick={handleExportJSON} className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
            <Download size={14} /> JSON
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {REPORT_TYPES.map(({ key, label, icon: Icon, color }) => (
          <button key={key} onClick={() => setActiveType(key)}
            className={`card p-4 text-left transition-all ${activeType === key ? 'border-primary/40 bg-primary/5' : 'hover:border-white/10'}`}>
            <Icon size={18} style={{ color }} className="mb-2" />
            <div className="text-sm font-medium text-white">{label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-4">
        <span className="text-sm text-gray-400">Filter by date:</span>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-sm py-2 w-40" />
          <span className="text-gray-500 text-sm">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-sm py-2 w-40" />
        </div>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} of {total} records</span>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <ChartCard title={`${active.label} – Monthly Trend`} subtitle="Records per month">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Bar dataKey="count" fill={active.color} radius={[4, 4, 0, 0]} name="Records" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Data Table */}
      <div className="card border border-white/5 p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-sm font-medium text-white">{active.label} Data</span>
          {loading && <Loader2 size={16} className="animate-spin text-primary" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {filtered[0] && Object.keys(filtered[0]).slice(0, 8).map(k => (
                  <th key={k} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {k.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <Loader2 size={24} className="animate-spin text-primary mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-500">No records found</td></tr>
              ) : filtered.slice(0, 50).map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  {Object.keys(row).slice(0, 8).map(k => (
                    <td key={k} className="px-4 py-3 text-gray-300 whitespace-nowrap text-xs">
                      {String(row[k] ?? '—').slice(0, 40)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 50 && (
          <div className="px-4 py-3 border-t border-white/5 text-xs text-gray-500">
            Showing first 50 of {filtered.length} records. Export to see all.
          </div>
        )}
      </div>
    </div>
  )
}
