import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { policeUnitService } from '../services/api'

const UNIT_TYPES = ['Headquarters', 'Range', 'District', 'Sub-Division', 'Circle', 'Station', 'Outpost', 'Special Unit']
const EMPTY = { unit_name: '', district: '', state: 'Tamil Nadu', type: '', parent_unit: '' }

export default function PoliceUnits() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [allUnits, setAllUnits] = useState([])
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await policeUnitService.getAll({ page, limit: 20, search, type: filterType })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load police units', 'error') }
    finally { setLoading(false) }
  }, [page, search, filterType])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    policeUnitService.getAll({ limit: 200 }).then(r => setAllUnits(r.data.data || [])).catch(() => {})
  }, [])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm(r); setModal({ open: true, mode: 'edit', record: r }) }

  const handleSave = async () => {
    if (!form.unit_name) return toast('Unit name is required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await policeUnitService.create(form)
      else await policeUnitService.update(modal.record.id, form)
      toast(`Unit ${modal.mode === 'add' ? 'created' : 'updated'}`)
      setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await policeUnitService.remove(confirm.id)
      toast('Unit deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'unit_name', label: 'Unit Name', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'type', label: 'Type', render: v => v ? <span className="badge-blue">{v}</span> : '—' },
    { key: 'district', label: 'District' },
    { key: 'state', label: 'State' },
    { key: 'parent_name', label: 'Parent Unit', render: v => v || '—' },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Building2 size={20} className="text-primary" /> Police Units</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total units</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Add Unit</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={v => { setSearch(v); setPage(1) }} loading={loading}
        searchPlaceholder="Search unit name, district..."
        filters={
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-36">
            <option value="">All Types</option>
            {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        }
      />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Add Police Unit' : 'Edit Police Unit'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Unit Name *</label>
            <input value={form.unit_name || ''} onChange={e => sf('unit_name', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <select value={form.type || ''} onChange={e => sf('type', e.target.value)} className="input-field text-sm">
              <option value="">Select Type</option>
              {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Parent Unit</label>
            <select value={form.parent_unit || ''} onChange={e => sf('parent_unit', e.target.value)} className="input-field text-sm">
              <option value="">None</option>
              {allUnits.filter(u => u.id !== modal.record?.id).map(u => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">District</label>
            <input value={form.district || ''} onChange={e => sf('district', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
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
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the police unit." />
    </div>
  )
}
