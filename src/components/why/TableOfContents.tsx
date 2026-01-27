import { motion } from 'framer-motion'
import { BookOpen, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  title: string
}

const TOC_ITEMS: Array<TocItem> = [
  { id: 'intro', title: 'Introduction' },
  { id: 'basics', title: 'The Basics' },
  { id: 'earth-sky', title: 'Earth-Sky Connection' },
  { id: 'lines', title: 'Planetary Lines' },
  { id: 'planets', title: 'The Planets' },
  { id: 'how-it-works', title: 'How It Works' },
  { id: 'customize', title: 'Customizing' },
  { id: 'technical', title: 'Technical Deep Dive' },
  { id: 'faq', title: 'FAQ' },
  { id: 'start', title: 'Get Started' },
]

interface TableOfContentsProps {
  className?: string
}

export default function TableOfContents({ className = '' }: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState('intro')
  const [isOpen, setIsOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / scrollHeight) * 100
      setScrollProgress(progress)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        threshold: 0.3,
        rootMargin: '-100px 0px -60% 0px',
      },
    )

    // Observe all sections
    TOC_ITEMS.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) {
        observer.observe(element)
      }
    })

    window.addEventListener('scroll', handleScroll)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsOpen(false)
    }
  }

  // Desktop sidebar
  const DesktopToc = () => (
    <nav
      className={`hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 w-56 z-40 ${className}`}
      aria-label="Table of contents"
    >
      {/* Progress bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div className="w-full bg-celestial-gold" style={{ height: `${scrollProgress}%` }} />
      </div>

      <div className="pl-6">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-4">
          <BookOpen className="w-4 h-4" />
          <span>Contents</span>
        </div>

        <ul className="space-y-1">
          {TOC_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => scrollToSection(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  activeSection === item.id
                    ? 'bg-celestial-gold/10 text-celestial-gold font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )

  // Mobile floating button + drawer
  const MobileToc = () => (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 p-4 bg-slate-800 border border-slate-700 rounded-full shadow-lg hover:bg-slate-700 transition-colors"
        aria-label="Open table of contents"
      >
        <BookOpen className="w-5 h-5 text-celestial-gold" />
      </button>

      {/* Drawer */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="lg:hidden fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-700 z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-white font-medium">
                  <BookOpen className="w-5 h-5 text-celestial-gold" />
                  <span>Table of Contents</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg"
                  aria-label="Close table of contents"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <ul className="space-y-2">
                {TOC_ITEMS.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeSection === item.id
                          ? 'bg-celestial-gold/10 text-celestial-gold font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </>
  )

  return (
    <>
      <DesktopToc />
      <MobileToc />
    </>
  )
}
