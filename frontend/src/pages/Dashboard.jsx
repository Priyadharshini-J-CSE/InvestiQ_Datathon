import { motion } from 'framer-motion'
import {
  FileText, AlertCircle, Clock, CheckCircle, Users, Calendar, Camera, Scale,
  TrendingUp, Activity
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import Timeline from '../components/Timeline'
import { stats, monthlyData, crimeCategoryData, districtData, recentActivity } from '../utils/mockData'

export default function Dashboard() {
  const statCards = [
    { icon: FileText, label: 'Total FIRs', value: stats.totalFIRs, change: '+43 today', color: '#FF2D2D' },
    { icon: Activity, label: 'Active Cases', value: stats.activeCases, change: '+12%', color: '#FF6B6B' },
    { icon: Clock, label: 'Pending Cases', value: stats.pendingCases, change: '-5%', changeType: 'down', color: '#FFB74D' },
    { icon: CheckCircle, label: 'Closed Cases', value: stats.closedCases, change: '+8%', color: '#00D26A' },
    { icon: Users, label: 'Wanted Criminals', value: stats.wantedCriminals, change: '+3', color: '#EF5350' },
    { icon: Calendar, label: "Today's FIRs", value: stats.todayFIRs, change: 'Live', color: '#42A5F5' },
    { icon: Camera, label: 'Evidence Items', value: stats.evidence, change: '+127', color: '#AB47BC' },
    { icon: Scale, label: 'Court Hearings', value: stats.hearings, change: 'This week', color: '#26A69A' },
  ]

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
        <ChartCard title="Monthly Case Trends" subtitle="Cases filed vs solved" className="md:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF2D2D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF2D2D" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D26A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00D26A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#888' }} />
              <Area type="monotone" dataKey="cases" stroke="#FF2D2D" fill="url(#gc)" strokeWidth={2} name="Total Cases" />
              <Area type="monotone" dataKey="solved" stroke="#00D26A" fill="url(#gs)" strokeWidth={2} name="Solved" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Crime Categories" subtitle="Distribution by type">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={crimeCategoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" paddingAngle={3}>
                {crimeCategoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {crimeCategoryData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.name} ({d.value}%)
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-3 gap-6">
        <ChartCard title="District Comparison" subtitle="Top 6 districts by case count" className="md:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={districtData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="district" type="category" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Bar dataKey="cases" fill="#FF2D2D" radius={[0, 4, 4, 0]} name="Total Cases" />
              <Bar dataKey="solved" fill="#00D26A" radius={[0, 4, 4, 0]} name="Solved" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Recent Activity" subtitle="Live updates">
          <Timeline activities={recentActivity.slice(0, 5)} />
        </ChartCard>
      </div>
    </div>
  )
}
