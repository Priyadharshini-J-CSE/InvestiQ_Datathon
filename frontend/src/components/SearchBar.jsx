import { Search, X } from 'lucide-react'
import { useState } from 'react'

export default function SearchBar({ placeholder = 'Search...', onSearch, className = '' }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch?.(value)
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-10 pr-10"
      />
      {value && (
        <button type="button" onClick={() => { setValue(''); onSearch?.('') }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
          <X size={14} />
        </button>
      )}
    </form>
  )
}
