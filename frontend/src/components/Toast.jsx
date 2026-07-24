import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle }
  const colors = { success: 'text-green border-green/20', error: 'text-primary border-primary/20', warning: 'text-yellow-400 border-yellow-400/20' }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = icons[t.type] || CheckCircle
            return (
              <motion.div key={t.id} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
                className={`flex items-center gap-3 glass border rounded-lg px-4 py-3 min-w-[280px] shadow-xl ${colors[t.type]}`}>
                <Icon size={16} />
                <span className="text-sm text-white flex-1">{t.message}</span>
                <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
