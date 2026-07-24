import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Users, HeartPulse, UserX, Scale, Camera,
  UserCheck, FileCheck, ChevronDown, ChevronUp, ArrowLeft, Loader2
} from 'lucide-react'
import { firDetailService } from '../services/api'
import { useToast } from '../components/Toast'

const STATUS_COLORS = {
  Open: 'badge-red', Closed: 'badge-green', 'Under Investigation': 'badge-blue',
  Pending: 'badge-yellow', Filed: 'badge-green', Draft: 'badge-gray',
  Arrested: 'badge-green', Absconding: 'badge-red', Fatal: 'badge-red',
  Grievous: 'badge-yellow', Minor: 'badge-blue', None: 'badge-gray',
}

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map(([k, v]) => (
        <div key={k} className="bg-white/3 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">{k}</div>
          <div className="text-sm text-white font-medium">{v || '—'}</div>
        </div>
      ))}
    </div>
  )
}

function Section({ icon: Icon, title, count, color = 'text-primary', children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card border border-white/5 p-0 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors">
        <div className="flex items-center gap-3">
          <Icon size={18} className={color} />
          <span className="text-sm font-semibold text-white">{title}</span>
          <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">{count}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-white/5 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ text }) {
  return <p className="text-gray-500 text-sm text-center py-4">{text}</p>
}

export default function FIRDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    firDetailService.getDetail(id)
      .then(r => setDetail(r.data.data))
      .catch(() => toast('Failed to load FIR details', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  )

  if (!detail) return (
    <div className="text-center py-16 text-gray-500">FIR not found</div>
  )

  const { fir, complainants, victims, accused, charges, evidence, arrests, chargesheets } = detail

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            FIR Details — <span className="font-mono text-primary">{fir.fir_number}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Complete case intelligence view</p>
        </div>
        <span className={STATUS_COLORS[fir.status] || 'badge-gray'}>{fir.status}</span>
      </div>

      {/* FIR Info */}
      <Section icon={FileText} title="FIR Information" count={1} color="text-primary">
        <InfoGrid items={[
          ['FIR Number', fir.fir_number],
          ['Date', fir.date?.split('T')[0]],
          ['Crime Type', fir.crime_type],
          ['IPC Sections', fir.ipc_sections],
          ['District', fir.district],
          ['Station', fir.station_name],
          ['Officer', fir.officer_name],
          ['Status', fir.status],
        ]} />
        {fir.description && (
          <div className="mt-3 bg-white/3 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Description</div>
            <div className="text-sm text-gray-300">{fir.description}</div>
          </div>
        )}
      </Section>

      {/* Victims */}
      <Section icon={HeartPulse} title="Victims" count={victims.length} color="text-red-400">
        {victims.length === 0 ? <EmptyState text="No victims recorded" /> : (
          <div className="space-y-3">
            {victims.map((v, i) => (
              <div key={v.id} className="bg-white/3 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">#{i + 1} {v.victim_name}</span>
                  <div className="flex gap-2">
                    {v.victim_type && <span className="badge-blue">{v.victim_type}</span>}
                    {v.injury_type && <span className={STATUS_COLORS[v.injury_type] || 'badge-gray'}>{v.injury_type}</span>}
                  </div>
                </div>
                <InfoGrid items={[['Age', v.age], ['Gender', v.gender], ['Hospital', v.hospital]]} />
                {v.remarks && <p className="text-xs text-gray-400 mt-2">{v.remarks}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Complainants */}
      <Section icon={Users} title="Complainants" count={complainants.length} color="text-blue-400">
        {complainants.length === 0 ? <EmptyState text="No complainants recorded" /> : (
          <div className="space-y-3">
            {complainants.map((c, i) => (
              <div key={c.id} className="bg-white/3 rounded-lg p-4">
                <div className="text-sm font-semibold text-white mb-3">#{i + 1} {c.full_name}</div>
                <InfoGrid items={[
                  ['Age', c.age], ['Gender', c.gender], ['Mobile', c.mobile],
                  ['Occupation', c.occupation], ['Religion', c.religion], ['Caste', c.caste],
                ]} />
                {c.address && (
                  <div className="mt-2 text-xs text-gray-400"><span className="text-gray-500">Address: </span>{c.address}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Accused */}
      <Section icon={UserX} title="Accused" count={accused.length} color="text-orange-400">
        {accused.length === 0 ? <EmptyState text="No accused recorded" /> : (
          <div className="space-y-3">
            {accused.map((a, i) => (
              <div key={a.id} className="bg-white/3 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">#{i + 1} {a.accused_name}</span>
                  <span className={STATUS_COLORS[a.status] || 'badge-gray'}>{a.status}</span>
                </div>
                <InfoGrid items={[
                  ['Alias', a.alias], ['Age', a.age], ['Gender', a.gender],
                  ['Criminal ID', a.criminal_ref], ['Risk Level', a.risk_level],
                ]} />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Charges */}
      <Section icon={Scale} title="Charges" count={charges.length} color="text-yellow-400">
        {charges.length === 0 ? <EmptyState text="No charges recorded" /> : (
          <div className="space-y-3">
            {charges.map((c, i) => (
              <div key={c.id} className="bg-white/3 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">IPC {c.ipc_section}</span>
                  <span className={STATUS_COLORS[c.status] || 'badge-gray'}>{c.status}</span>
                </div>
                <InfoGrid items={[['Case', c.case_number], ['Filed Date', c.filed_date?.split('T')[0]]]} />
                {c.description && <p className="text-xs text-gray-400 mt-2">{c.description}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Evidence */}
      <Section icon={Camera} title="Evidence" count={evidence.length} color="text-purple-400">
        {evidence.length === 0 ? <EmptyState text="No evidence recorded" /> : (
          <div className="space-y-3">
            {evidence.map((e, i) => (
              <div key={e.id} className="bg-white/3 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">#{i + 1} {e.evidence_type}</span>
                  <span className={e.status === 'Active' ? 'badge-green' : 'badge-gray'}>{e.status}</span>
                </div>
                <InfoGrid items={[
                  ['Collected By', e.collected_by_name],
                  ['Date', e.collected_date?.split('T')[0]],
                  ['Location', e.location],
                ]} />
                {e.description && <p className="text-xs text-gray-400 mt-2">{e.description}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Arrests */}
      <Section icon={UserCheck} title="Arrests" count={arrests.length} color="text-green-400">
        {arrests.length === 0 ? <EmptyState text="No arrests recorded" /> : (
          <div className="space-y-3">
            {arrests.map((a, i) => (
              <div key={a.id} className="bg-white/3 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">#{i + 1} {a.criminal_name}</span>
                  <span className={a.bail_status === 'Granted' ? 'badge-green' : a.bail_status === 'Denied' ? 'badge-red' : 'badge-gray'}>
                    Bail: {a.bail_status}
                  </span>
                </div>
                <InfoGrid items={[
                  ['Date', a.arrest_date?.split('T')[0]],
                  ['Officer', a.officer_name],
                  ['Location', a.location],
                  ['Custody', a.custody_status],
                ]} />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Chargesheets */}
      <Section icon={FileCheck} title="Chargesheets" count={chargesheets.length} color="text-cyan-400">
        {chargesheets.length === 0 ? <EmptyState text="No chargesheets filed" /> : (
          <div className="space-y-3">
            {chargesheets.map((cs, i) => (
              <div key={cs.id} className="bg-white/3 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">#{i + 1} {cs.chargesheet_type || 'Chargesheet'}</span>
                  <span className={STATUS_COLORS[cs.status] || 'badge-gray'}>{cs.status}</span>
                </div>
                <InfoGrid items={[
                  ['Date', cs.chargesheet_date?.split('T')[0]],
                  ['Filed By', cs.filed_by],
                  ['Created By', cs.created_by_name],
                ]} />
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
