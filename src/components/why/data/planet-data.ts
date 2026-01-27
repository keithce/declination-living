import type { PlanetId } from '@/lib/planet-constants'

export interface PlanetDataItem {
  planetId: PlanetId
  name: string
  lifeAreas: Array<string>
  whenStrong: string
  whenChallenging: string
  detailedInterpretation: string
}

export const PLANET_DATA: Array<PlanetDataItem> = [
  {
    planetId: 'sun',
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
    planetId: 'moon',
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
    planetId: 'mercury',
    name: 'Mercury',
    lifeAreas: ['Communication', 'Learning', 'Commerce', 'Travel'],
    whenStrong:
      'Mental clarity, excellent communication, successful negotiations, good for writing and teaching.',
    whenChallenging: 'Mental restlessness, nervous energy, may overthink, scattered focus.',
    detailedInterpretation:
      'Mercury lines enhance intellectual pursuits and communication. Ideal for students, writers, teachers, and those in media or commerce. Ideas flow more easily and networking opportunities abound.',
  },
  {
    planetId: 'venus',
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
    planetId: 'mars',
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
    planetId: 'jupiter',
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
    planetId: 'saturn',
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
    planetId: 'uranus',
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
    planetId: 'neptune',
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
    planetId: 'pluto',
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
