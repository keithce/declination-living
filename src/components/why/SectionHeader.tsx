import { Link2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface SectionHeaderProps {
  id: string
  title: string
  subtitle?: string
  highlight?: string
}

export function SectionHeader({ id, title, subtitle, highlight }: SectionHeaderProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const copyLink = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may fail in insecure contexts or without permission
      console.warn('Failed to copy link to clipboard')
    }
  }, [id])

  // Split title to insert gradient on highlight word
  const renderTitle = () => {
    if (!highlight) {
      return <span>{title}</span>
    }

    const parts = title.split(highlight)
    if (parts.length === 1) {
      return <span>{title}</span>
    }

    return (
      <>
        {parts[0]}
        <span className="text-celestial-gradient italic">{highlight}</span>
        {parts[1]}
      </>
    )
  }

  return (
    <div className="mb-12 group">
      <div className="flex items-center gap-4">
        <h2
          id={id}
          className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-white scroll-mt-24"
        >
          {renderTitle()}
        </h2>
        <button
          type="button"
          onClick={copyLink}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-800 rounded-lg"
          aria-label={`Copy link to ${title} section`}
        >
          <Link2 className="w-5 h-5 text-slate-400 hover:text-celestial-gold" />
        </button>
        {copied && (
          <span className="text-sm text-celestial-gold animate-fade-in">Link copied!</span>
        )}
      </div>
      {subtitle && <p className="mt-4 text-lg text-slate-400 max-w-3xl">{subtitle}</p>}
    </div>
  )
}
