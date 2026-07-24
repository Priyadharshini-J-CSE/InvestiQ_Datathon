import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Eye, Briefcase } from 'lucide-react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { caseService, firService, officerService } from '../services/api'

const STATUSES = ['Open', 'Closed', 'Pending', 'Dismissed']
const INV_STATUSES = ['Ongoing', 'Completed', 'Suspended']
const EMPTY = { case_number: '', fir_id: '', court: '', judge: '', officer_id: '', status: 'Open', investigation_status: 'Ongoing', court_date: '', closing_date: '', notes: '' }

export default function CaseManagement() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [firs, setFirs] = useState([])
  const [officers, setOfficers] = useState([])
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [viewModal, setViewModal] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await caseService.getAll({ page, limit: 20, search, status: filterStatus })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load cases', 'error') }
    finally { setLoading(false) }
  }, [page, search, filterStatus])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    firService.getAll({ limit: 100 }).then(r => setFirs(r.data.data)).catch(() => {})
    officerService.getList().then(r => setOfficers(r.data.data)).catch(() => {})
  }, [])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => {
    setForm({ ...r, court_date: r.court_date?.split('T')[0] || '', closing_date: r.closing_date?.split('T')[0] || '' })
    setModal({ open: true, mode: 'edit', record: r })
  }

  const handleSave = async () => {
    if (!form.case_number) return toast('Case number is required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await caseService.create(form)
      else await caseService.update(modal.record.id, form)
      toast(`Case ${modal.mode === 'add' ? 'created' : 'updated'}`)
      setModal(p => ({ ...p, open: false })); load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await caseService.remove(confirm.id)
      toast('Case deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const STATUS_COLORS = { Open: 'badge-red', Closed: 'badge-green', Pending: 'badge-yellow', Dismissed: 'badge-gray' }

  const columns = [
    { key: 'case_number', label: 'Case No.', render: v => <span className="font-mono text-primary text-xs">{v}</span> },
    { key: 'fir_number', label: 'FIR' },
    { key: 'court', label: 'Court' },
    { key: 'judge', label: 'Judge' },
    { key: 'officer_name', label: 'Officer' },
    { key: 'status', label: 'Status', render: v => <span className={STATUS_COLORS[v] || 'badge-gray'}>{v}</span> },
    { key: 'investigation_status', label: 'Investigation' },
    { key: 'court_date', label: 'Court Date', render: v => v?.split('T')[0] || '—' },
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Briefcase size={20} className="text-primary" /> Case Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total cases</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> New Case</button>
      </div>

      <DataTable columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={setSearch} loading={loading} searchPlaceholder="Search case number, court..."
        filters={
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-32">
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      />

      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'New Case' : 'Edit Case'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Case Number *</label>
            <input value={form.case_number} onChange={e => sf('case_number', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Linked FIR</label>
            <select value={form.fir_id || ''} onChange={e => sf('fir_id', e.target.value)} className="input-field text-sm">
              <option value="">None</option>
              {firs.map(f => <option key={f.id} value={f.id}>{f.fir_number}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Court</label>
            <input value={form.court || ''} onChange={e => sf('court', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Judge</label>
            <input value={form.judge || ''} onChange={e => sf('judge', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Officer</label>
            <select value={form.officer_id || ''} onChange={e => sf('officer_id', e.target.value)} className="input-field text-sm">
              <option value="">None</option>
              {officers.map(o => <option key={o.id} value={o.id}>{o.name} ({o.badge_number})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={form.status} onChange={e => sf('status', e.target.value)} className="input-field text-sm">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Investigation Status</label>
            <select value={form.investigation_status} onChange={e => sf('investigation_status', e.target.value)} className="input-field text-sm">
              {INV_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Court Date</label>
            <input type="date" value={form.court_date || ''} onChange={e => sf('court_date', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Closing Date</label>
            <input type="date" value={form.closing_date || ''} onChange={e => sf('closing_date', e.target.value)} className="input-field text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea value={form.notes || ''} onChange={e => sf('notes', e.target.value)} rows={2} className="input-field text-sm resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setModal(p => ({ ...p, open: false }))} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Saving...' : modal.mode === 'add' ? 'Create Case' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, record: null })} title="Case Details" size="lg">
        {viewModal.record && (
          <div className="grid grid-cols-2 gap-3">
            {[['Case Number', viewModal.record.case_number], ['FIR', viewModal.record.fir_number],
              ['Court', viewModal.record.court], ['Judge', viewModal.record.judge],
              ['Officer', viewModal.record.officer_name], ['Status', viewModal.record.status],
              ['Investigation', viewModal.record.investigation_status], ['Court Date', viewModal.record.court_date?.split('T')[0]],
              ['Closing Date', viewModal.record.closing_date?.split('T')[0]]
            ].map(([k, v]) => (
              <div key={k} className="bg-white/3 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">{k}</div>
                <div className="text-sm text-white">{v || '—'}</div>
              </div>
            ))}
            {viewModal.record.notes && (
              <div className="col-span-2 bg-white/3 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Notes</div>
                <div className="text-sm text-gray-300">{viewModal.record.notes}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete} loading={saving} message="This will permanently delete the case." />
    </div>
  )
}
