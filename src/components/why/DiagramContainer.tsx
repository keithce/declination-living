import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface DiagramContainerProps {
  children: ReactNode
  caption?: string
  className?: string
  animate?: boolean
}

export default function DiagramContainer({
  children,
  caption,
  className = '',
  animate = true,
}: DiagramContainerProps) {
  const Wrapper = animate ? motion.figure : 'figure'

  const animationProps = animate
    ? {
        initial: { opacity: 0, scale: 0.95 },
        whileInView: { opacity: 1, scale: 1 },
        viewport: { once: true },
        transition: { duration: 0.6 },
      }
    : {}

  return (
    <Wrapper
      className={`relative p-6 md:p-8 rounded-2xl bg-slate-900/50 border border-slate-700/50 ${className}`}
      {...animationProps}
    >
      <div className="flex items-center justify-center">{children}</div>
      {caption && (
        <figcaption className="mt-4 text-center text-sm text-slate-400 italic">
          {caption}
        </figcaption>
      )}
    </Wrapper>
  )
}
