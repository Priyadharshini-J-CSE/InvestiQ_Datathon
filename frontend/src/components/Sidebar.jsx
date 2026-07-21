import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Bot, Search, FileText, Users, Briefcase,
  Camera, Scale, BarChart2, Map, FileBarChart, Settings,
  ChevronLeft, ChevronRight, Zap, Shield
} from 'lucide-react'
import { useState } from 'react'

const items = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Bot, label: 'AI Assistant', path: '/assistant' },
  { icon: Search, label: 'Smart Search', path: '/search' },
  { icon: FileText, label: 'FIR Management', path: '/fir' },
  { icon: Users, label: 'Criminal Records', path: '/criminals' },
  { icon: Briefcase, label: 'Investigations', path: '/investigations' },
  { icon: Camera, label: 'Evidence', path: '/evidence' },
  { icon: Scale, label: 'Court Cases', path: '/court' },
  { icon: BarChart2, label: 'Crime Analytics', path: '/analytics' },
  { icon: Map, label: 'Crime Heatmap', path: '/heatmap' },
  { icon: FileBarChart, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-16 bottom-0 z-40 glass border-r border-white/5 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Karnataka Police</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all ml-auto">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map(({ icon: Icon, label, path }) => {
          const active = pathname === path
          return (
            <Link key={path} to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                active ? 'bg-primary/10 border border-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              <Icon size={18} className={active ? 'text-primary' : 'text-gray-400 group-hover:text-white'} />
              {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 bg-green rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">AI System Online</span>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
