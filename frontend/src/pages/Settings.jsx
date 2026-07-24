import { useState } from 'react'
import { Settings as SettingsIcon, Moon, Bell, Globe, Lock, Save, Check } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Settings() {
  const toast = useToast()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')

  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState('en')
  const [notifications, setNotifications] = useState({
    newFIR: true, arrests: true, wantedAlerts: true, courtDates: false, systemAlerts: true
  })
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })

  const saveSection = async (section) => {
    setSaving(true)
    try {
      if (section === 'password') {
        if (!passwords.current || !passwords.newPass) return toast('All password fields required', 'error')
        if (passwords.newPass !== passwords.confirm) return toast('Passwords do not match', 'error')
        if (passwords.newPass.length < 6) return toast('Password must be at least 6 characters', 'error')
        await api.put(`/users/${user?.id}`, { password: passwords.newPass })
        setPasswords({ current: '', newPass: '', confirm: '' })
      }
      setSaved(section)
      toast('Settings saved successfully')
      setTimeout(() => setSaved(''), 2000)
    } catch (err) {
      toast(err.response?.data?.error || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  const Section = ({ id, title, icon: Icon, children }) => (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
        <Icon size={16} className="text-primary" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {saved === id && <span className="ml-auto flex items-center gap-1 text-xs text-green"><Check size={12} /> Saved</span>}
      </div>
      {children}
      <div className="flex justify-end pt-2">
        <button onClick={() => saveSection(id)} disabled={saving}
          className="btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-50">
          <Save size={14} /> Save
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon size={20} className="text-primary" /> Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your preferences</p>
      </div>

      {/* Theme */}
      <Section id="theme" title="Theme" icon={Moon}>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'dark', label: 'Dark', bg: '#0B0B0B', border: '#333' },
            { key: 'darker', label: 'Darker', bg: '#050505', border: '#222' },
            { key: 'midnight', label: 'Midnight', bg: '#0a0a1a', border: '#1a1a3a' },
          ].map(t => (
            <button key={t.key} onClick={() => setTheme(t.key)}
              className={`p-4 rounded-xl border-2 transition-all ${theme === t.key ? 'border-primary' : 'border-white/10 hover:border-white/20'}`}
              style={{ background: t.bg }}>
              <div className="w-full h-8 rounded mb-2" style={{ background: t.border }} />
              <span className="text-xs text-gray-300">{t.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section id="notifications" title="Notifications" icon={Bell}>
        <div className="space-y-3">
          {[
            ['newFIR', 'New FIR Filed'],
            ['arrests', 'Arrest Updates'],
            ['wantedAlerts', 'Wanted Criminal Alerts'],
            ['courtDates', 'Court Date Reminders'],
            ['systemAlerts', 'System Alerts'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-gray-300">{label}</span>
              <button onClick={() => setNotifications(p => ({ ...p, [key]: !p[key] }))}
                className={`w-10 h-5 rounded-full transition-all relative ${notifications[key] ? 'bg-primary' : 'bg-white/10'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${notifications[key] ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Language */}
      <Section id="language" title="Language" icon={Globe}>
        <div className="grid grid-cols-2 gap-3">
          {[['en', 'English'], ['kn', 'ಕನ್ನಡ (Kannada)'], ['hi', 'हिंदी (Hindi)'], ['ta', 'தமிழ் (Tamil)']].map(([code, name]) => (
            <button key={code} onClick={() => setLanguage(code)}
              className={`p-3 rounded-lg border text-sm text-left transition-all ${language === code ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
              {name}
            </button>
          ))}
        </div>
      </Section>

      {/* Password */}
      <Section id="password" title="Change Password" icon={Lock}>
        <div className="space-y-3">
          {[
            ['current', 'Current Password'],
            ['newPass', 'New Password'],
            ['confirm', 'Confirm New Password'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input type="password" value={passwords[key]}
                onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                className="input-field text-sm" placeholder="••••••••" />
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
