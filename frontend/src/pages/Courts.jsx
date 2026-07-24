import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Landmark } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { courtService } from '../services/api'

const COURT_TYPES = ['Supreme Court', 'High Court', 'District Court', 'Sessions Court', 'Magistrate Court', 'City Civil Court', 'Fast Track Court', 'Special Court']
const EMPTY = { court_name: '', district: '', state: 'Tamil Nadu', court_type: '' }

export default function Courts() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await courtService.getAll({ page, limit: 20, search, court_type: filterType })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load courts', 'error') }
    finally { setLoading(false) }
  }, [page, search, filterType])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm(r); setModal({ open: true, mode: 'edit', record: r }) }

  const handleSave = async () => {
    if (!form.court_name) return toast('Court name is required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await courtService.create(form)
      else await courtService.update(modal.record.id, form)
      toast(`Court ${modal.mode === 'add' ? 'created' : 'updated'}`)
      setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await courtService.remove(confirm.id)
      toast('Court deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'court_name', label: 'Court Name', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'court_type', label: 'Type', render: v => v ? <span className="badge-blue">{v}</span> : '—' },
    { key: 'district', label: 'District' },
    { key: 'state', label: 'State' },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Landmark size={20} className="text-primary" /> Courts</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total courts</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Add Court</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={v => { setSearch(v); setPage(1) }} loading={loading}
        searchPlaceholder="Search court name, district..."
        filters={
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-40">
            <option value="">All Types</option>
            {COURT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        }
      />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Add Court' : 'Edit Court'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Court Name *</label>
            <input value={form.court_name || ''} onChange={e => sf('court_name', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Court Type</label>
            <select value={form.court_type || ''} onChange={e => sf('court_type', e.target.value)} className="input-field text-sm">
              <option value="">Select Type</option>
              {COURT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">District</label>
            <input value={form.district || ''} onChange={e => sf('district', e.target.value)} className="input-field text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">State</label>
            <input value={form.state || ''} onChange={e => sf('state', e.target.value)} className="input-field text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setModal(p => ({ ...p, open: false }))} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Saving...' : modal.mode === 'add' ? 'Create' : 'Save'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the court record." />
    </div>
  )
}
