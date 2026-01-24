import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useMemo, useEffect, useState } from 'react'
import {
  Sun,
  Moon,
  Sparkles,
  Globe,
  MapPin,
  ArrowRight,
  ChevronDown,
  Calculator,
  Target,
  Compass,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

// Planet data with colors and meanings
const PLANETS = [
  {
    name: 'Sun',
    symbol: '☉',
    meaning: 'Identity, vitality, core self',
    color: '#fbbf24',
    description: 'Your essential nature and life force',
  },
  {
    name: 'Moon',
    symbol: '☽',
    meaning: 'Emotions, intuition, comfort',
    color: '#e2e8f0',
    description: 'Your emotional landscape and inner needs',
  },
  {
    name: 'Mercury',
    symbol: '☿',
    meaning: 'Communication, intellect',
    color: '#a78bfa',
    description: 'How you think and express yourself',
  },
  {
    name: 'Venus',
    symbol: '♀',
    meaning: 'Love, beauty, relationships',
    color: '#f472b6',
    description: 'What you value and how you connect',
  },
  {
    name: 'Mars',
    symbol: '♂',
    meaning: 'Drive, energy, passion',
    color: '#ef4444',
    description: 'Your will and assertive force',
  },
  {
    name: 'Jupiter',
    symbol: '♃',
    meaning: 'Expansion, luck, abundance',
    color: '#f97316',
    description: 'Where you find growth and fortune',
  },
  {
    name: 'Saturn',
    symbol: '♄',
    meaning: 'Structure, discipline, mastery',
    color: '#78716c',
    description: 'Your lessons and responsibilities',
  },
  {
    name: 'Uranus',
    symbol: '♅',
    meaning: 'Innovation, awakening',
    color: '#22d3ee',
    description: 'Where you break free and innovate',
  },
  {
    name: 'Neptune',
    symbol: '♆',
    meaning: 'Spirituality, dreams, creativity',
    color: '#818cf8',
    description: 'Your connection to the transcendent',
  },
  {
    name: 'Pluto',
    symbol: '♇',
    meaning: 'Transformation, power',
    color: '#a3a3a3',
    description: 'Your deepest evolution and rebirth',
  },
]

// Star field component
function StarField() {
  const stars = useMemo(() => {
    return Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    }))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Orbital rings decoration
function OrbitalRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-20">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full border border-amber-500/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full border border-amber-500/20"
        animate={{ rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[1000px] h-[1000px] rounded-full border border-indigo-500/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

// Hero section
function HeroSection() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative min-h-[100vh] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Deep space gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #0f172a 40%, #050714 100%)',
        }}
      />

      {/* Celestial grid overlay */}
      <div className="absolute inset-0 celestial-grid opacity-50" />

      <StarField />
      <OrbitalRings />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      >
        {/* Decorative element */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-500/50" />
          <Sparkles className="w-6 h-6 text-amber-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500/50" />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-white mb-6 leading-[1.1]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Find Where the{' '}
          <span className="text-celestial-gradient italic">Stars</span>
          <br />
          Align for You
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          Discover your optimal living location using the ancient wisdom of
          planetary declination. Where on Earth does your birth chart resonate
          most powerfully?
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Link
            to="/calculator"
            className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-full overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(251,191,36,0.4)] hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              Calculate Your Locations
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
          <a
            href="#theory"
            className="px-8 py-4 text-slate-300 font-medium hover:text-white transition-colors flex items-center gap-2"
          >
            Learn More
            <ChevronDown className="w-4 h-4" />
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="w-6 h-6 text-slate-500" />
      </motion.div>
    </section>
  )
}

