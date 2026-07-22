import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, Search, User, Zap, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { label: 'Overview', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'AI Assistant', path: '/assistant' },
  { label: 'Smart Search', path: '/search' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Features', path: '/features' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-glow">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">Investi<span className="text-primary">Q</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === link.path ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            onClick={() => setNotifOpen(!notifOpen)}>
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <User size={16} className="text-primary" />
              </div>
              <span className="hidden md:block text-sm text-gray-300">{user?.name || 'Officer'}</span>
              <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400 transition-all">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-4">Login</Link>
          )}

          <button className="md:hidden p-2 rounded-lg hover:bg-white/5 text-gray-400" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass border-t border-white/5 px-4 py-3 flex flex-col gap-1">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname === link.path ? 'text-primary bg-primary/10' : 'text-gray-400'
              }`}>
              {link.label}
            </Link>
          ))}
        </motion.div>
      )}
    </nav>
  )
}
