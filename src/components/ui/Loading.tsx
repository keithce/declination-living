import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Loading({ message = 'Loading...', size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12"
    >
      <Loader2 className={`${sizeClasses[size]} text-amber-400 animate-spin`} />
      {message && <p className="mt-3 text-slate-400 text-sm">{message}</p>}
    </motion.div>
  )
}

export function LoadingPage({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050714] via-[#0a0f1f] to-[#0f172a] flex items-center justify-center">
      <Loading message={message} size="lg" />
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-6 animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-3/4 mb-4" />
      <div className="h-3 bg-slate-700/50 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-700/50 rounded w-2/3" />
    </div>
  )
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  )
}
