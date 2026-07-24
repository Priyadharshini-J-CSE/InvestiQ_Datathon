import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Eye, FileText, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { firService } from '../services/api'

const STATUS_COLORS = {
  Open: 'badge-red', Closed: 'badge-green',
  'Under Investigation': 'badge-blue', Pending: 'badge-yellow'
}

const STATUSES = ['Open', 'Closed', 'Under Investigation', 'Pending']
const CRIME_TYPES = ['Theft', 'Assault', 'Fraud', 'Murder', 'Robbery', 'Cybercrime', 'Drug Trafficking', 'Kidnapping', 'Domestic Violence', 'Burglary', 'Other']

const EMPTY = { fir_number: '', district: '', date: '', crime_type: '', ipc_sections: '', complainant: '', victim: '', accused: '', description: '', status: 'Open', officer_id: '' }

export default function FIRManagement() {
  const toast = useToast()
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'add', record: null })
  const [viewModal, setViewModal] = useState({ open: false, record: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await firService.getAll({ page, limit: 20, search, status: filterStatus })
      setData(res.data.data); setTotal(res.data.total); setPages(res.data.pages)
    } catch { toast('Failed to load FIRs', 'error') }
    finally { setLoading(false) }
  }, [page, search, filterStatus])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm(EMPTY); setModal({ open: true, mode: 'add', record: null }) }
  const openEdit = (r) => { setForm({ ...r, date: r.date?.split('T')[0] || '' }); setModal({ open: true, mode: 'edit', record: r }) }
  const openView = (r) => setViewModal({ open: true, record: r })

  const handleSave = async () => {
    if (!form.fir_number || !form.date) return toast('FIR number and date are required', 'error')
    setSaving(true)
    try {
      if (modal.mode === 'add') await firService.create(form)
      else await firService.update(modal.record.id, form)
      toast(`FIR ${modal.mode === 'add' ? 'created' : 'updated'} successfully`)
      setModal({ open: false, mode: 'add', record: null })
      load()
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await firService.remove(confirm.id)
      toast('FIR deleted'); setConfirm({ open: false, id: null }); load()
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'fir_number', label: 'FIR Number', render: v => <span className="font-mono text-primary text-xs">{v}</span> },
    { key: 'date', label: 'Date', render: v => v?.split('T')[0] || '—' },
    { key: 'crime_type', label: 'Crime Type' },
    { key: 'district', label: 'District' },
    { key: 'complainant', label: 'Complainant' },
    { key: 'status', label: 'Status', render: v => <span className={STATUS_COLORS[v] || 'badge-gray'}>{v}</span> },
    { key: 'officer_name', label: 'Officer' },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => (
        <div className="flex gap-1">
          <button onClick={() => openView(r)} className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-blue-400"><Eye size={14} /></button>
          <button onClick={() => navigate(`/fir/${r.id}/detail`)} className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-green-400" title="Full Detail"><ExternalLink size={14} /></button>
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-primary"><Edit2 size={14} /></button>
          <button onClick={() => setConfirm({ open: true, id: r.id })} className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-primary"><Trash2 size={14} /></button>
        </div>
      )
    }
  ]

  const F = ({ label, name, type = 'text', options }) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {options ? (
        <select value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} className="input-field text-sm">
          <option value="">Select {label}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={form[name] || ''} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} rows={3} className="input-field text-sm resize-none" />
      ) : (
        <input type={type} value={form[name] || ''} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} className="input-field text-sm" />
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><FileText size={20} className="text-primary" /> FIR Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total records</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm py-2 flex items-center gap-2"><Plus size={16} /> New FIR</button>
      </div>

      <DataTable
        columns={columns} data={data} total={total} page={page} pages={pages}
        onPageChange={setPage} onSearch={setSearch} loading={loading}
        searchPlaceholder="Search FIR number, complainant, accused..."
        filters={
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="input-field text-sm py-2 w-36">
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      />

      {/* Add/Edit Modal */}
      <Modal open={modal.open} onClose={() => setModal(p => ({ ...p, open: false }))}
        title={modal.mode === 'add' ? 'New FIR' : 'Edit FIR'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <F label="FIR Number *" name="fir_number" />
          <F label="Date *" name="date" type="date" />
          <F label="Crime Type" name="crime_type" options={CRIME_TYPES} />
          <F label="Status" name="status" options={STATUSES} />
          <F label="District" name="district" />
          <F label="IPC Sections" name="ipc_sections" />
          <F label="Complainant" name="complainant" />
          <F label="Victim" name="victim" />
          <F label="Accused" name="accused" />
          <div className="col-span-2"><F label="Description" name="description" type="textarea" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setModal(p => ({ ...p, open: false }))} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Saving...' : modal.mode === 'add' ? 'Create FIR' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, record: null })} title="FIR Details" size="lg">
        {viewModal.record && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['FIR Number', viewModal.record.fir_number],
                ['Date', viewModal.record.date?.split('T')[0]],
                ['Crime Type', viewModal.record.crime_type],
                ['Status', viewModal.record.status],
                ['District', viewModal.record.district],
                ['IPC Sections', viewModal.record.ipc_sections],
                ['Complainant', viewModal.record.complainant],
                ['Victim', viewModal.record.victim],
                ['Accused', viewModal.record.accused],
                ['Officer', viewModal.record.officer_name],
              ].map(([k, v]) => (
                <div key={k} className="bg-white/3 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{k}</div>
                  <div className="text-sm text-white">{v || '—'}</div>
                </div>
              ))}
            </div>
            {viewModal.record.description && (
              <div className="bg-white/3 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Description</div>
                <div className="text-sm text-gray-300">{viewModal.record.description}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={handleDelete} loading={saving}
        message="This will permanently delete the FIR record." />
    </div>
  )
}
