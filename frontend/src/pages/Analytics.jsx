import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import { TrendingUp, Users, Clock, RefreshCw, MapPin, Loader2 } from 'lucide-react'
import { dashboardService } from '../services/api'
import { monthlyData, crimeCategoryData, districtData } from '../utils/mockData'

const COLORS = ['#FF2D2D', '#E53935', '#FF6B6B', '#FF8A80', '#00D26A', '#42A5F5', '#AB47BC', '#FFB74D']

export default function Analytics() {
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardService.getAnalytics(), dashboardService.getStats()])
      .then(([a, s]) => { setData(a.data.data); setStats(s.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  )

  const a = data || {}
  const s = stats || {}

  const monthlyChart = a.monthly?.length ? a.monthly.map(r => ({ month: r.month, firs: parseInt(r.firs) })) : monthlyData.map(r => ({ month: r.month, firs: r.cases }))
  const categoryChart = a.byCategory?.length
    ? a.byCategory.map((r, i) => ({ name: r.category, value: parseInt(r.count), color: COLORS[i % COLORS.length] }))
    : crimeCategoryData
  const districtChart = a.byDistrict?.length
    ? a.byDistrict.slice(0, 6).map(r => ({ district: r.district?.split(' ')[0] || r.district, cases: parseInt(r.cases) }))
    : districtData
  const arrestChart = a.arrests?.length ? a.arrests.map(r => ({ month: r.month, count: parseInt(r.count) })) : []
  const convictionChart = a.convictions?.length ? a.convictions.map(r => ({ month: r.month, count: parseInt(r.count) })) : []

  const heatmapData = a.byDistrict?.slice(0, 10).map(r => ({
    district: r.district, value: parseInt(r.cases), cases: parseInt(r.cases)
  })) || []
  const maxCases = Math.max(...heatmapData.map(d => d.cases), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Crime Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Comprehensive statistical analysis across Karnataka</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total FIRs" value={s.totalFIRs ?? 0} change={`${s.openFIRs ?? 0} open`} color="#FF2D2D" />
        <StatCard icon={RefreshCw} label="Total Cases" value={s.totalCases ?? 0} change={`${s.closedCases ?? 0} closed`} color="#00D26A" />
        <StatCard icon={Clock} label="Total Arrests" value={s.totalArrests ?? 0} change="recorded" color="#42A5F5" />
        <StatCard icon={Users} label="Wanted Criminals" value={s.wantedCriminals ?? 0} change="active" color="#FFB74D" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Monthly FIR Trend" subtitle="FIRs filed per month">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Bar dataKey="firs" fill="#FF2D2D" radius={[4, 4, 0, 0]} name="FIRs" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Crime Categories" subtitle="Percentage distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryChart} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                {categoryChart.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {arrestChart.length > 0 && (
          <ChartCard title="Monthly Arrests" subtitle="Arrests per month">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={arrestChart}>
                <defs>
                  <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#42A5F5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#42A5F5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#42A5F5" fill="url(#ga)" strokeWidth={2} name="Arrests" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {convictionChart.length > 0 && (
          <ChartCard title="Monthly Convictions" subtitle="Convictions per month">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={convictionChart}>
                <defs>
                  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D26A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D26A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#00D26A" fill="url(#gv)" strokeWidth={2} name="Convictions" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* District Breakdown */}
      <ChartCard title="District Breakdown" subtitle="Cases by district – Top 6">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={districtChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="district" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
            <Bar dataKey="cases" fill="#FF2D2D" radius={[4, 4, 0, 0]} name="Total Cases" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Crime Heatmap */}
      {heatmapData.length > 0 && (
        <ChartCard title="Crime Heatmap" subtitle="Intensity by district">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={14} className="text-primary" />
            <span className="text-xs text-gray-500">Darker = Higher crime density</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-16 h-2 rounded-full" style={{ background: 'linear-gradient(to right, #1a0000, #FF2D2D)' }} />
              <span className="text-xs text-gray-600">Low → High</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {heatmapData.map(d => (
              <motion.div key={d.district}
                whileHover={{ scale: 1.05 }}
                className="rounded-lg p-3 text-center cursor-pointer transition-all"
                style={{ background: `rgba(255,45,45,${(d.cases / maxCases) * 0.8 + 0.05})` }}>
                <div className="text-xs font-semibold text-white mb-1">{d.district?.split(' ')[0]}</div>
                <div className="text-lg font-bold text-white">{d.cases.toLocaleString()}</div>
                <div className="text-xs text-white/60">cases</div>
              </motion.div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  )
}
