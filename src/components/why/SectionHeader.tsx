import { Link2 } from 'lucide-react'
import { useState } from 'react'

interface SectionHeaderProps {
  id: string
  title: string
  subtitle?: string
  highlight?: string
}

export default function SectionHeader({ id, title, subtitle, highlight }: SectionHeaderProps) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
