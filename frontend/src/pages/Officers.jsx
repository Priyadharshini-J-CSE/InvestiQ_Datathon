import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, ShieldCheck } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { officerService } from '../services/api'
import { districts } from '../utils/mockData'

const RANKS = ['Constable', 'Head Constable', 'ASI', 'SI', 'PSI', 'Inspector', 'DSP', 'SP', 'SSP', 'DIG', 'IG', 'ADGP', 'DGP']
const EMPTY = { badge_number: '', name: '', rank: '', district: '', phone: '', email: '', joining_date: '', status: 'Active' }

export default function Officers() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await officerService.getAll({ page, limit: 20, search })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load', 'error') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm({ ...r, joining_date: r.joining_date?.split('T')[0] || '' }); setModal({ open: true, mode: 'edit', record: r }) }

  const handleSave = async () => {
    if (!form.badge_number || !form.name) return toast('Badge number and name required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await officerService.create(form)
      else await officerService.update(modal.record.id, form)
      toast('Saved'); setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await officerService.remove(confirm.id)
      toast('Deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'badge_number', label: 'Badge', render: v => <span className="font-mono text-primary text-xs">{v}</span> },
    { key: 'name', label: 'Name', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'rank', label: 'Rank' },
    { key: 'district', label: 'District' },
    { key: 'station_name', label: 'Station' },
    { key: 'phone', label: 'Phone' },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><ShieldCheck size={20} className="text-primary" /> Officers</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total officers</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Add Officer</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={setSearch} loading={loading} searchPlaceholder="Search name, badge, email..." />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Add Officer' : 'Edit Officer'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Badge Number *</label>
            <input value={form.badge_number || ''} onChange={e => sf('badge_number', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
            <input value={form.name || ''} onChange={e => sf('name', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Rank</label>
            <select value={form.rank || ''} onChange={e => sf('rank', e.target.value)} className="input-field text-sm">
              <option value="">Select Rank</option>
              {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">District</label>
            <select value={form.district || ''} onChange={e => sf('district', e.target.value)} className="input-field text-sm">
              <option value="">Select District</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Phone</label>
            <input value={form.phone || ''} onChange={e => sf('phone', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input type="email" value={form.email || ''} onChange={e => sf('email', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Joining Date</label>
            <input type="date" value={form.joining_date || ''} onChange={e => sf('joining_date', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={form.status || 'Active'} onChange={e => sf('status', e.target.value)} className="input-field text-sm">
              {['Active', 'Inactive', 'Suspended', 'Retired'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
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
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the officer record." />
    </div>
  )
}
