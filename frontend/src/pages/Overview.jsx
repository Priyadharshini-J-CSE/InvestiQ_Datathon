import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Play, Shield, Brain, TrendingUp, Zap, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { stats, monthlyData, recentActivity, criminals } from '../utils/mockData'

const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } }

export default function Overview() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-primary/3 rounded-full blur-2xl" />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div {...fadeUp} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
            <Shield size={14} className="text-primary" />
            <span className="text-sm text-primary font-medium">Karnataka State Police – Classified System</span>
          </motion.div>

          <motion.h1 {...fadeUp} transition={{ delay: 0.1, duration: 0.7 }}
            className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Transform Crime Data<br />
            into <span className="text-primary" style={{ textShadow: '0 0 40px rgba(255,45,45,0.5)' }}>Actionable</span><br />
            Intelligence
          </motion.h1>

          <motion.p {...fadeUp} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            AI-powered Conversational Crime Intelligence Platform for Karnataka Police.
            Analyze FIRs, detect patterns, and solve cases faster.
          </motion.p>

          <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/dashboard" className="btn-primary flex items-center gap-2 text-base px-8 py-3">
              Get Started <ArrowRight size={18} />
            </Link>
            <button className="btn-ghost flex items-center gap-2 text-base px-8 py-3">
              <Play size={16} /> Watch Demo
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div {...fadeUp} transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-16">
            {[
              { label: 'FIRs Processed', value: '12,847+' },
              { label: 'AI Accuracy', value: '94.7%' },
              { label: 'Police Stations', value: '340' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-white mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Preview + Chart */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* AI Assistant Preview */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="card border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <Brain size={16} className="text-primary" />
              </div>
              <span className="font-semibold text-white">AI Investigation Assistant</span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green rounded-full animate-pulse" />
                <span className="text-xs text-green">Online</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300">
                Show me all theft cases in Bengaluru Urban this month
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-gray-300">
                <div className="text-primary font-medium mb-1">InvertiQ AI</div>
                Found 234 theft cases in Bengaluru Urban (Nov 2024). Top hotspots: Koramangala (42), Whitefield (38), Indiranagar (31). Confidence: 96.2%
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300">
                Identify repeat offenders in these cases
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-gray-300">
                <div className="text-primary font-medium mb-1">InvertiQ AI</div>
                Detected 12 repeat offenders. Ravi Kumar (CRM-0023) appears in 8 cases. Network analysis suggests organized gang activity.
              </div>
            </div>
            <Link to="/assistant" className="btn-primary w-full mt-4 text-sm flex items-center justify-center gap-2">
              Open AI Assistant <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Crime Trend Chart */}
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="card border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">Crime Trends 2024</h3>
                <p className="text-xs text-gray-500">Monthly case statistics</p>
              </div>
              <TrendingUp size={18} className="text-primary" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF2D2D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF2D2D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D26A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D26A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                <Area type="monotone" dataKey="cases" stroke="#FF2D2D" fill="url(#cg)" strokeWidth={2} name="Total Cases" />
                <Area type="monotone" dataKey="solved" stroke="#00D26A" fill="url(#sg)" strokeWidth={2} name="Solved" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </section>

      {/* Wanted Criminal + Recent Activity */}
      <section className="py-10 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Wanted Criminal */}
          <motion.div {...fadeUp} className="card border border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-primary" />
              <span className="font-semibold text-white">Most Wanted</span>
              <span className="badge-red ml-auto">WANTED</span>
            </div>
            {criminals.filter(c => c.status === 'Wanted').slice(0, 3).map(c => (
              <div key={c.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                <img src={c.photo} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.category} • {c.district}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">{c.riskScore}</div>
                  <div className="text-xs text-gray-600">Risk</div>
                </div>
              </div>
            ))}
            <Link to="/criminals" className="text-xs text-primary hover:underline mt-2 block text-center">
              View all {stats.wantedCriminals} wanted criminals →
            </Link>
          </motion.div>

          {/* Recent Activity */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="md:col-span-2 card border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-primary" />
              <span className="font-semibold text-white">Recent Activity</span>
            </div>
            <div className="space-y-3">
              {recentActivity.map(a => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    a.severity === 'high' ? 'bg-primary' : a.severity === 'medium' ? 'bg-yellow-400' : 'bg-green'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{a.text}</p>
                    <span className="text-xs text-gray-600">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
