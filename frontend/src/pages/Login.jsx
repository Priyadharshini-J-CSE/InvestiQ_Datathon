import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Zap, Shield, Eye, EyeOff, Lock, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const demoUsers = [
  { role: 'Admin', name: 'SP Rajesh Kumar', username: 'admin', password: 'admin123' },
  { role: 'Officer', name: 'SI Suresh Gowda', username: 'officer', password: 'officer123' },
  { role: 'Investigator', name: 'PI Mahesh Nair', username: 'investigator', password: 'inv123' },
]

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 800))
    const user = demoUsers.find(u => u.username === form.username && u.password === form.password)
    if (user) {
      login({ name: user.name, role: user.role, username: user.username }, 'mock-jwt-token-' + Date.now())
      navigate('/dashboard')
    } else {
      setError('Invalid credentials. Try admin/admin123')
    }
    setLoading(false)
  }

  const quickLogin = (u) => {
    setForm({ username: u.username, password: u.password })
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Inverti<span className="text-primary">Q</span></h1>
          <p className="text-gray-500 text-sm mt-1">Karnataka State Police – Secure Access</p>
        </div>

        <div className="card border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={16} className="text-primary" />
            <span className="text-sm font-medium text-gray-400">Authorized Personnel Only</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Username / Badge ID</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="Enter username" className="input-field pl-10" required />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter password" className="input-field pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-xs text-gray-600 mb-3">Quick Demo Access:</p>
            <div className="grid grid-cols-3 gap-2">
              {demoUsers.map(u => (
                <button key={u.role} onClick={() => quickLogin(u)}
                  className="text-xs bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 text-gray-400 hover:text-primary px-2 py-2 rounded-lg transition-all text-center">
                  <div className="font-medium">{u.role}</div>
                  <div className="text-gray-600">{u.username}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
