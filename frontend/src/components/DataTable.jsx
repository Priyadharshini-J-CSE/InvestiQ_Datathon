import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react'

export default function DataTable({
  columns, data, total, page, pages, onPageChange,
  onSearch, searchPlaceholder = 'Search...', loading = false,
  actions, filters, emptyText = 'No records found'
}) {
  const [q, setQ] = useState('')

  const handleSearch = (e) => {
    setQ(e.target.value)
    onSearch?.(e.target.value)
  }

  return (
    <div className="card border border-white/5 p-0 overflow-hidden">
      {/* Toolbar */}
      {(onSearch || filters || actions) && (
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-white/5">
          {onSearch && (
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={q} onChange={handleSearch} placeholder={searchPlaceholder}
                className="input-field pl-9 py-2 text-sm" />
            </div>
          )}
          {filters && <div className="flex gap-2">{filters}</div>}
          {actions && <div className="ml-auto flex gap-2">{actions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map(col => (
                <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="text-center py-16">
                <Loader2 size={24} className="animate-spin text-primary mx-auto" />
              </td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-16 text-gray-500">{emptyText}</td></tr>
            ) : data.map((row, i) => (
              <motion.tr key={row.id || i}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="border-b border-white/5 hover:bg-white/3 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <span className="text-xs text-gray-500">
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
              className="p-1.5 rounded hover:bg-white/5 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i
              if (p < 1 || p > pages) return null
              return (
                <button key={p} onClick={() => onPageChange(p)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-all ${p === page ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => onPageChange(page + 1)} disabled={page === pages}
              className="p-1.5 rounded hover:bg-white/5 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
