import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Eye, UserX } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { accusedService, firService, criminalService } from '../services/api'

const GENDERS = ['Male', 'Female', 'Other']
const STATUSES = ['Under Investigation', 'Arrested', 'Absconding', 'Released', 'Acquitted', 'Convicted']
const EMPTY = { fir_id: '', criminal_id: '', accused_name: '', age: '', gender: '', alias: '', status: 'Under Investigation' }

const STATUS_COLORS = {
  Arrested: 'badge-green', Absconding: 'badge-red', Convicted: 'badge-red',
  Released: 'badge-gray', Acquitted: 'badge-blue', 'Under Investigation': 'badge-yellow'
}

export default function Accused() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [firs, setFirs] = useState([])
  const [criminals, setCriminals] = useState([])
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [viewModal, setViewModal] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await accusedService.getAll({ page, limit: 20, search, status: filterStatus })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load accused records', 'error') }
    finally { setLoading(false) }
  }, [page, search, filterStatus])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    firService.getAll({ limit: 200 }).then(r => setFirs(r.data.data || [])).catch(() => {})
    criminalService.getAll({ limit: 200 }).then(r => setCriminals(r.data.data || [])).catch(() => {})
  }, [])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm(r); setModal({ open: true, mode: 'edit', record: r }) }

  const handleSave = async () => {
    if (!form.accused_name) return toast('Accused name is required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await accusedService.create(form)
      else await accusedService.update(modal.record.id, form)
      toast(`Accused ${modal.mode === 'add' ? 'added' : 'updated'}`)
      setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await accusedService.remove(confirm.id)
      toast('Record deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'accused_name', label: 'Name', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'alias', label: 'Alias', render: v => v ? <span className="text-gray-400 italic">"{v}"</span> : '—' },
    { key: 'fir_number', label: 'FIR', render: v => v ? <span className="font-mono text-primary text-xs">{v}</span> : '—' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'status', label: 'Status', render: v => <span className={STATUS_COLORS[v] || 'badge-gray'}>{v}</span> },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><UserX size={20} className="text-primary" /> Accused</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total records</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Add Accused</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={v => { setSearch(v); setPage(1) }} loading={loading}
        searchPlaceholder="Search name, alias..."
        filters={
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-40">
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Add Accused' : 'Edit Accused'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">FIR</label>
            <select value={form.fir_id || ''} onChange={e => sf('fir_id', e.target.value)} className="input-field text-sm">
              <option value="">Select FIR</option>
              {firs.map(f => <option key={f.id} value={f.id}>{f.fir_number}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Link Criminal Record</label>
            <select value={form.criminal_id || ''} onChange={e => sf('criminal_id', e.target.value)} className="input-field text-sm">
              <option value="">Select (optional)</option>
              {criminals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {[['Accused Name *', 'accused_name'], ['Alias', 'alias']].map(([l, n]) => (
            <div key={n}>
              <label className="block text-xs text-gray-400 mb-1">{l}</label>
              <input value={form[n] || ''} onChange={e => sf(n, e.target.value)} className="input-field text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Age</label>
            <input type="number" value={form.age || ''} onChange={e => sf('age', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Gender</label>
            <select value={form.gender || ''} onChange={e => sf('gender', e.target.value)} className="input-field text-sm">
              <option value="">Select</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={form.status || 'Under Investigation'} onChange={e => sf('status', e.target.value)} className="input-field text-sm">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setModal(p => ({ ...p, open: false }))} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Saving...' : modal.mode === 'add' ? 'Add' : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, record: null })} title="Accused Details">
        {viewModal.record && (
          <div className="grid grid-cols-2 gap-3">
            {[['Name', viewModal.record.accused_name], ['Alias', viewModal.record.alias],
              ['FIR', viewModal.record.fir_number], ['Age', viewModal.record.age],
              ['Gender', viewModal.record.gender], ['Status', viewModal.record.status],
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
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the accused record." />
    </div>
  )
}
