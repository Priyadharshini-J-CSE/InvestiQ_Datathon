import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Database } from 'lucide-react'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import { masterService } from '../services/api'

// ── Generic simple-list tab ────────────────────────────────────────────────────
function SimpleTab({ label, items, nameKey, onAdd, onEdit, onDelete }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">{items.length} records</span>
        <button onClick={onAdd} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"><Plus size={12} /> Add</button>
      </div>
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {items.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No records</p>}
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
            <span className="text-sm text-white">{item[nameKey]}</span>
            <div className="flex gap-1">
              <button onClick={() => onEdit(item)} className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-primary"><Edit2 size={12} /></button>
              <button onClick={() => onDelete(item.id)} className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-primary"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab config ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'ranks',       label: 'Ranks',       nameKey: 'rank_name',        get: () => masterService.getRanks(),       create: d => masterService.createRank(d),       update: (id,d) => masterService.updateRank(id,d),       del: id => masterService.deleteRank(id),       field: 'rank_name',        extra: { hierarchy: { label: 'Hierarchy', type: 'number' } } },
  { key: 'designations',label: 'Designations',nameKey: 'designation_name', get: () => masterService.getDesignations(),create: d => masterService.createDesignation(d),update: (id,d) => masterService.updateDesignation(id,d),del: id => masterService.deleteDesignation(id),field: 'designation_name' },
  { key: 'occupations', label: 'Occupations', nameKey: 'occupation_name',  get: () => masterService.getOccupations(), create: d => masterService.createOccupation(d), update: (id,d) => masterService.updateOccupation(id,d), del: id => masterService.deleteOccupation(id), field: 'occupation_name' },
  { key: 'religions',   label: 'Religions',   nameKey: 'religion_name',    get: () => masterService.getReligions(),   create: d => masterService.createReligion(d),   update: (id,d) => masterService.updateReligion(id,d),   del: id => masterService.deleteReligion(id),   field: 'religion_name' },
  { key: 'castes',      label: 'Castes',      nameKey: 'caste_name',       get: () => masterService.getCastes(),      create: d => masterService.createCaste(d),      update: (id,d) => masterService.updateCaste(id,d),      del: id => masterService.deleteCaste(id),      field: 'caste_name' },
  { key: 'case_statuses',label:'Case Statuses',nameKey:'status_name',      get: () => masterService.getCaseStatuses(),create: d => masterService.createCaseStatus(d), update: (id,d) => masterService.updateCaseStatus(id,d), del: id => masterService.deleteCaseStatus(id), field: 'status_name', extra: { description: { label: 'Description', type: 'text' } } },
  { key: 'states',      label: 'States',      nameKey: 'state_name',       get: () => masterService.getStates(),      create: d => masterService.createState(d),      update: (id,d) => masterService.updateState(id,d),      del: id => masterService.deleteState(id),      field: 'state_name', extra: { country: { label: 'Country', type: 'text' } } },
]

export default function MasterData() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('ranks')
  const [data, setData] = useState({})
  const [modal, setModal] = useState({ open: false, tab: null, record: null })
  const [confirm, setConfirm] = useState({ open: false, tab: null, id: null })
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const tab = TABS.find(t => t.key === activeTab)

  const loadTab = async (key) => {
    const t = TABS.find(x => x.key === key)
    if (!t) return
    try {
      const res = await t.get()
      setData(p => ({ ...p, [key]: res.data.data }))
    } catch { toast(`Failed to load ${t.label}`, 'error') }
  }

  useEffect(() => { loadTab(activeTab) }, [activeTab])

  const openAdd = () => {
    const empty = { [tab.field]: '' }
    if (tab.extra) Object.keys(tab.extra).forEach(k => { empty[k] = '' })
    setForm(empty)
    setModal({ open: true, tab: activeTab, record: null })
  }

  const openEdit = (record) => {
    setForm({ ...record })
    setModal({ open: true, tab: activeTab, record })
  }

  const handleSave = async () => {
    if (!form[tab.field]) return toast(`${tab.field} is required`, 'error')
    setSaving(true)
    try {
      if (modal.record) await tab.update(modal.record.id, form)
      else await tab.create(form)
      toast('Saved successfully')
      setModal({ open: false, tab: null, record: null })
      loadTab(activeTab)
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await confirm.tab.del(confirm.id)
      toast('Deleted')
      setConfirm({ open: false, tab: null, id: null })
      loadTab(activeTab)
    } catch (err) { toast(err.response?.data?.error || 'Delete failed', 'error') }
    finally { setSaving(false) }
  }

  const items = data[activeTab] || []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Database size={20} className="text-primary" /> Master Data</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage lookup tables and reference data</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === t.key ? 'bg-primary/10 border border-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">{tab?.label}</h2>
        <SimpleTab
          label={tab?.label}
          items={items}
          nameKey={tab?.nameKey || 'name'}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={(id) => setConfirm({ open: true, tab, id })}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, tab: null, record: null })}
        title={modal.record ? `Edit ${tab?.label}` : `Add ${tab?.label}`} size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1 capitalize">{tab?.field?.replace(/_/g, ' ')} *</label>
            <input value={form[tab?.field] || ''} onChange={e => setForm(p => ({ ...p, [tab.field]: e.target.value }))}
              className="input-field text-sm" autoFocus />
          </div>
          {tab?.extra && Object.entries(tab.extra).map(([k, cfg]) => (
            <div key={k}>
              <label className="block text-xs text-gray-400 mb-1">{cfg.label}</label>
              <input type={cfg.type} value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                className="input-field text-sm" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => setModal({ open: false, tab: null, record: null })} className="btn-ghost text-sm py-2 px-4">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
            {saving ? 'Saving...' : modal.record ? 'Save' : 'Add'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, tab: null, id: null })}
        onConfirm={handleDelete} loading={saving} message="This will permanently delete this record." />
    </div>
  )
}
