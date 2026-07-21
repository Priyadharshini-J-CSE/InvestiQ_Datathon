export default function Loader({ size = 'md', text = 'Loading...' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`${sizes[size]} border-2 border-white/10 border-t-primary rounded-full animate-spin`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-white/5 rounded w-3/4 mb-3" />
      <div className="h-8 bg-white/5 rounded w-1/2 mb-2" />
      <div className="h-3 bg-white/5 rounded w-full" />
    </div>
  )
}
