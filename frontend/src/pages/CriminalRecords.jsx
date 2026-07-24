import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Eye, Fingerprint } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { criminalService } from '../services/api'

const RISK_COLORS = { High: 'badge-red', Medium: 'badge-yellow', Low: 'badge-green' }
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical']
const STATUSES = ['Active', 'Arrested', 'Released', 'Absconding', 'Deceased']
const CRIME_CATS = ['Theft', 'Assault', 'Fraud', 'Murder', 'Robbery', 'Cybercrime', 'Drug Trafficking', 'Kidnapping', 'Other']
const EMPTY = { name: '', alias: '', gender: '', age: '', address: '', fingerprint_id: '', dna_id: '', risk_level: 'Low', gang: '', crime_category: '', repeat_offender: false, status: 'Active', notes: '' }

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

export default function CriminalRecords() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRisk, setFilterRisk] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [viewModal, setViewModal] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await criminalService.getAll({ page, limit: 20, search, status: filterStatus, risk_level: filterRisk })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load criminals', 'error') }
    finally { setLoading(false) }
  }, [page, search, filterStatus, filterRisk])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm(r); setModal({ open: true, mode: 'edit', record: r }) }

  const handleSave = async () => {
    if (!form.name) return toast('Name is required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await criminalService.create(form)
      else await criminalService.update(modal.record.id, form)
      toast(`Criminal record ${modal.mode === 'add' ? 'created' : 'updated'}`)
      setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await criminalService.remove(confirm.id)
      toast('Record deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'criminal_id', label: 'ID', render: v => <span className="font-mono text-xs text-gray-500">{v}</span> },
    { key: 'name', label: 'Name', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'alias', label: 'Alias', render: v => v ? <span className="text-gray-400 italic">"{v}"</span> : '—' },
    { key: 'crime_category', label: 'Category' },
    { key: 'risk_level', label: 'Risk', render: v => <span className={RISK_COLORS[v] || 'badge-gray'}>{v}</span> },
    { key: 'repeat_offender', label: 'Repeat', render: v => v ? <span className="badge-red">Yes</span> : <span className="badge-gray">No</span> },
    { key: 'status', label: 'Status', render: v => <span className={v === 'Arrested' ? 'badge-green' : v === 'Absconding' ? 'badge-red' : 'badge-gray'}>{v}</span> },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Fingerprint size={20} className="text-primary" /> Criminal Records</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total records</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Add Criminal</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={setSearch} loading={loading}
        searchPlaceholder="Search name, alias, ID..."
        filters={
          <div className="flex gap-2">
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-32">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterRisk} onChange={e => { setFilterRisk(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-32">
              <option value="">All Risk</option>
              {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        }
      />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Add Criminal Record' : 'Edit Criminal Record'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <F label="Full Name *" name="name" form={form} setForm={setForm} />
          <F label="Alias" name="alias" form={form} setForm={setForm} />
          <F label="Gender" name="gender" options={['Male', 'Female', 'Other']} form={form} setForm={setForm} />
          <F label="Age" name="age" type="number" form={form} setForm={setForm} />
          <F label="Risk Level" name="risk_level" options={RISK_LEVELS} form={form} setForm={setForm} />
          <F label="Status" name="status" options={STATUSES} form={form} setForm={setForm} />
          <F label="Crime Category" name="crime_category" options={CRIME_CATS} form={form} setForm={setForm} />
          <F label="Gang" name="gang" form={form} setForm={setForm} />
          <F label="Fingerprint ID" name="fingerprint_id" form={form} setForm={setForm} />
          <F label="DNA ID" name="dna_id" form={form} setForm={setForm} />
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Address</label>
            <textarea value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2} className="input-field text-sm resize-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="input-field text-sm resize-none" />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="repeat" checked={form.repeat_offender || false} onChange={e => setForm(p => ({ ...p, repeat_offender: e.target.checked }))} className="accent-primary" />
            <label htmlFor="repeat" className="text-sm text-gray-300">Repeat Offender</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setModal(p => ({ ...p, open: false }))} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Saving...' : modal.mode === 'add' ? 'Add Record' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, record: null })} title="Criminal Profile" size="lg">
        {viewModal.record && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/3 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {viewModal.record.name?.[0]}
              </div>
              <div>
                <div className="text-lg font-bold text-white">{viewModal.record.name}</div>
                {viewModal.record.alias && <div className="text-sm text-gray-400 italic">"{viewModal.record.alias}"</div>}
                <div className="flex gap-2 mt-1">
                  <span className={RISK_COLORS[viewModal.record.risk_level] || 'badge-gray'}>{viewModal.record.risk_level} Risk</span>
                  {viewModal.record.repeat_offender && <span className="badge-red">Repeat Offender</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['ID', viewModal.record.criminal_id], ['Gender', viewModal.record.gender], ['Age', viewModal.record.age],
                ['Category', viewModal.record.crime_category], ['Gang', viewModal.record.gang], ['Status', viewModal.record.status],
                ['Fingerprint ID', viewModal.record.fingerprint_id], ['DNA ID', viewModal.record.dna_id]
              ].map(([k, v]) => (
                <div key={k} className="bg-white/3 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{k}</div>
                  <div className="text-sm text-white">{v || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the criminal record." />
    </div>
  )
}
