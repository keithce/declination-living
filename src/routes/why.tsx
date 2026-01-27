import { Link, createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Compass,
  Globe,
  Layers,
  Lightbulb,
  MapPin,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'

import {
  ACGLinesDiagram,
  CelestialSphereDiagram,
  ConceptCard,
  DeclinationLatitudeDiagram,
  DiagramContainer,
  FAQAccordion,
  ParanConceptDiagram,
  PlanetInfoCard,
  SectionHeader,
  TableOfContents,
  WeightingDiagram,
  ZenithConceptDiagram,
} from '@/components/why'

export const Route = createFileRoute('/why')({
  component: WhyPage,
})

// Planet data with detailed interpretations
const PLANET_DATA = [
  {
    planetId: 'sun' as const,
    name: 'Sun',
    lifeAreas: ['Identity', 'Vitality', 'Purpose', 'Leadership'],
    whenStrong:
      'Strong sense of self, natural leadership, creative expression flows easily, good health and energy.',
    whenChallenging:
      'May feel pressured to perform, ego conflicts, need to balance self-expression with humility.',
    detailedInterpretation:
      'Living on your Sun line brings your core essence into focus. You feel more "yourself" here, with opportunities to shine and express your unique gifts. Career advancement and recognition often come more easily in these locations.',
  },
  {
    planetId: 'moon' as const,
    name: 'Moon',
    lifeAreas: ['Emotions', 'Home', 'Intuition', 'Nurturing'],
    whenStrong:
      'Deep emotional fulfillment, strong intuition, nurturing environment, sense of belonging.',
    whenChallenging:
      'Emotional sensitivity heightened, may feel exposed or vulnerable, mood fluctuations.',
    detailedInterpretation:
      'Moon lines create a sense of home and emotional security. These are places where you can truly rest, connect with your inner self, and feel emotionally nourished. Excellent for family life and personal healing.',
  },
  {
    planetId: 'mercury' as const,
    name: 'Mercury',
    lifeAreas: ['Communication', 'Learning', 'Commerce', 'Travel'],
    whenStrong:
      'Mental clarity, excellent communication, successful negotiations, good for writing and teaching.',
    whenChallenging: 'Mental restlessness, nervous energy, may overthink, scattered focus.',
    detailedInterpretation:
      'Mercury lines enhance intellectual pursuits and communication. Ideal for students, writers, teachers, and those in media or commerce. Ideas flow more easily and networking opportunities abound.',
  },
  {
    planetId: 'venus' as const,
    name: 'Venus',
    lifeAreas: ['Love', 'Beauty', 'Relationships', 'Pleasure'],
    whenStrong:
      'Romantic opportunities, aesthetic appreciation, harmonious relationships, financial ease.',
    whenChallenging:
      'May become too focused on pleasure, superficiality, or dependent on others for validation.',
    detailedInterpretation:
      'Venus lines bring love, beauty, and harmony into your life. These locations favor romantic relationships, artistic pursuits, and financial growth. Social connections come naturally here.',
  },
  {
    planetId: 'mars' as const,
    name: 'Mars',
    lifeAreas: ['Action', 'Energy', 'Courage', 'Competition'],
    whenStrong:
      'High energy and motivation, courage to take action, athletic success, passionate pursuits.',
    whenChallenging:
      'Conflicts and confrontations, accidents if not careful, aggression, impatience.',
    detailedInterpretation:
      'Mars lines energize and motivate. Excellent for starting new ventures, physical training, and competitive environments. Be mindful of the increased potential for conflict and channel energy constructively.',
  },
  {
    planetId: 'jupiter' as const,
    name: 'Jupiter',
    lifeAreas: ['Expansion', 'Luck', 'Wisdom', 'Abundance'],
    whenStrong:
      'Opportunities abound, philosophical growth, travel blessings, generous support from others.',
    whenChallenging:
      'Over-expansion, excess, weight gain, taking on too much, unrealistic optimism.',
    detailedInterpretation:
      'Jupiter lines are traditionally the most fortunate. These locations bring expansion, luck, and opportunity. Excellent for education, publishing, legal matters, and spiritual growth. Life tends to feel more hopeful here.',
  },
  {
    planetId: 'saturn' as const,
    name: 'Saturn',
    lifeAreas: ['Structure', 'Discipline', 'Mastery', 'Responsibility'],
    whenStrong:
      'Building lasting foundations, career achievements through hard work, respected authority.',
    whenChallenging:
      'Heavy responsibilities, delays and obstacles, feelings of limitation, isolation.',
    detailedInterpretation:
      'Saturn lines demand discipline but reward perseverance. These locations are ideal for serious career building, establishing structure, and long-term goals. Expect challenges that ultimately strengthen you.',
  },
  {
    planetId: 'uranus' as const,
    name: 'Uranus',
    lifeAreas: ['Innovation', 'Freedom', 'Revolution', 'Technology'],
    whenStrong:
      'Breakthrough insights, exciting changes, technological innovation, authentic self-expression.',
    whenChallenging:
      'Instability, sudden disruptions, difficulty maintaining routine, rebellious tendencies.',
    detailedInterpretation:
      'Uranus lines bring awakening and revolution. Perfect for those seeking radical change, technological innovation, or breaking free from limitations. Life here is never boring but can be unpredictable.',
  },
  {
    planetId: 'neptune' as const,
    name: 'Neptune',
    lifeAreas: ['Spirituality', 'Creativity', 'Dreams', 'Compassion'],
    whenStrong:
      'Spiritual growth, artistic inspiration, compassionate connections, transcendent experiences.',
    whenChallenging:
      'Confusion, escapism, boundary issues, susceptibility to deception or addiction.',
    detailedInterpretation:
      'Neptune lines dissolve boundaries and open spiritual doors. Ideal for artists, healers, and spiritual seekers. Be mindful of staying grounded and maintaining clear boundaries in these locations.',
  },
  {
    planetId: 'pluto' as const,
    name: 'Pluto',
    lifeAreas: ['Transformation', 'Power', 'Rebirth', 'Depth'],
    whenStrong:
      'Profound personal transformation, accessing hidden power, psychological depth, influence.',
    whenChallenging:
      'Power struggles, intense experiences, confronting shadow aspects, manipulation.',
    detailedInterpretation:
      'Pluto lines catalyze deep transformation. These locations strip away the superficial and demand authenticity. Life here involves profound change—death and rebirth of old patterns. Not for the faint of heart, but incredibly powerful for growth.',
  },
]

// FAQ data
const FAQ_ITEMS = [
  {
    question: 'How accurate are these calculations?',
    answer:
      'Our calculations use the Swiss Ephemeris, the gold standard for astronomical precision used by professional astrologers worldwide. Planetary positions are accurate to within fractions of a degree. However, astrology interpretation is an art as much as a science—the calculations show potential, not guarantees.',
  },
  {
    question: 'Do I need to know my exact birth time?',
    answer:
      "An exact birth time gives the most accurate results, especially for the Moon (which moves quickly) and for angular house positions. If you only know an approximate time, you can still get valuable results for slower-moving planets. If you don't know your birth time at all, you can still explore planetary declinations, though some features will be limited.",
  },
  {
    question: 'What if I already live in a "bad" location for me?',
    answer:
      'First, remember that no location is entirely good or bad—each has its own gifts and challenges. The calculations show tendencies, not fate. Many people thrive in locations that might seem challenging astrologically because other factors (community, career, family) outweigh the astrological influences. Use this as one factor among many in your decision-making.',
  },
  {
    question: 'How is this different from regular Astro*Carto*Graphy?',
    answer:
      "Traditional Astro*Carto*Graphy (ACG) focuses on zodiacal longitude—where planets are in the zodiac signs. Declination-based relocation adds a second dimension: how far north or south planets are from the celestial equator. This creates a direct correspondence with Earth's latitude lines, revealing influences that traditional ACG misses.",
  },
  {
    question: 'Can I use this for travel as well as relocation?',
    answer:
      'Absolutely! While long-term residence amplifies planetary influences, even short visits to powerful locations can be meaningful. Many people use this for timing important trips, choosing vacation destinations, or planning business travel.',
  },
  {
    question: 'What are "out of bounds" planets?',
    answer:
      'Planets are "out of bounds" (OOB) when their declination exceeds the Sun\'s maximum (about 23.4°). OOB planets operate outside normal rules, often indicating exceptional abilities or unusual experiences in that planet\'s domain. If you have OOB planets, locations at higher latitudes may particularly resonate for you.',
  },
  {
    question: 'How do I interpret multiple planetary influences at one location?',
    answer:
      'Multiple planets at the same location create a blend of influences. The overall effect depends on which planets are involved and how they relate to your personal goals. Our weighting system lets you prioritize what matters most to you, so the scoring reflects your unique priorities.',
  },
  {
    question: 'Why do some locations feel different than their score suggests?',
    answer:
      "Astrological influences interact with many other factors: local culture, climate, economic opportunities, social connections, and your own life circumstances. A location might score highly for career (Saturn, Jupiter) but feel challenging if you're seeking relaxation. Always balance astrological insights with practical considerations.",
  },
]

function WhyPage() {
  return (
    <div className="min-h-screen bg-[#050714]">
      <TableOfContents />

      <main className="lg:ml-64">
        {/* Skip to content link */}
        <a
          href="#intro"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-celestial-gold focus:text-slate-900 focus:rounded-lg"
        >
          Skip to content
        </a>

        {/* Section 1: Introduction/Hero */}
        <section
          id="intro"
          className="relative min-h-[70vh] flex items-center justify-center px-6 py-24"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #0f172a 40%, #050714 100%)',
            }}
          />
          <div className="absolute inset-0 celestial-grid opacity-30" />

          <motion.div
            className="relative z-10 max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-celestial-gold" />
              <span className="text-celestial-gold text-sm font-medium tracking-wide uppercase">
                Understanding Declination Living
              </span>
              <Sparkles className="w-6 h-6 text-celestial-gold" />
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold text-white mb-6 leading-tight">
              Why Does <span className="text-celestial-gradient italic">Where You Live</span>{' '}
              Matter?
            </h1>

            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
              Discover the cosmic connection between the sky at your birth and the places on Earth
              where you can thrive. No astrology background needed—we'll explain everything.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#basics"
                className="px-6 py-3 bg-celestial-gold text-slate-900 font-semibold rounded-full hover:bg-celestial-amber transition-colors"
              >
                Start Learning
              </a>
              <Link
                to="/calculator"
                className="px-6 py-3 border border-slate-600 text-white font-medium rounded-full hover:bg-slate-800 transition-colors"
              >
                Try the Calculator
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Section 2: The Basics */}
        <section
          id="basics"
          className="relative py-24 px-6 bg-gradient-to-b from-[#050714] to-[#0a0f1f]"
        >
          <div className="max-w-4xl mx-auto">
            <SectionHeader
              id="basics"
              title="The Basics: What is Declination?"
              subtitle="The second dimension of planetary position that most astrologers overlook."
              highlight="Declination"
            />

            <div className="grid gap-8 mb-12">
              <ConceptCard
                icon={Globe}
                title="Two Ways to Measure Position"
                description="Just like a location on Earth has both longitude (east-west) and latitude (north-south), planets have two coordinates in the sky."
                expandedContent="Traditional astrology focuses almost exclusively on zodiacal longitude—what sign and degree a planet is in. But declination (how far north or south of the celestial equator) is equally important and directly corresponds to latitude on Earth."
              />

              <ConceptCard
                icon={Layers}
                title="The Celestial Equator"
                description="Imagine Earth's equator extended out into space. That's the celestial equator—the reference line for measuring declination."
                expandedContent="The Sun crosses the celestial equator twice a year (the equinoxes). At other times, it's either north or south of this line. Planets also move above and below this celestial equator, and their position (declination) directly relates to which latitudes on Earth they influence most."
              />

              <ConceptCard
                icon={Compass}
                title="Measured in Degrees"
                description="Declination is measured from 0° (at the celestial equator) to about 23.4° north or south (the Sun's maximum reach)."
                expandedContent="Some planets can go beyond the Sun's limits—called 'out of bounds' (OOB). These planets at extreme declinations can be particularly powerful and often correspond to exceptional abilities or unusual life experiences."
              />
            </div>

            <DiagramContainer caption="The celestial sphere with Earth at center. The gold ring shows the celestial equator, while the purple dashed line shows the ecliptic (Sun's path) tilted at 23.4°.">
              <CelestialSphereDiagram />
            </DiagramContainer>
          </div>
        </section>

        {/* Section 3: Earth-Sky Connection */}
        <section id="earth-sky" className="relative py-24 px-6 bg-[#0a0f1f]">
          <div className="max-w-4xl mx-auto">
            <SectionHeader
              id="earth-sky"
              title="The Earth-Sky Connection"
              subtitle="The magical relationship that makes declination-based relocation work."
              highlight="Connection"
            />

            <motion.div
              className="prose prose-invert prose-lg max-w-none mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-slate-300 text-lg leading-relaxed">
                Here's the key insight that makes everything click:{' '}
                <strong className="text-celestial-gold">
                  a planet's declination in degrees directly corresponds to a latitude on Earth in
                  degrees
                </strong>
                .
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                If your natal Sun is at 23°N declination, then at 23°N latitude on Earth, the Sun
                can pass directly overhead (at zenith). This creates a powerful resonance—you're
                literally standing where your Sun can be at its highest possible point in the sky.
              </p>
            </motion.div>

            <DiagramContainer caption="The key insight: a planet at 23°N declination corresponds directly to 23°N latitude on Earth. This is where that planet passes directly overhead.">
              <DeclinationLatitudeDiagram />
            </DiagramContainer>

            <div className="mt-12 p-6 rounded-2xl bg-celestial-gold/10 border border-celestial-gold/20">
              <div className="flex items-start gap-4">
                <Lightbulb className="w-8 h-8 text-celestial-gold flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-display text-xl font-semibold text-white mb-2">
                    The "Aha!" Moment
                  </h3>
                  <p className="text-slate-300">
                    This is why declination-based astrocartography is so powerful. Traditional ACG
                    shows where planets rise and set (vertical lines on a map). Declination adds
                    horizontal latitude bands where planets reach their maximum power. Together,
                    they create a complete picture.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Types of Planetary Lines */}
        <section
          id="lines"
          className="relative py-24 px-6 bg-gradient-to-b from-[#0a0f1f] to-[#0f172a]"
        >
          <div className="max-w-4xl mx-auto">
            <SectionHeader
              id="lines"
              title="Types of Planetary Lines"
              subtitle="Three different ways planets influence locations on Earth."
              highlight="Lines"
            />

            <div className="space-y-12">
              {/* Zenith Bands */}
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-white mb-4">
                    <span className="text-celestial-gold">1.</span> Zenith Bands
                  </h3>
                  <p className="text-slate-300 mb-4">
                    Horizontal bands of latitude where a planet can pass directly overhead (at
                    zenith). This is based purely on declination and is unique to this approach.
                  </p>
                  <ul className="space-y-2 text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-celestial-gold" />
                      Most direct planetary influence
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-celestial-gold" />
                      Creates latitude "bands" on the map
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-celestial-gold" />
                      Corresponds to North and South latitudes
                    </li>
                  </ul>
                </div>
                <DiagramContainer>
                  <ZenithConceptDiagram />
                </DiagramContainer>
              </div>

              {/* ACG Lines */}
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="lg:order-2">
                  <h3 className="font-display text-2xl font-semibold text-white mb-4">
                    <span className="text-celestial-gold">2.</span> ACG Lines (Angular Lines)
                  </h3>
                  <p className="text-slate-300 mb-4">
                    Curved lines showing where each planet is at an angular position (rising,
                    setting, at the top of the sky, or at the bottom).
                  </p>
                  <ul className="space-y-2 text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <strong className="text-emerald-400">ASC (Rising)</strong> — Planet rising on
                      eastern horizon
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <strong className="text-red-400">DSC (Setting)</strong> — Planet setting on
                      western horizon
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      <strong className="text-orange-400">MC (Midheaven)</strong> — Planet at
                      highest point
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <strong className="text-purple-400">IC (Imum Coeli)</strong> — Planet at
                      lowest point
                    </li>
                  </ul>
                </div>
                <DiagramContainer className="lg:order-1">
                  <ACGLinesDiagram />
                </DiagramContainer>
              </div>

              {/* Parans */}
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-white mb-4">
                    <span className="text-celestial-gold">3.</span> Parans
                  </h3>
                  <p className="text-slate-300 mb-4">
                    When two planets are simultaneously angular (one rising while another is
                    setting, etc.), they create a "paran" — a horizontal line of combined planetary
                    influence.
                  </p>
                  <ul className="space-y-2 text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-celestial-gold" />
                      Blends energies of two planets
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-celestial-gold" />
                      Creates unique latitude-based influences
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-celestial-gold" />
                      Often reveals hidden potential
                    </li>
                  </ul>
                </div>
                <DiagramContainer>
                  <ParanConceptDiagram />
                </DiagramContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: The Planets & Their Meanings */}
        <section id="planets" className="relative py-24 px-6 bg-[#0f172a]">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              id="planets"
              title="The Planets & Their Meanings"
              subtitle="What each celestial body represents in your daily life and potential."
              highlight="Planets"
            />

            <div className="grid md:grid-cols-2 gap-6">
              {PLANET_DATA.map((planet) => (
                <PlanetInfoCard key={planet.planetId} {...planet} />
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: How It Works */}
        <section
          id="how-it-works"
          className="relative py-24 px-6 bg-gradient-to-b from-[#0f172a] to-[#0a0f1f]"
        >
          <div className="max-w-4xl mx-auto">
            <SectionHeader
              id="how-it-works"
              title="How We Calculate Your Best Places"
              subtitle="The algorithm explained in plain English."
              highlight="Calculate"
            />

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-celestial-gold/20 flex items-center justify-center text-celestial-gold font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-white mb-2">
                    Calculate Your Planetary Positions
                  </h3>
                  <p className="text-slate-300">
                    Using your birth date, time, and location, we calculate the precise position of
                    each planet—including both its zodiacal longitude and its declination.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-celestial-gold/20 flex items-center justify-center text-celestial-gold font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-white mb-2">
                    Generate Planetary Lines
                  </h3>
                  <p className="text-slate-300">
                    For each planet, we calculate zenith bands (based on declination), ACG lines
                    (angular positions), and parans (planetary combinations). This creates a unique
                    map of influences for your chart.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-celestial-gold/20 flex items-center justify-center text-celestial-gold font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-white mb-2">
                    Score Each Location
                  </h3>
                  <p className="text-slate-300">
                    For any location on Earth, we calculate its proximity to each of your planetary
                    lines. Closer proximity means stronger influence. Each planet contributes to the
                    location's total score based on your weighting preferences.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-celestial-gold/20 flex items-center justify-center text-celestial-gold font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-white mb-2">
                    Apply Your Priorities
                  </h3>
                  <p className="text-slate-300">
                    You can customize which planets matter most to you. Looking for love? Boost
                    Venus and Moon. Career focused? Emphasize Saturn, Jupiter, and Sun. The final
                    scores reflect your personal goals.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-start gap-4">
                <Target className="w-8 h-8 text-celestial-gold flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-display text-xl font-semibold text-white mb-2">
                    Precision Calculations
                  </h3>
                  <p className="text-slate-300">
                    We use the Swiss Ephemeris—the same astronomical library used by NASA and
                    professional astrologers worldwide. Planetary positions are calculated to
                    sub-arcsecond precision, ensuring accurate results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Customizing for Your Goals */}
        <section id="customize" className="relative py-24 px-6 bg-[#0a0f1f]">
          <div className="max-w-4xl mx-auto">
            <SectionHeader
              id="customize"
              title="Customizing for Your Goals"
              subtitle="Weight planets according to what matters most to you."
              highlight="Goals"
            />

            <motion.div
              className="prose prose-invert prose-lg max-w-none mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-slate-300 text-lg leading-relaxed">
                Not all planets matter equally for every life goal. If you're seeking romantic
                partnership, Venus and Moon weights should be higher. If career advancement is your
                priority, focus on Sun, Saturn, and Jupiter.
              </p>
            </motion.div>

            <DiagramContainer caption="Try different presets to see how weighting changes which planets influence your location scores.">
              <WeightingDiagram />
            </DiagramContainer>

            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <h4 className="font-display text-lg font-semibold text-white mb-3">
                  Relationship Focus
                </h4>
                <p className="text-slate-400 text-sm mb-4">
                  Emphasize emotional connection and partnership
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-sm">
                    Venus ↑
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 text-sm">
                    Moon ↑
                  </span>
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                    Mars ↑
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <h4 className="font-display text-lg font-semibold text-white mb-3">Career Focus</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Emphasize achievement and professional success
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                    Sun ↑
                  </span>
                  <span className="px-3 py-1 rounded-full bg-stone-500/20 text-stone-300 text-sm">
                    Saturn ↑
                  </span>
                  <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm">
                    Jupiter ↑
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <h4 className="font-display text-lg font-semibold text-white mb-3">
                  Creative Focus
                </h4>
                <p className="text-slate-400 text-sm mb-4">
                  Emphasize inspiration and artistic expression
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-sm">
                    Neptune ↑
                  </span>
                  <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-sm">
                    Venus ↑
                  </span>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">
                    Uranus ↑
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <h4 className="font-display text-lg font-semibold text-white mb-3">
                  Spiritual Focus
                </h4>
                <p className="text-slate-400 text-sm mb-4">Emphasize growth and transcendence</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-sm">
                    Neptune ↑
                  </span>
                  <span className="px-3 py-1 rounded-full bg-neutral-500/20 text-neutral-300 text-sm">
                    Pluto ↑
                  </span>
                  <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm">
                    Jupiter ↑
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Technical Deep Dive */}
        <section
          id="technical"
          className="relative py-24 px-6 bg-gradient-to-b from-[#0a0f1f] to-[#0f172a]"
        >
          <div className="max-w-4xl mx-auto">
            <SectionHeader
              id="technical"
              title="Technical Deep Dive"
              subtitle="For the curious: the mathematics and astronomy behind the calculations."
              highlight="Technical"
            />

            <div className="space-y-8">
              <ConceptCard
                icon={Zap}
                title="Coordinate Systems"
                description="Planetary positions are first calculated in the ecliptic coordinate system (celestial longitude and latitude relative to the Sun's apparent path), then converted to equatorial coordinates (right ascension and declination)."
                expandedContent="The conversion uses standard astronomical formulas accounting for the obliquity of the ecliptic (approximately 23.44°). This transformation reveals the declination—how far north or south a planet is from the celestial equator."
                iconColor="text-cyan-400"
              />

              <ConceptCard
                icon={Zap}
                title="Parallel and Contra-Parallel Aspects"
                description="When two planets share the same declination, they form a 'parallel' aspect (similar to a conjunction). When they have equal but opposite declinations (one north, one south), they form a 'contra-parallel' (similar to an opposition)."
                expandedContent="Parallels and contra-parallels are often overlooked in traditional astrology but can be as powerful as major aspects. They add another layer of planetary interaction to consider when evaluating locations."
                iconColor="text-cyan-400"
              />

              <ConceptCard
                icon={Zap}
                title="Out of Bounds (OOB) Planets"
                description="When a planet's declination exceeds ±23.44° (the Sun's maximum reach), it's considered 'out of bounds.' OOB planets often indicate exceptional abilities or unusual experiences."
                expandedContent="The Moon goes OOB most frequently due to lunar standstills. Mars, Venus, and Mercury can also exceed the Sun's bounds. OOB planets don't correspond to any latitude where the Sun can reach zenith, making them particularly unique in relocation astrology."
                iconColor="text-cyan-400"
              />

              <ConceptCard
                icon={Zap}
                title="Swiss Ephemeris Precision"
                description="We use the Swiss Ephemeris library (SWISSEPH), which provides planetary positions accurate to within 0.001 arc-seconds for dates within several thousand years of the present."
                expandedContent="SWISSEPH is based on the JPL Development Ephemeris (DE431) and incorporates the latest astronomical constants. It accounts for perturbations from all major bodies in the solar system, relativistic effects, and the complex lunar theory."
                iconColor="text-cyan-400"
              />
            </div>
          </div>
        </section>

        {/* Section 9: FAQ */}
        <section id="faq" className="relative py-24 px-6 bg-[#0f172a]">
          <div className="max-w-4xl mx-auto">
            <SectionHeader
              id="faq"
              title="Frequently Asked Questions"
              subtitle="Answers to common questions about declination-based relocation."
              highlight="Questions"
            />

            <FAQAccordion items={FAQ_ITEMS} />
          </div>
        </section>

        {/* Section 10: Get Started CTA */}
        <section id="start" className="relative py-32 px-6 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 100%, #1e1b4b 0%, #0a0f1f 50%, #050714 100%)',
            }}
          />
          <div className="absolute inset-0 celestial-grid opacity-30" />

          <motion.div
            className="relative max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <MapPin className="w-8 h-8 text-celestial-gold" />
            </div>

            <h2 className="font-display text-4xl md:text-6xl font-semibold text-white mb-6">
              Ready to Find Your
              <br />
              <span className="text-celestial-gradient italic">Optimal Locations</span>?
            </h2>

            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Now that you understand the theory, let's apply it to your unique birth chart. Enter
              your birth data and discover where the cosmos suggests you'll thrive.
            </p>

            <Link
              to="/calculator"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-bold text-lg rounded-full transition-all duration-300 hover:shadow-[0_0_60px_rgba(251,191,36,0.5)] hover:scale-105"
            >
              <Globe className="w-6 h-6" />
              Calculate My Optimal Places
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
            </Link>

            <p className="mt-6 text-sm text-slate-500">Free to use • No account required</p>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 bg-[#050714] border-t border-slate-800/50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Globe className="w-6 h-6 text-amber-400" />
              <span className="font-display text-lg font-semibold text-white">
                Declination Living
              </span>
            </div>

            <p className="text-sm text-slate-500">Celestial cartography for the modern seeker</p>

            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link to="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <Link to="/calculator" className="hover:text-white transition-colors">
                Calculator
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
