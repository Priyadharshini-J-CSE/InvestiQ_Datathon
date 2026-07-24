import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Eye, FileCheck } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { chargesheetService, firService } from '../services/api'

const STATUSES = ['Draft', 'Filed', 'Accepted', 'Rejected', 'Supplementary']
const TYPES = ['Final Report', 'Charge Sheet', 'Supplementary Charge Sheet', 'Closure Report']
const EMPTY = { fir_id: '', chargesheet_date: '', chargesheet_type: '', filed_by: '', status: 'Draft' }

const STATUS_COLORS = {
  Filed: 'badge-green', Draft: 'badge-gray', Accepted: 'badge-blue',
  Rejected: 'badge-red', Supplementary: 'badge-yellow'
}

export default function Chargesheets() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [firs, setFirs] = useState([])
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [viewModal, setViewModal] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await chargesheetService.getAll({ page, limit: 20, search, status: filterStatus })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load chargesheets', 'error') }
    finally { setLoading(false) }
  }, [page, search, filterStatus])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    firService.getAll({ limit: 200 }).then(r => setFirs(r.data.data || [])).catch(() => {})
  }, [])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => {
    setForm({ ...r, chargesheet_date: r.chargesheet_date?.split('T')[0] || '' })
    setModal({ open: true, mode: 'edit', record: r })
  }

  const handleSave = async () => {
    if (!form.fir_id) return toast('FIR is required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await chargesheetService.create(form)
      else await chargesheetService.update(modal.record.id, form)
      toast(`Chargesheet ${modal.mode === 'add' ? 'created' : 'updated'}`)
      setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await chargesheetService.remove(confirm.id)
      toast('Chargesheet deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'fir_number', label: 'FIR', render: v => <span className="font-mono text-primary text-xs">{v || '—'}</span> },
    { key: 'chargesheet_date', label: 'Date', render: v => v?.split('T')[0] || '—' },
    { key: 'chargesheet_type', label: 'Type' },
    { key: 'filed_by', label: 'Filed By' },
    { key: 'status', label: 'Status', render: v => <span className={STATUS_COLORS[v] || 'badge-gray'}>{v}</span> },
    { key: 'created_by_name', label: 'Created By' },
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

  const sf = (n, v) => setForm(p => ({ ...p, [n]: v }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><FileCheck size={20} className="text-primary" /> Chargesheets</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total records</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> New Chargesheet</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={v => { setSearch(v); setPage(1) }} loading={loading}
        searchPlaceholder="Search FIR number, filed by..."
        filters={
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-36">
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'New Chargesheet' : 'Edit Chargesheet'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">FIR *</label>
            <select value={form.fir_id || ''} onChange={e => sf('fir_id', e.target.value)} className="input-field text-sm">
              <option value="">Select FIR</option>
              {firs.map(f => <option key={f.id} value={f.id}>{f.fir_number} — {f.crime_type || ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date</label>
              <input type="date" value={form.chargesheet_date || ''} onChange={e => sf('chargesheet_date', e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status || 'Draft'} onChange={e => sf('status', e.target.value)} className="input-field text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select value={form.chargesheet_type || ''} onChange={e => sf('chargesheet_type', e.target.value)} className="input-field text-sm">
                <option value="">Select Type</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Filed By</label>
              <input value={form.filed_by || ''} onChange={e => sf('filed_by', e.target.value)} className="input-field text-sm" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setModal(p => ({ ...p, open: false }))} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Saving...' : modal.mode === 'add' ? 'Create' : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, record: null })} title="Chargesheet Details">
        {viewModal.record && (
          <div className="grid grid-cols-2 gap-3">
            {[['FIR Number', viewModal.record.fir_number], ['Date', viewModal.record.chargesheet_date?.split('T')[0]],
              ['Type', viewModal.record.chargesheet_type], ['Filed By', viewModal.record.filed_by],
              ['Status', viewModal.record.status], ['Created By', viewModal.record.created_by_name],
            ].map(([k, v]) => (
              <div key={k} className="bg-white/3 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">{k}</div>
                <div className="text-sm text-white">{v || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the chargesheet." />
    </div>
  )
}
