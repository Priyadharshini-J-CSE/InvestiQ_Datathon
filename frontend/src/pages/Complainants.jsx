import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Eye, Users } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { complainantService, firService } from '../services/api'

const GENDERS = ['Male', 'Female', 'Other']
const EMPTY = { fir_id: '', full_name: '', age: '', gender: '', occupation: '', religion: '', caste: '', mobile: '', address: '' }

function F({ label, name, type = 'text', options, form, setForm }) {
  const sf = (v) => setForm(p => ({ ...p, [name]: v }))
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {options ? (
        <select value={form[name] || ''} onChange={e => sf(e.target.value)} className="input-field text-sm">
          <option value="">Select {label}</option>
          {options.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={form[name] || ''} onChange={e => sf(e.target.value)} rows={2} className="input-field text-sm resize-none" />
      ) : (
        <input type={type} value={form[name] || ''} onChange={e => sf(e.target.value)} className="input-field text-sm" />
      )}
    </div>
  )
}

export default function Complainants() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [firs, setFirs] = useState([])
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [viewModal, setViewModal] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await complainantService.getAll({ page, limit: 20, search, gender: filterGender })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load complainants', 'error') }
    finally { setLoading(false) }
  }, [page, search, filterGender])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    firService.getAll({ limit: 200 }).then(r => setFirs(r.data.data || [])).catch(() => {})
  }, [])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm(r); setModal({ open: true, mode: 'edit', record: r }) }

  const handleSave = async () => {
    if (!form.full_name) return toast('Full name is required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await complainantService.create(form)
      else await complainantService.update(modal.record.id, form)
      toast(`Complainant ${modal.mode === 'add' ? 'added' : 'updated'}`)
      setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await complainantService.remove(confirm.id)
      toast('Complainant deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'full_name', label: 'Name', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'fir_number', label: 'FIR', render: v => v ? <span className="font-mono text-primary text-xs">{v}</span> : '—' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'occupation', label: 'Occupation' },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Users size={20} className="text-primary" /> Complainants</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total records</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Add Complainant</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={v => { setSearch(v); setPage(1) }} loading={loading}
        searchPlaceholder="Search name, mobile..."
        filters={
          <select value={filterGender} onChange={e => { setFilterGender(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-32">
            <option value="">All Gender</option>
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        }
      />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Add Complainant' : 'Edit Complainant'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">FIR</label>
            <select value={form.fir_id || ''} onChange={e => sf('fir_id', e.target.value)} className="input-field text-sm">
              <option value="">Select FIR (optional)</option>
              {firs.map(f => <option key={f.id} value={f.id}>{f.fir_number} — {f.crime_type || ''}</option>)}
            </select>
          </div>
          <F label="Full Name *" name="full_name" form={form} setForm={setForm} />
          <F label="Mobile" name="mobile" form={form} setForm={setForm} />
          <F label="Age" name="age" type="number" form={form} setForm={setForm} />
          <F label="Gender" name="gender" options={GENDERS} form={form} setForm={setForm} />
          <F label="Occupation" name="occupation" form={form} setForm={setForm} />
          <F label="Religion" name="religion" form={form} setForm={setForm} />
          <F label="Caste" name="caste" form={form} setForm={setForm} />
          <div className="col-span-2"><F label="Address" name="address" type="textarea" form={form} setForm={setForm} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setModal(p => ({ ...p, open: false }))} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Saving...' : modal.mode === 'add' ? 'Add' : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, record: null })} title="Complainant Details">
        {viewModal.record && (
          <div className="grid grid-cols-2 gap-3">
            {[['Name', viewModal.record.full_name], ['FIR', viewModal.record.fir_number],
              ['Age', viewModal.record.age], ['Gender', viewModal.record.gender],
              ['Mobile', viewModal.record.mobile], ['Occupation', viewModal.record.occupation],
              ['Religion', viewModal.record.religion], ['Caste', viewModal.record.caste],
            ].map(([k, v]) => (
              <div key={k} className="bg-white/3 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">{k}</div>
                <div className="text-sm text-white">{v || '—'}</div>
              </div>
            ))}
            {viewModal.record.address && (
              <div className="col-span-2 bg-white/3 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Address</div>
                <div className="text-sm text-gray-300">{viewModal.record.address}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the complainant record." />
    </div>
  )
}
