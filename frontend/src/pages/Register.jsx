import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Zap, Shield, Eye, EyeOff, Lock, User, BadgeCheck } from 'lucide-react'

const roles = ['Admin', 'Officer', 'Investigator']

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'Officer', badge: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setSuccess('Account created! Redirecting to login...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Investi<span className="text-primary">Q</span></h1>
          <p className="text-gray-500 text-sm mt-1">Create Officer Account</p>
        </div>

        <div className="card border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={16} className="text-primary" />
            <span className="text-sm font-medium text-gray-400">New Officer Registration</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. SI Ramesh Kumar" className="input-field pl-10" required />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="Choose a username" className="input-field pl-10" required />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Badge ID</label>
              <div className="relative">
                <BadgeCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))}
                  placeholder="e.g. KSP-201" className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="input-field">
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Create a password" className="input-field pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">{success}</p>}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-xs text-gray-600">Already have an account? </span>
            <Link to="/login" className="text-xs text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
