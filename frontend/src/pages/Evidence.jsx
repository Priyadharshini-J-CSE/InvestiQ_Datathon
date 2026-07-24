import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Camera } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { evidenceService, caseService, officerService } from '../services/api'

const TYPES = ['Image', 'Video', 'Audio', 'Document', 'Weapon', 'Fingerprint', 'DNA', 'Other']
const EMPTY = { case_id: '', evidence_type: '', description: '', collected_by: '', collected_date: '', location: '', storage_location: '', file_url: '' }

export default function Evidence() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [cases, setCases] = useState([])
  const [officers, setOfficers] = useState([])
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await evidenceService.getAll({ page, limit: 20, search, evidence_type: filterType })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load', 'error') }
    finally { setLoading(false) }
  }, [page, search, filterType])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    caseService.getAll({ limit: 100 }).then(r => setCases(r.data.data)).catch(() => {})
    officerService.getList().then(r => setOfficers(r.data.data)).catch(() => {})
  }, [])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm({ ...r, collected_date: r.collected_date?.split('T')[0] || '' }); setModal({ open: true, mode: 'edit', record: r }) }

  const handleSave = async () => {
    if (!form.case_id || !form.evidence_type) return toast('Case and type required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await evidenceService.create(form)
      else await evidenceService.update(modal.record.id, form)
      toast('Saved'); setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await evidenceService.remove(confirm.id)
      toast('Deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const TYPE_COLORS = { Image: 'badge-blue', Video: 'badge-blue', Weapon: 'badge-red', DNA: 'badge-green', Fingerprint: 'badge-yellow' }

  const columns = [
    { key: 'case_number', label: 'Case No.', render: v => <span className="font-mono text-primary text-xs">{v}</span> },
    { key: 'evidence_type', label: 'Type', render: v => <span className={TYPE_COLORS[v] || 'badge-gray'}>{v}</span> },
    { key: 'description', label: 'Description', render: v => <span className="text-xs text-gray-400">{v?.slice(0, 50)}{v?.length > 50 ? '...' : ''}</span> },
    { key: 'collected_by_name', label: 'Collected By' },
    { key: 'collected_date', label: 'Date', render: v => v?.split('T')[0] || '—' },
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Status', render: v => <span className={v === 'Active' ? 'badge-green' : 'badge-gray'}>{v}</span> },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Camera size={20} className="text-primary" /> Evidence</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total items</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Add Evidence</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={setSearch} loading={loading} searchPlaceholder="Search description, location..."
        filters={
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-36">
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        }
      />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Add Evidence' : 'Edit Evidence'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Case *</label>
            <select value={form.case_id || ''} onChange={e => sf('case_id', e.target.value)} className="input-field text-sm">
              <option value="">Select Case</option>
              {cases.map(c => <option key={c.id} value={c.id}>{c.case_number}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Evidence Type *</label>
            <select value={form.evidence_type || ''} onChange={e => sf('evidence_type', e.target.value)} className="input-field text-sm">
              <option value="">Select Type</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Collected By</label>
            <select value={form.collected_by || ''} onChange={e => sf('collected_by', e.target.value)} className="input-field text-sm">
              <option value="">Select Officer</option>
              {officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Collected Date</label>
            <input type="date" value={form.collected_date || ''} onChange={e => sf('collected_date', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Location Found</label>
            <input value={form.location || ''} onChange={e => sf('location', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Storage Location</label>
            <input value={form.storage_location || ''} onChange={e => sf('storage_location', e.target.value)} className="input-field text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">File URL</label>
            <input value={form.file_url || ''} onChange={e => sf('file_url', e.target.value)} className="input-field text-sm" placeholder="https://..." />
          </div>
          <div className="col-span-2">
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
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the evidence record." />
    </div>
  )
}
