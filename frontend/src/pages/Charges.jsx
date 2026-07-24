import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Gavel } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { chargeService, caseService, criminalService } from '../services/api'

const EMPTY = { case_id: '', criminal_id: '', ipc_section: '', description: '', filed_date: '', status: 'Pending' }

export default function Charges() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [cases, setCases] = useState([])
  const [criminals, setCriminals] = useState([])
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await chargeService.getAll({ page, limit: 20, search })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load', 'error') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    caseService.getAll({ limit: 100 }).then(r => setCases(r.data.data)).catch(() => {})
    criminalService.getAll({ limit: 100 }).then(r => setCriminals(r.data.data)).catch(() => {})
  }, [])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm({ ...r, filed_date: r.filed_date?.split('T')[0] || '' }); setModal({ open: true, mode: 'edit', record: r }) }

  const handleSave = async () => {
    if (!form.case_id || !form.ipc_section) return toast('Case and IPC section required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await chargeService.create(form)
      else await chargeService.update(modal.record.id, form)
      toast('Saved'); setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await chargeService.remove(confirm.id)
      toast('Deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'case_number', label: 'Case No.', render: v => <span className="font-mono text-primary text-xs">{v}</span> },
    { key: 'criminal_name', label: 'Criminal' },
    { key: 'ipc_section', label: 'IPC Section', render: v => <span className="badge-blue">{v}</span> },
    { key: 'description', label: 'Description', render: v => <span className="text-gray-400 text-xs">{v?.slice(0, 50)}{v?.length > 50 ? '...' : ''}</span> },
    { key: 'filed_date', label: 'Filed Date', render: v => v?.split('T')[0] || '—' },
    { key: 'status', label: 'Status', render: v => <span className={v === 'Convicted' ? 'badge-red' : v === 'Dismissed' ? 'badge-green' : 'badge-yellow'}>{v}</span> },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => (
        <div className="flex gap-1">
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Gavel size={20} className="text-primary" /> Charges</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total charges</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> File Charge</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={setSearch} loading={loading} searchPlaceholder="Search IPC section, description..." />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'File Charge' : 'Edit Charge'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Case *</label>
            <select value={form.case_id || ''} onChange={e => sf('case_id', e.target.value)} className="input-field text-sm">
              <option value="">Select Case</option>
              {cases.map(c => <option key={c.id} value={c.id}>{c.case_number}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Criminal</label>
            <select value={form.criminal_id || ''} onChange={e => sf('criminal_id', e.target.value)} className="input-field text-sm">
              <option value="">Select Criminal</option>
              {criminals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">IPC Section *</label>
              <input value={form.ipc_section || ''} onChange={e => sf('ipc_section', e.target.value)} className="input-field text-sm" placeholder="e.g. IPC 302" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Filed Date</label>
              <input type="date" value={form.filed_date || ''} onChange={e => sf('filed_date', e.target.value)} className="input-field text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={form.status || 'Pending'} onChange={e => sf('status', e.target.value)} className="input-field text-sm">
              {['Pending', 'Convicted', 'Acquitted', 'Dismissed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea value={form.description || ''} onChange={e => sf('description', e.target.value)} rows={3} className="input-field text-sm resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setModal(p => ({ ...p, open: false }))} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the charge." />
    </div>
  )
}
