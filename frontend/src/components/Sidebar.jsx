import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Bot, Search, FileText, Users, Briefcase,
  Camera, Scale, BarChart2, Map, FileBarChart, Settings,
  ChevronLeft, ChevronRight, Shield, UserCheck, AlertTriangle,
  Gavel, Fingerprint, UserCog, ShieldCheck, Network, TrendingUp,
  Brain, FileSearch, UserX, HeartPulse, FileCheck, Building2, Landmark, Database
} from 'lucide-react'
import { useState } from 'react'

const items = [
  { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard' },
  { icon: Bot,             label: 'AI Assistant',     path: '/assistant' },
  { icon: Search,          label: 'Smart Search',     path: '/search' },

  // ── Crime Management ──────────────────────────────────────────
  { icon: FileText,        label: 'FIR Management',   path: '/fir' },
  { icon: Users,           label: 'Complainants',     path: '/complainants' },
  { icon: HeartPulse,      label: 'Victims',          path: '/victims' },
  { icon: UserX,           label: 'Accused',          path: '/accused' },
  { icon: FileCheck,       label: 'Chargesheets',     path: '/chargesheets' },
  { icon: Users,           label: 'Persons',          path: '/persons' },
  { icon: Fingerprint,     label: 'Criminals',        path: '/criminals' },
  { icon: AlertTriangle,   label: 'Wanted',           path: '/wanted' },
  { icon: Briefcase,       label: 'Cases',            path: '/cases' },
  { icon: Gavel,           label: 'Charges',          path: '/charges' },
  { icon: UserCheck,       label: 'Arrests',          path: '/arrests' },
  { icon: Scale,           label: 'Convictions',      path: '/convictions' },
  { icon: Camera,          label: 'Evidence',         path: '/evidence' },

  // ── Organisation ──────────────────────────────────────────────
  { icon: ShieldCheck,     label: 'Officers',         path: '/officers' },
  { icon: Building2,       label: 'Police Units',     path: '/police-units' },
  { icon: Landmark,        label: 'Courts',           path: '/courts' },

  // ── Analytics & AI ────────────────────────────────────────────
  { icon: BarChart2,       label: 'Analytics',        path: '/analytics' },
  { icon: Map,             label: 'Crime Heatmap',    path: '/heatmap' },
  { icon: Network,         label: 'Criminal Network', path: '/network' },
  { icon: TrendingUp,      label: 'Predictive AI',    path: '/predict' },
  { icon: Brain,           label: 'Behavioral Profile', path: '/behavioral' },
  { icon: FileSearch,      label: 'AI Reports',       path: '/ai-reports' },

  // ── Admin ──────────────────────────────────────────────────────
  { icon: FileBarChart,    label: 'Reports',          path: '/reports' },
  { icon: Database,        label: 'Master Data',      path: '/master-data' },
  { icon: UserCog,         label: 'Users',            path: '/users' },
  { icon: Settings,        label: 'Settings',         path: '/settings' },
  { icon: Shield,          label: 'Admin',            path: '/admin' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-16 bottom-0 z-40 glass border-r border-white/5 flex flex-col overflow-hidden">

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

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map(({ icon: Icon, label, path }) => {
          const active = pathname === path || (path !== '/dashboard' && pathname.startsWith(path))
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

      {!collapsed && (
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 bg-green rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">System Online</span>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