// Theory section
function TheorySection() {
  return (
    <section
      id="theory"
      className="relative py-32 px-6 bg-gradient-to-b from-[#050714] via-[#0a0f1f] to-[#0f172a]"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="grid lg:grid-cols-2 gap-16 items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          {/* Text content */}
          <div>
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Globe className="w-4 h-4" />
              The Science of Celestial Geography
            </motion.div>

            <motion.h2
              className="font-display text-4xl md:text-5xl font-semibold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              What is{' '}
              <span className="text-celestial-gradient italic">
                Declination
              </span>
              ?
            </motion.h2>

            <motion.div
              className="space-y-6 text-slate-300 text-lg leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <p>
                Just as Earth has latitude lines running parallel to the
                equator, the celestial sphere has{' '}
                <strong className="text-white">declination</strong> — measuring
                how far north or south a planet appears from the celestial
                equator.
              </p>
              <p>
                When a planet's declination in your natal chart matches a
                geographic latitude on Earth, you create what astrologers call a{' '}
                <strong className="text-amber-400">"parallel" alignment</strong>
                . This resonance amplifies that planet's influence in your life.
              </p>
              <p>
                Living at a latitude that aligns with your most important
                planets can enhance specific areas of life — from career success
                to spiritual growth, relationships to creative expression.
              </p>
            </motion.div>
          </div>

          {/* Visual illustration */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="aspect-square relative">
              {/* Globe representation */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-900/50 to-slate-900/50 border border-indigo-500/30" />

              {/* Latitude lines */}
              {[-60, -30, 0, 30, 60].map((lat) => (
                <div
                  key={lat}
                  className="absolute left-4 right-4 border-t border-dashed border-slate-600/50"
                  style={{
                    top: `${50 - lat * 0.6}%`,
                  }}
                >
                  <span className="absolute -left-8 -top-3 text-xs text-slate-500">
                    {lat}°
                  </span>
                </div>
              ))}

              {/* Planet marker */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2"
                style={{ top: '25%' }}
                animate={{ x: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-amber-500 glow-gold" />
                  <div className="absolute -right-20 top-1/2 -translate-y-1/2 whitespace-nowrap text-sm text-amber-400">
                    Your Sun: 23°N
                  </div>
                </div>
              </motion.div>

              {/* City marker */}
              <motion.div
                className="absolute left-1/2 translate-x-8"
                style={{ top: '25%' }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1 }}
              >
                <MapPin className="w-5 h-5 text-rose-400" />
                <span className="absolute left-6 top-0 text-sm text-slate-400 whitespace-nowrap">
                  Havana, Cuba
                </span>
              </motion.div>

              {/* Connection line */}
              <motion.div
                className="absolute left-1/2 w-px h-px"
                style={{ top: '25%' }}
                initial={{ width: 0 }}
                whileInView={{ width: 32 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="w-8 h-px bg-gradient-to-r from-amber-500 to-rose-400" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// How it works section
function HowItWorksSection() {
  const steps = [
    {
      icon: Calculator,
      title: 'Enter Your Birth Data',
      description:
        'Input your date, time, and place of birth. Precise birth time ensures accurate planetary positions.',
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: Target,
      title: 'Calculate Declinations',
      description:
        'We compute the exact celestial position of each planet at your birth moment using precise ephemeris data.',
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: Compass,
      title: 'Discover Your Locations',
      description:
        'Explore cities worldwide that align with your planetary declinations, scored by resonance strength.',
      color: 'from-emerald-500 to-teal-600',
    },
  ]

  return (
    <section className="relative py-32 px-6 bg-[#0f172a]">
      <div className="absolute inset-0 celestial-grid opacity-30" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-white mb-4">
            How It <span className="text-celestial-gradient italic">Works</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Three simple steps to discover where the cosmos wants you to thrive
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-slate-700 to-transparent" />
              )}

              <div className="relative p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm hover:border-slate-600/50 transition-colors">
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-400">
                  {index + 1}
                </div>

                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="font-display text-2xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Planet grid section
function PlanetGridSection() {
  return (
    <section className="relative py-32 px-6 bg-gradient-to-b from-[#0f172a] to-[#0a0f1f]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-white mb-4">
            The Celestial{' '}
            <span className="text-celestial-gradient italic">Influences</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Each planet governs different aspects of life. Weight them according
            to your priorities.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PLANETS.map((planet, index) => (
            <motion.div
              key={planet.name}
              className="group relative p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm hover:bg-slate-800/50 hover:border-slate-600/50 transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              {/* Planet symbol */}
              <div
                className="text-4xl mb-4 transition-transform group-hover:scale-110"
                style={{ color: planet.color }}
              >
                {planet.symbol}
              </div>

              {/* Planet name */}
              <h3 className="font-display text-xl font-semibold text-white mb-1">
                {planet.name}
              </h3>

              {/* Meaning */}
              <p className="text-sm text-slate-400">{planet.meaning}</p>

              {/* Hover detail */}
              <div className="absolute inset-0 p-6 rounded-2xl bg-slate-900/95 border border-slate-600/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center">
                <div
                  className="text-3xl mb-3"
                  style={{ color: planet.color }}
                >
                  {planet.symbol}
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  {planet.name}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {planet.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA section
function CTASection() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, #1e1b4b 0%, #0a0f1f 50%, #050714 100%)',
        }}
      />
      <div className="absolute inset-0 celestial-grid opacity-30" />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-20 left-[20%] w-32 h-32 rounded-full bg-amber-500/10 blur-3xl"
        animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 right-[20%] w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl"
        animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Decorative */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Sun className="w-8 h-8 text-amber-400" />
            <Moon className="w-6 h-6 text-slate-300" />
          </div>

          <h2 className="font-display text-4xl md:text-6xl font-semibold text-white mb-6">
            Ready to Find Your
            <br />
            <span className="text-celestial-gradient italic">
              Optimal Location
            </span>
            ?
          </h2>

          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Enter your birth data and let the stars guide you to the places
            where you'll thrive the most.
          </p>

          <Link
            to="/calculator"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-bold text-lg rounded-full transition-all duration-300 hover:shadow-[0_0_60px_rgba(251,191,36,0.5)] hover:scale-105"
          >
            <Globe className="w-6 h-6" />
            Find Your Optimal Location
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
          </Link>

          <p className="mt-6 text-sm text-slate-500">
            Free to use • No account required
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  return (
    <footer className="py-12 px-6 bg-[#050714] border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-amber-400" />
          <span className="font-display text-lg font-semibold text-white">
            Declination Living
          </span>
        </div>

        <p className="text-sm text-slate-500">
          Celestial cartography for the modern seeker
        </p>

        <div className="flex items-center gap-6 text-sm text-slate-400">
          <Link to="/calculator" className="hover:text-white transition-colors">
            Calculator
          </Link>
          <Link to="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  )
}

// Main landing page component
function LandingPage() {
  return (
    <div className="bg-[#050714] min-h-screen">
      <HeroSection />
      <TheorySection />
      <HowItWorksSection />
      <PlanetGridSection />
      <CTASection />
      <Footer />
    </div>
  )
}
