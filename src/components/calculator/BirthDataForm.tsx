import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Info } from 'lucide-react'
import { CityAutocomplete } from './CityAutocomplete'
import type { CityResult } from '@/lib/geoapify'

export interface BirthData {
  birthDate: string
  birthTime: string
  birthCity: string
  birthCountry: string
  birthLatitude: number
  birthLongitude: number
  birthTimezone: string
}

interface BirthDataFormProps {
  onSubmit: (data: BirthData) => void
  isLoading?: boolean
}

export function BirthDataForm({ onSubmit, isLoading }: BirthDataFormProps) {
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!birthDate) {
      newErrors.birthDate = 'Birth date is required'
    }

    if (!birthTime) {
      newErrors.birthTime = 'Birth time is required for accurate calculations'
    }

    if (!selectedCity) {
      newErrors.city = 'Birth location is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate() || !selectedCity) return

    onSubmit({
      birthDate,
      birthTime,
      birthCity: selectedCity.city,
      birthCountry: selectedCity.country,
      birthLatitude: selectedCity.latitude,
      birthLongitude: selectedCity.longitude,
      birthTimezone: selectedCity.timezone,
    })
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Birth Date */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          Birth Date
        </label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-4 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors ${
            errors.birthDate ? 'border-red-500/50' : 'border-slate-700'
          }`}
        />
        {errors.birthDate && <p className="mt-2 text-sm text-red-400">{errors.birthDate}</p>}
      </div>

      {/* Birth Time */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Birth Time (24-hour format)
        </label>
        <input
          type="time"
          value={birthTime}
          onChange={(e) => setBirthTime(e.target.value)}
          className={`w-full px-4 py-4 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors ${
            errors.birthTime ? 'border-red-500/50' : 'border-slate-700'
          }`}
        />
        {errors.birthTime && <p className="mt-2 text-sm text-red-400">{errors.birthTime}</p>}
        <p className="mt-2 text-xs text-slate-500 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          Precise birth time ensures accurate Moon position and house placements
        </p>
      </div>

      {/* Birth City */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <span className="w-4 h-4 text-amber-400">📍</span>
          Birth Location
        </label>
        <CityAutocomplete
          value={selectedCity}
          onChange={setSelectedCity}
          placeholder="Search for your birth city..."
          error={errors.city}
        />
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {isLoading ? 'Calculating...' : 'Calculate Declinations'}
      </motion.button>
    </motion.form>
  )
}
