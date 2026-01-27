export interface FAQItem {
  question: string
  answer: string
}

export const FAQ_ITEMS: Array<FAQItem> = [
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
