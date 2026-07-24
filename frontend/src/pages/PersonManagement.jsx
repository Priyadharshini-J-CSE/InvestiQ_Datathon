import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Eye, Users } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { personService } from '../services/api'

const EMPTY = { full_name: '', gender: '', dob: '', age: '', phone: '', email: '', occupation: '', nationality: 'Indian', address: '', aadhaar: '' }

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

export default function PersonManagement() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [viewModal, setViewModal] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await personService.getAll({ page, limit: 20, search })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load persons', 'error') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm({ ...r, dob: r.dob?.split('T')[0] || '' }); setModal({ open: true, mode: 'edit', record: r }) }

  const handleSave = async () => {
    if (!form.full_name) return toast('Full name is required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await personService.create(form)
      else await personService.update(modal.record.id, form)
      toast(`Person ${modal.mode === 'add' ? 'added' : 'updated'}`)
      setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await personService.remove(confirm.id)
      toast('Person deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'person_id', label: 'ID', render: v => <span className="font-mono text-xs text-gray-500">{v}</span> },
    { key: 'full_name', label: 'Full Name', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'gender', label: 'Gender' },
    { key: 'age', label: 'Age' },
    { key: 'phone', label: 'Phone' },
    { key: 'occupation', label: 'Occupation' },
    { key: 'nationality', label: 'Nationality' },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Users size={20} className="text-primary" /> Person Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total records</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Add Person</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={setSearch} loading={loading}
        searchPlaceholder="Search name, phone, aadhaar..." />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Add Person' : 'Edit Person'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><F label="Full Name *" name="full_name" form={form} setForm={setForm} /></div>
          <F label="Gender" name="gender" options={['Male', 'Female', 'Other']} form={form} setForm={setForm} />
          <F label="Date of Birth" name="dob" type="date" form={form} setForm={setForm} />
          <F label="Age" name="age" type="number" form={form} setForm={setForm} />
          <F label="Phone" name="phone" form={form} setForm={setForm} />
          <F label="Email" name="email" type="email" form={form} setForm={setForm} />
          <F label="Occupation" name="occupation" form={form} setForm={setForm} />
          <F label="Nationality" name="nationality" form={form} setForm={setForm} />
          <F label="Aadhaar Number" name="aadhaar" form={form} setForm={setForm} />
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Address</label>
            <textarea value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2} className="input-field text-sm resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setModal(p => ({ ...p, open: false }))} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Saving...' : modal.mode === 'add' ? 'Add Person' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, record: null })} title="Person Details">
        {viewModal.record && (
          <div className="grid grid-cols-2 gap-3">
            {[['ID', viewModal.record.person_id], ['Name', viewModal.record.full_name], ['Gender', viewModal.record.gender],
              ['DOB', viewModal.record.dob?.split('T')[0]], ['Age', viewModal.record.age], ['Phone', viewModal.record.phone],
              ['Email', viewModal.record.email], ['Occupation', viewModal.record.occupation],
              ['Nationality', viewModal.record.nationality], ['Aadhaar', viewModal.record.aadhaar]
            ].map(([k, v]) => (
              <div key={k} className="bg-white/3 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">{k}</div>
                <div className="text-sm text-white">{v || '—'}</div>
              </div>
            ))}
            {viewModal.record.address && (
              <div className="col-span-2 bg-white/3 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Address</div>
                <div className="text-sm text-white">{viewModal.record.address}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the person record." />
    </div>
  )
}
