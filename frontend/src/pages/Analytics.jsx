import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts'
import StatCard from '../components/StatCard'
import ChartCard from '../components/ChartCard'
import { TrendingUp, Users, Clock, RefreshCw, MapPin } from 'lucide-react'
import { stats, monthlyData, crimeCategoryData, districtData } from '../utils/mockData'

const heatmapData = [
  { district: 'Bengaluru Urban', value: 95, cases: 3240 },
  { district: 'Mysuru', value: 65, cases: 1120 },
  { district: 'Mangaluru', value: 58, cases: 980 },
  { district: 'Hubballi', value: 52, cases: 870 },
  { district: 'Belagavi', value: 45, cases: 760 },
  { district: 'Kalaburagi', value: 40, cases: 690 },
  { district: 'Ballari', value: 38, cases: 640 },
  { district: 'Shivamogga', value: 35, cases: 590 },
  { district: 'Tumakuru', value: 30, cases: 510 },
  { district: 'Vijayapura', value: 28, cases: 470 },
]

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Crime Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Comprehensive statistical analysis across Karnataka</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Cases" value={stats.totalFIRs} change="+12% YoY" color="#FF2D2D" />
        <StatCard icon={RefreshCw} label="Solved Rate" value="60.2%" change="+3.1%" color="#00D26A" />
        <StatCard icon={Clock} label="Avg Resolution" value="47 days" change="-8 days" color="#42A5F5" />
        <StatCard icon={Users} label="Repeat Offenders" value="1,234" change="+89" color="#FFB74D" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Monthly Cases 2024" subtitle="Filed vs Solved vs Pending">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#888' }} />
              <Bar dataKey="cases" fill="#FF2D2D" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="solved" fill="#00D26A" radius={[4, 4, 0, 0]} name="Solved" />
              <Bar dataKey="pending" fill="#FFB74D" radius={[4, 4, 0, 0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Crime Categories" subtitle="Percentage distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={crimeCategoryData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                {crimeCategoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* District Breakdown */}
      <ChartCard title="District Breakdown" subtitle="Cases by district – Top 6">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={districtData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="district" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#888' }} />
            <Bar dataKey="cases" fill="#FF2D2D" radius={[4, 4, 0, 0]} name="Total Cases" />
            <Bar dataKey="solved" fill="#00D26A" radius={[4, 4, 0, 0]} name="Solved" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Crime Heatmap */}
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
              style={{ background: `rgba(255,45,45,${d.value / 100 * 0.8 + 0.05})` }}>
              <div className="text-xs font-semibold text-white mb-1">{d.district.split(' ')[0]}</div>
              <div className="text-lg font-bold text-white">{d.cases.toLocaleString()}</div>
              <div className="text-xs text-white/60">cases</div>
            </motion.div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
