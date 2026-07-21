import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, MapPin, Scale, Camera, FileText, Video, Shield, Clock } from 'lucide-react'
import { criminals } from '../utils/mockData'

const chainOfCustody = [
  { event: 'Arrest Warrant Issued', date: '2024-01-15', officer: 'SI Ramesh Kumar', status: 'completed' },
  { event: 'FIR Filed', date: '2024-01-16', officer: 'ASI Suresh Gowda', status: 'completed' },
  { event: 'Evidence Collected', date: '2024-01-18', officer: 'FSL Team', status: 'completed' },
  { event: 'Chargesheet Filed', date: '2024-02-10', officer: 'PI Mahesh Nair', status: 'completed' },
  { event: 'Court Hearing', date: '2024-03-05', officer: 'PP Ganesh Rao', status: 'pending' },
]

export default function CriminalProfile() {
  const { id } = useParams()
  const criminal = criminals.find(c => c.id === id) || criminals[0]

  const riskColor = criminal.riskScore >= 80 ? '#FF2D2D' : criminal.riskScore >= 60 ? '#FFB74D' : '#00D26A'

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="card border border-white/5 text-center">
          <div className="relative inline-block mb-4">
            <img src={criminal.photo} alt={criminal.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-primary/30 mx-auto" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: riskColor }}>
              <AlertTriangle size={12} className="text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{criminal.name}</h2>
          <p className="text-sm text-gray-500 mb-1">"{criminal.alias}"</p>
          <span className={`badge ${criminal.status === 'Wanted' ? 'badge-red' : criminal.status === 'Arrested' ? 'badge-green' : 'badge-yellow'} mb-4`}>
            {criminal.status}
          </span>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
            <div>
              <div className="text-xl font-bold" style={{ color: riskColor }}>{criminal.riskScore}</div>
              <div className="text-xs text-gray-500">Risk Score</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">{criminal.arrests}</div>
              <div className="text-xs text-gray-500">Arrests</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">{criminal.age}</div>
              <div className="text-xs text-gray-500">Age</div>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-left">
            <div className="flex items-center gap-2 text-sm">
              <Shield size={13} className="text-primary" />
              <span className="text-gray-500">Category:</span>
              <span className="text-gray-300">{criminal.category}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={13} className="text-primary" />
              <span className="text-gray-500">District:</span>
              <span className="text-gray-300">{criminal.district}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Scale size={13} className="text-primary" />
              <span className="text-gray-500">Court:</span>
              <span className="text-gray-300">{criminal.courtStatus}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={13} className="text-yellow-400" />
              <span className="text-gray-500">Last Known:</span>
              <span className="text-gray-300">{criminal.lastKnown}</span>
            </div>
          </div>
        </motion.div>

        {/* Evidence */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card border border-white/5">
          <h3 className="font-semibold text-white mb-4">Evidence</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Camera size={14} className="text-primary" />
                <span className="text-sm text-gray-400">Photos (6)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3,4,5,6].map(n => (
                  <div key={n} className="aspect-square bg-white/5 rounded-lg overflow-hidden">
                    <img src={`https://picsum.photos/80/80?random=${n + 20}`} alt="" className="w-full h-full object-cover opacity-70" />
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-white/5 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Video size={14} className="text-blue-400" />
                <span className="text-sm text-gray-400">Videos (2)</span>
              </div>
              {['CCTV_Footage_01.mp4', 'Interrogation_Recording.mp4'].map(v => (
                <div key={v} className="flex items-center gap-2 py-1.5 text-xs text-gray-500 hover:text-gray-300 cursor-pointer">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  {v}
                </div>
              ))}
            </div>
            <div className="border-t border-white/5 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-green" />
                <span className="text-sm text-gray-400">Documents (4)</span>
              </div>
              {['FIR_2024_01045.pdf', 'Chargesheet.pdf', 'Witness_Statement.pdf', 'Forensic_Report.pdf'].map(d => (
                <div key={d} className="flex items-center gap-2 py-1.5 text-xs text-gray-500 hover:text-gray-300 cursor-pointer">
                  <div className="w-2 h-2 bg-green rounded-full" />
                  {d}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Chain of Custody */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="card border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-primary" />
            <h3 className="font-semibold text-white">Chain of Custody</h3>
          </div>
          <div className="space-y-0">
            {chainOfCustody.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${item.status === 'completed' ? 'bg-green' : 'bg-yellow-400'}`} />
                  {i < chainOfCustody.length - 1 && <div className="w-px flex-1 bg-white/5 my-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-white">{item.event}</p>
                  <p className="text-xs text-gray-500">{item.date}</p>
                  <p className="text-xs text-gray-600">{item.officer}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
