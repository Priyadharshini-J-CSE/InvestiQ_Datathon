import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, UserCheck } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { arrestService, criminalService, officerService } from '../services/api'

const EMPTY = { criminal_id: '', officer_id: '', arrest_date: '', location: '', reason: '', bail_status: 'Not Applied', custody_status: 'In Custody' }

export default function Arrests() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [criminals, setCriminals] = useState([])
  const [officers, setOfficers] = useState([])
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await arrestService.getAll({ page, limit: 20, search })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load', 'error') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    criminalService.getAll({ limit: 100 }).then(r => setCriminals(r.data.data)).catch(() => {})
    officerService.getList().then(r => setOfficers(r.data.data)).catch(() => {})
  }, [])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm({ ...r, arrest_date: r.arrest_date?.split('T')[0] || '' }); setModal({ open: true, mode: 'edit', record: r }) }

  const handleSave = async () => {
    if (!form.criminal_id || !form.arrest_date) return toast('Criminal and date required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await arrestService.create(form)
      else await arrestService.update(modal.record.id, form)
      toast('Saved'); setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await arrestService.remove(confirm.id)
      toast('Deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'criminal_name', label: 'Criminal', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'officer_name', label: 'Arresting Officer' },
    { key: 'arrest_date', label: 'Date', render: v => v?.split('T')[0] || '—' },
    { key: 'location', label: 'Location' },
    { key: 'bail_status', label: 'Bail', render: v => <span className={v === 'Granted' ? 'badge-green' : v === 'Denied' ? 'badge-red' : 'badge-gray'}>{v}</span> },
    { key: 'custody_status', label: 'Custody', render: v => <span className={v === 'In Custody' ? 'badge-blue' : 'badge-gray'}>{v}</span> },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><UserCheck size={20} className="text-primary" /> Arrests</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total arrests</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Record Arrest</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={setSearch} loading={loading} searchPlaceholder="Search criminal, location..." />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Record Arrest' : 'Edit Arrest'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Criminal *</label>
              <select value={form.criminal_id || ''} onChange={e => sf('criminal_id', e.target.value)} className="input-field text-sm">
                <option value="">Select</option>
                {criminals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Arresting Officer</label>
              <select value={form.officer_id || ''} onChange={e => sf('officer_id', e.target.value)} className="input-field text-sm">
                <option value="">Select</option>
                {officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Arrest Date *</label>
              <input type="date" value={form.arrest_date || ''} onChange={e => sf('arrest_date', e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Location</label>
              <input value={form.location || ''} onChange={e => sf('location', e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bail Status</label>
              <select value={form.bail_status || 'Not Applied'} onChange={e => sf('bail_status', e.target.value)} className="input-field text-sm">
                {['Not Applied', 'Pending', 'Granted', 'Denied'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Custody Status</label>
              <select value={form.custody_status || 'In Custody'} onChange={e => sf('custody_status', e.target.value)} className="input-field text-sm">
                {['In Custody', 'Released', 'Transferred', 'Escaped'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Reason</label>
            <textarea value={form.reason || ''} onChange={e => sf('reason', e.target.value)} rows={2} className="input-field text-sm resize-none" />
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
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the arrest record." />
    </div>
  )
}
