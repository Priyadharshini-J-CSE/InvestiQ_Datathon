import { useState, useEffect, useCallback } from 'react'
import { Shield, Activity, FileText, MapPin, Download, Plus, Trash2, RefreshCw } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { adminService } from '../services/api'

const TABS = [
  { key: 'audit', label: 'Audit Logs', icon: FileText },
  { key: 'activity', label: 'Activity Logs', icon: Activity },
  { key: 'stations', label: 'Police Stations', icon: MapPin },
]

export default function Admin() {
  const toast = useToast()
  const [tab, setTab] = useState('audit')
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [stationModal, setStationModal] = useState(false)
  const [stationForm, setStationForm] = useState({ name: '', district: '', address: '', phone: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let res
      if (tab === 'audit') res = await adminService.getAuditLogs({ page, limit: 20 })
      else if (tab === 'activity') res = await adminService.getActivityLogs({ page, limit: 20 })
      else res = await adminService.getStations({ search })
      setData(res.data.data || []); setTotal(res.data.total || (res.data.data?.length || 0))
      setPages(res.data.pages || 1)
    } catch { toast('Failed to load', 'error') }
    finally { setLoading(false) }
  }, [tab, page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [tab])

  const handleCreateStation = async () => {
    if (!stationForm.name) return toast('Station name required', 'error')
    setSaving(true)
    try {
      await adminService.createStation(stationForm)
      toast('Station created'); setStationModal(false)
      setStationForm({ name: '', district: '', address: '', phone: '' }); load()
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const exportLogs = () => {
    if (!data.length) return toast('No data to export', 'error')
    const csv = [Object.keys(data[0]).join(','), ...data.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${tab}_logs.csv`; a.click()
    URL.revokeObjectURL(url)
    toast('Exported successfully')
  }

  const auditCols = [
    { key: 'user_name', label: 'User' },
    { key: 'action', label: 'Action' },
    { key: 'table_name', label: 'Table' },
    { key: 'record_id', label: 'Record ID' },
    { key: 'ip_address', label: 'IP' },
    { key: 'created_at', label: 'Time', render: v => v ? new Date(v).toLocaleString('en-IN') : '—' },
  ]

  const activityCols = [
    { key: 'user_name', label: 'User' },
    { key: 'description', label: 'Description' },
    { key: 'module', label: 'Module', render: v => <span className="badge-blue">{v}</span> },
    { key: 'created_at', label: 'Time', render: v => v ? new Date(v).toLocaleString('en-IN') : '—' },
  ]

  const stationCols = [
    { key: 'name', label: 'Station Name', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'district', label: 'District' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
    { key: 'created_at', label: 'Created', render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
  ]

  const cols = tab === 'audit' ? auditCols : tab === 'activity' ? activityCols : stationCols

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield size={20} className="text-primary" /> Admin Panel
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">System administration and logs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost text-sm py-2 px-3 flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={exportLogs} className="btn-ghost text-sm py-2 px-3 flex items-center gap-2">
            <Download size={14} /> Export
          </button>
          {tab === 'stations' && (
            <button onClick={() => setStationModal(true)} className="btn-primary text-sm py-2 flex items-center gap-2">
              <Plus size={14} /> Add Station
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: total, color: '#FF2D2D' },
          { label: 'Current Page', value: `${page} / ${pages}`, color: '#42A5F5' },
          { label: 'Showing', value: Math.min(20, data.length), color: '#00D26A' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <DataTable
        columns={cols} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={tab === 'stations' ? setSearch : undefined}
        loading={loading} searchPlaceholder="Search stations..."
        emptyText={`No ${tab} records found`}
      />

      {/* Add Station Modal */}
      <Modal open={stationModal} onClose={() => setStationModal(false)} title="Add Police Station">
        <div className="space-y-4">
          {[['Station Name *', 'name'], ['District', 'district'], ['Address', 'address'], ['Phone', 'phone']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input value={stationForm[key] || ''} onChange={e => setStationForm(p => ({ ...p, [key]: e.target.value }))}
                className="input-field text-sm" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setStationModal(false)} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleCreateStation} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Station'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
