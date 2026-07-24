import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Eye, AlertTriangle } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { wantedService, criminalService } from '../services/api'

const PRIORITY_COLORS = { High: 'badge-red', Medium: 'badge-yellow', Low: 'badge-green' }
const EMPTY = { criminal_id: '', reward: '', declared_date: '', priority: 'Medium', last_seen: '', last_seen_date: '', status: 'Active', notes: '' }

export default function WantedCriminals() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [criminals, setCriminals] = useState([])
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [viewModal, setViewModal] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await wantedService.getAll({ page, limit: 20, search })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load', 'error') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    criminalService.getAll({ limit: 100 }).then(r => setCriminals(r.data.data)).catch(() => {})
  }, [])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => {
    setForm({ ...r, declared_date: r.declared_date?.split('T')[0] || '', last_seen_date: r.last_seen_date?.split('T')[0] || '' })
    setModal({ open: true, mode: 'edit', record: r })
  }

  const handleSave = async () => {
    if (!form.criminal_id) return toast('Criminal is required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await wantedService.create(form)
      else await wantedService.update(modal.record.id, form)
      toast('Saved successfully')
      setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await wantedService.remove(confirm.id)
      toast('Deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'criminal_name', label: 'Criminal', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'alias', label: 'Alias', render: v => v ? <span className="text-gray-400 italic">"{v}"</span> : '—' },
    { key: 'priority', label: 'Priority', render: v => <span className={PRIORITY_COLORS[v] || 'badge-gray'}>{v}</span> },
    { key: 'reward', label: 'Reward', render: v => v ? `₹${Number(v).toLocaleString()}` : '—' },
    { key: 'last_seen', label: 'Last Seen' },
    { key: 'status', label: 'Status', render: v => <span className={v === 'Active' ? 'badge-red' : 'badge-green'}>{v}</span> },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => (
        <div className="flex gap-1">
          <button onClick={() => setViewModal({ open: true, record: r })} className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-blue-400"><Eye size={14} /></button>
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-primary"><Edit2 size={14} /></button>
          <button onClick={() => setConfirm({ open: true, id: r.id })} className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-primary"><Trash2 size={14} /></button>
        </div>
      )
    }
  ]

  const sf = (name, value) => setForm(p => ({ ...p, [name]: value }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><AlertTriangle size={20} className="text-primary" /> Wanted Criminals</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} active records</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Add Wanted</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={setSearch} loading={loading} searchPlaceholder="Search criminal name..." />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Add Wanted Criminal' : 'Edit Wanted Record'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Criminal *</label>
            <select value={form.criminal_id} onChange={e => sf('criminal_id', e.target.value)} className="input-field text-sm">
              <option value="">Select Criminal</option>
              {criminals.map(c => <option key={c.id} value={c.id}>{c.name} {c.alias ? `(${c.alias})` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['Reward (₹)', 'reward', 'number'], ['Declared Date', 'declared_date', 'date'], ['Last Seen Location', 'last_seen', 'text'], ['Last Seen Date', 'last_seen_date', 'date']].map(([label, name, type]) => (
              <div key={name}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input type={type} value={form[name] || ''} onChange={e => sf(name, e.target.value)} className="input-field text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Priority</label>
              <select value={form.priority} onChange={e => sf('priority', e.target.value)} className="input-field text-sm">
                {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => sf('status', e.target.value)} className="input-field text-sm">
                {['Active', 'Captured', 'Deceased'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea value={form.notes || ''} onChange={e => sf('notes', e.target.value)} rows={2} className="input-field text-sm resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setModal(p => ({ ...p, open: false }))} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, record: null })} title="Wanted Criminal Details">
        {viewModal.record && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                {viewModal.record.criminal_name?.[0]}
              </div>
              <div>
                <div className="font-bold text-white">{viewModal.record.criminal_name}</div>
                <span className={PRIORITY_COLORS[viewModal.record.priority] || 'badge-gray'}>{viewModal.record.priority} Priority</span>
              </div>
              {viewModal.record.reward && <div className="ml-auto text-right"><div className="text-xs text-gray-500">Reward</div><div className="text-lg font-bold text-green">₹{Number(viewModal.record.reward).toLocaleString()}</div></div>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Last Seen', viewModal.record.last_seen], ['Last Seen Date', viewModal.record.last_seen_date?.split('T')[0]],
                ['Declared Date', viewModal.record.declared_date?.split('T')[0]], ['Status', viewModal.record.status]
              ].map(([k, v]) => (
                <div key={k} className="bg-white/3 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{k}</div>
                  <div className="text-sm text-white">{v || '—'}</div>
                </div>
              ))}
            </div>
            {viewModal.record.notes && <div className="bg-white/3 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Notes</div><div className="text-sm text-gray-300">{viewModal.record.notes}</div></div>}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete} loading={saving} message="This will remove the wanted record." />
    </div>
  )
}
