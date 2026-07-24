import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Eye, HeartPulse } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { victimService, firService } from '../services/api'

const GENDERS = ['Male', 'Female', 'Other']
const VICTIM_TYPES = ['Primary', 'Secondary', 'Witness']
const INJURY_TYPES = ['None', 'Minor', 'Grievous', 'Fatal']
const EMPTY = { fir_id: '', victim_name: '', age: '', gender: '', victim_type: '', injury_type: 'None', hospital: '', remarks: '' }

function F({ label, name, type = 'text', options, form, setForm }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {options ? (
        <select value={form[name] || ''} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} className="input-field text-sm">
          <option value="">Select</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[name] || ''} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} className="input-field text-sm" />
      )}
    </div>
  )
}

export default function Victims() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterType, setFilterType] = useState('')
  const [firs, setFirs] = useState([])
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [viewModal, setViewModal] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await victimService.getAll({ page, limit: 20, search, gender: filterGender, victim_type: filterType })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load victims', 'error') }
    finally { setLoading(false) }
  }, [page, search, filterGender, filterType])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    firService.getAll({ limit: 200 }).then(r => setFirs(r.data.data || [])).catch(() => {})
  }, [])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm(r); setModal({ open: true, mode: 'edit', record: r }) }

  const handleSave = async () => {
    if (!form.victim_name) return toast('Victim name is required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await victimService.create(form)
      else await victimService.update(modal.record.id, form)
      toast(`Victim ${modal.mode === 'add' ? 'added' : 'updated'}`)
      setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await victimService.remove(confirm.id)
      toast('Victim deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const INJURY_COLORS = { Fatal: 'badge-red', Grievous: 'badge-yellow', Minor: 'badge-blue', None: 'badge-gray' }

  const columns = [
    { key: 'victim_name', label: 'Name', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'fir_number', label: 'FIR', render: v => v ? <span className="font-mono text-primary text-xs">{v}</span> : '—' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'victim_type', label: 'Type', render: v => v ? <span className="badge-blue">{v}</span> : '—' },
    { key: 'injury_type', label: 'Injury', render: v => <span className={INJURY_COLORS[v] || 'badge-gray'}>{v || '—'}</span> },
    { key: 'hospital', label: 'Hospital' },
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><HeartPulse size={20} className="text-primary" /> Victims</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total records</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Add Victim</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={v => { setSearch(v); setPage(1) }} loading={loading}
        searchPlaceholder="Search name, hospital..."
        filters={
          <div className="flex gap-2">
            <select value={filterGender} onChange={e => { setFilterGender(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-32">
              <option value="">All Gender</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-32">
              <option value="">All Types</option>
              {VICTIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        }
      />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Add Victim' : 'Edit Victim'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">FIR</label>
            <select value={form.fir_id || ''} onChange={e => sf('fir_id', e.target.value)} className="input-field text-sm">
              <option value="">Select FIR (optional)</option>
              {firs.map(f => <option key={f.id} value={f.id}>{f.fir_number} — {f.crime_type || ''}</option>)}
            </select>
          </div>
          <F label="Victim Name *" name="victim_name" form={form} setForm={setForm} />
          <F label="Age" name="age" type="number" form={form} setForm={setForm} />
          <F label="Gender" name="gender" options={GENDERS} form={form} setForm={setForm} />
          <F label="Victim Type" name="victim_type" options={VICTIM_TYPES} form={form} setForm={setForm} />
          <F label="Injury Type" name="injury_type" options={INJURY_TYPES} form={form} setForm={setForm} />
          <F label="Hospital" name="hospital" form={form} setForm={setForm} />
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Remarks</label>
            <textarea value={form.remarks || ''} onChange={e => sf('remarks', e.target.value)} rows={2} className="input-field text-sm resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setModal(p => ({ ...p, open: false }))} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Saving...' : modal.mode === 'add' ? 'Add' : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, record: null })} title="Victim Details">
        {viewModal.record && (
          <div className="grid grid-cols-2 gap-3">
            {[['Name', viewModal.record.victim_name], ['FIR', viewModal.record.fir_number],
              ['Age', viewModal.record.age], ['Gender', viewModal.record.gender],
              ['Type', viewModal.record.victim_type], ['Injury', viewModal.record.injury_type],
              ['Hospital', viewModal.record.hospital],
            ].map(([k, v]) => (
              <div key={k} className="bg-white/3 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">{k}</div>
                <div className="text-sm text-white">{v || '—'}</div>
              </div>
            ))}
            {viewModal.record.remarks && (
              <div className="col-span-2 bg-white/3 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Remarks</div>
                <div className="text-sm text-gray-300">{viewModal.record.remarks}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the victim record." />
    </div>
  )
}
