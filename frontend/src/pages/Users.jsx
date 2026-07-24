import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, UserCog } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { userService } from '../services/api'

const ROLES = ['Admin', 'Inspector', 'Sub Inspector', 'Officer', 'Data Entry Operator']
const EMPTY = { username: '', password: '', name: '', role: 'Officer', badge: '', station: '', status: 'Active' }

export default function Users() {
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
      const res = await userService.getAll({ page, limit: 20, search })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load', 'error') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm({ ...r, password: '' }); setModal({ open: true, mode: 'edit', record: r }) }

  const handleSave = async () => {
    if (!form.name || !form.role) return toast('Name and role required', 'error')
    if (modal.mode === 'add' && !form.username) return toast('Username required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await userService.create(form)
      else await userService.update(modal.record.id, form)
      toast('Saved'); setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await userService.remove(confirm.id)
      toast('Deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'username', label: 'Username', render: v => <span className="font-mono text-sm text-primary">{v}</span> },
    { key: 'name', label: 'Name', render: v => <span className="text-white font-medium">{v}</span> },
    { key: 'role', label: 'Role', render: v => <span className={v === 'Admin' ? 'badge-red' : 'badge-blue'}>{v}</span> },
    { key: 'badge', label: 'Badge' },
    { key: 'station', label: 'Station' },
    { key: 'status', label: 'Status', render: v => <span className={v === 'Active' ? 'badge-green' : 'badge-gray'}>{v}</span> },
    { key: 'last_login', label: 'Last Login', render: v => v ? new Date(v).toLocaleDateString('en-IN') : 'Never' },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><UserCog size={20} className="text-primary" /> Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total users</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> Add User</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={setSearch} loading={loading} searchPlaceholder="Search username, name..." />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'Add User' : 'Edit User'}>
        <div className="grid grid-cols-2 gap-4">
          {modal.mode === 'add' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Username *</label>
              <input value={form.username || ''} onChange={e => sf('username', e.target.value)} className="input-field text-sm" />
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
            <input value={form.name || ''} onChange={e => sf('name', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{modal.mode === 'add' ? 'Password *' : 'New Password (leave blank to keep)'}</label>
            <input type="password" value={form.password || ''} onChange={e => sf('password', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Role *</label>
            <select value={form.role || 'Officer'} onChange={e => sf('role', e.target.value)} className="input-field text-sm">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Badge</label>
            <input value={form.badge || ''} onChange={e => sf('badge', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Station</label>
            <input value={form.station || ''} onChange={e => sf('station', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={form.status || 'Active'} onChange={e => sf('status', e.target.value)} className="input-field text-sm">
              {['Active', 'Inactive', 'Suspended'].map(s => <option key={s} value={s}>{s}</option>)}
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
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the user account." />
    </div>
  )
}
