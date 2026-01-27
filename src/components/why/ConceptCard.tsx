import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'

interface ConceptCardProps {
  icon: LucideIcon
  title: string
  description: string
  expandedContent?: string
  iconColor?: string
}

export function ConceptCard({
  icon: Icon,
  title,
  description,
  expandedContent,
  iconColor = 'text-celestial-gold',
}: ConceptCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      className="relative p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 hover:border-slate-600/50 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl bg-slate-900/50 flex items-center justify-center ${iconColor}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-slate-300 leading-relaxed">{description}</p>

          {expandedContent && (
            <>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="mt-4 pt-4 border-t border-slate-700/50 text-slate-400 leading-relaxed">
                      {expandedContent}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-4 flex items-center gap-1 text-sm text-celestial-gold hover:text-celestial-amber transition-colors"
              >
                {expanded ? 'Show less' : 'Learn more'}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
