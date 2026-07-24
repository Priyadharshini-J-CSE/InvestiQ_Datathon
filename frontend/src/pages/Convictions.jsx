import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Scale } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { convictionService, caseService, criminalService } from '../services/api'

const EMPTY = { case_id: '', criminal_id: '', court: '', judge: '', sentence: '', fine: '', prison: '', conviction_date: '', release_date: '', appeal_status: 'None' }

export default function Convictions() {
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
      const res = await convictionService.getAll({ page, limit: 20, search })
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
  const openEdit = (r) => {
    setForm({ ...r, conviction_date: r.conviction_date?.split('T')[0] || '', release_date: r.release_date?.split('T')[0] || '' })
    setModal({ open: true, mode: 'edit', record: r })
  }

  const handleSave = async () => {
    if (!form.case_id) return toast('Case is required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await convictionService.create(form)
      else await convictionService.update(modal.record.id, form)
      toast('Saved'); setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await convictionService.remove(confirm.id)
      toast('Deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'case_number', label: 'Case No.', render: v => <span className="font-mono text-primary text-xs">{v}</span> },
    { key: 'criminal_name', label: 'Criminal', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'court', label: 'Court' },
    { key: 'judge', label: 'Judge' },
    { key: 'sentence', label: 'Sentence' },
    { key: 'fine', label: 'Fine', render: v => v ? `₹${Number(v).toLocaleString()}` : '—' },
    { key: 'appeal_status', label: 'Appeal', render: v => <span className={v === 'Pending' ? 'badge-yellow' : v === 'Upheld' ? 'badge-red' : 'badge-gray'}>{v}</span> },
    { key: 'release_date', label: 'Release Date', render: v => v?.split('T')[0] || '—' },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Scale size={20} className="text-primary" /> Convictions</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total convictions</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Add Conviction</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={setSearch} loading={loading} searchPlaceholder="Search court, judge, criminal..." />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Add Conviction' : 'Edit Conviction'} size="lg">
        <div className="grid grid-cols-2 gap-4">
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
              <option value="">Select</option>
              {criminals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {[['Court', 'court'], ['Judge', 'judge'], ['Prison', 'prison']].map(([label, name]) => (
            <div key={name}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input value={form[name] || ''} onChange={e => sf(name, e.target.value)} className="input-field text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Fine (₹)</label>
            <input type="number" value={form.fine || ''} onChange={e => sf('fine', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Conviction Date</label>
            <input type="date" value={form.conviction_date || ''} onChange={e => sf('conviction_date', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Release Date</label>
            <input type="date" value={form.release_date || ''} onChange={e => sf('release_date', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Appeal Status</label>
            <select value={form.appeal_status || 'None'} onChange={e => sf('appeal_status', e.target.value)} className="input-field text-sm">
              {['None', 'Pending', 'Upheld', 'Overturned'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Sentence</label>
            <textarea value={form.sentence || ''} onChange={e => sf('sentence', e.target.value)} rows={2} className="input-field text-sm resize-none" />
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
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the conviction record." />
    </div>
  )
}
