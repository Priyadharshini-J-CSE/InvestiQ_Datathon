import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, AlertCircle, Clock, CheckCircle, Users, Calendar, Camera, Scale,
  TrendingUp, Activity, Loader2
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import Timeline from '../components/Timeline'
import { dashboardService } from '../services/api'
import { monthlyData, crimeCategoryData, districtData } from '../utils/mockData'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardService.getStats(), dashboardService.getAnalytics()])
      .then(([s, a]) => { setStats(s.data.data); setAnalytics(a.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  )

  const s = stats || {}
  const a = analytics || {}

  const statCards = [
    { icon: FileText, label: 'Total FIRs', value: s.totalFIRs ?? 0, change: `${s.openFIRs ?? 0} open`, color: '#FF2D2D' },
    { icon: Activity, label: 'Active Cases', value: s.openCases ?? 0, change: `${s.totalCases ?? 0} total`, color: '#FF6B6B' },
    { icon: Clock, label: 'Closed Cases', value: s.closedCases ?? 0, change: 'resolved', color: '#FFB74D' },
    { icon: CheckCircle, label: 'Convictions', value: s.totalConvictions ?? 0, change: 'total', color: '#00D26A' },
    { icon: Users, label: 'Wanted Criminals', value: s.wantedCriminals ?? 0, change: 'active', color: '#EF5350' },
    { icon: Calendar, label: 'Total Arrests', value: s.totalArrests ?? 0, change: 'recorded', color: '#42A5F5' },
    { icon: Camera, label: 'Active Officers', value: s.activeOfficers ?? 0, change: 'on duty', color: '#AB47BC' },
    { icon: Scale, label: 'Police Stations', value: s.policeStations ?? 0, change: 'statewide', color: '#26A69A' },
  ]

  const monthlyChart = a.monthly?.length ? a.monthly.map(r => ({ month: r.month, cases: parseInt(r.firs) })) : monthlyData
  const categoryChart = a.byCategory?.length
    ? a.byCategory.map((r, i) => ({ name: r.category, value: parseInt(r.count), color: ['#FF2D2D','#E53935','#FF6B6B','#FF8A80','#00D26A','#42A5F5','#AB47BC','#444'][i] }))
    : crimeCategoryData
  const districtChart = a.byDistrict?.length
    ? a.byDistrict.slice(0, 6).map(r => ({ district: r.district?.split(' ')[0], cases: parseInt(r.cases) }))
    : districtData

  const recentActivity = s.recentActivity || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Command Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Karnataka State Police – Real-time Intelligence Overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.05} />)}
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-3 gap-6">
        <ChartCard title="Monthly FIR Trends" subtitle="FIRs filed per month" className="md:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyChart}>
              <defs>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF2D2D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF2D2D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Area type="monotone" dataKey="cases" stroke="#FF2D2D" fill="url(#gc)" strokeWidth={2} name="FIRs" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Crime Categories" subtitle="Distribution by type">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryChart} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" paddingAngle={3}>
                {categoryChart.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {categoryChart.slice(0, 6).map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-3 gap-6">
        <ChartCard title="District Comparison" subtitle="Top districts by case count" className="md:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={districtChart} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="district" type="category" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Bar dataKey="cases" fill="#FF2D2D" radius={[0, 4, 4, 0]} name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Recent Activity" subtitle="Live updates">
          {recentActivity.length > 0 ? (
            <Timeline activities={recentActivity.slice(0, 5).map(a => ({
              id: a.id, text: a.description, time: new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              type: a.module?.toLowerCase() || 'info', severity: 'medium'
            }))} />
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">No recent activity</div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
