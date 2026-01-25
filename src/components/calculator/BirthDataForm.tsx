import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Info } from 'lucide-react'
import { CityAutocomplete } from './CityAutocomplete'
import type { CityResult } from '@/lib/geoapify'

// Dev mode presets - tree-shaken in production
const DEV_PRESETS = import.meta.env.DEV
  ? [
      {
        label: 'Keith',
        birthDate: '1986-02-28',
        birthTime: '16:20',
        city: {
          placeId: 'dev-sarasota',
          name: 'Sarasota',
          city: 'Sarasota',
          state: 'Florida',
          country: 'United States',
          countryCode: 'us',
          latitude: 27.3364,
          longitude: -82.5307,
          timezone: 'America/New_York',
          displayName: 'Sarasota, Florida, United States',
        } satisfies CityResult,
      },
      {
        label: 'Preset 2',
        birthDate: '1991-07-14',
        birthTime: '02:45',
        city: {
          placeId: 'dev-edmonds',
          name: 'Edmonds',
          city: 'Edmonds',
          state: 'Washington',
          country: 'United States',
          countryCode: 'us',
          latitude: 47.8107,
          longitude: -122.3774,
          timezone: 'America/Los_Angeles',
          displayName: 'Edmonds, Washington, United States',
        } satisfies CityResult,
      },
    ]
  : []

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

  const fillPreset = (preset: (typeof DEV_PRESETS)[number]) => {
    setBirthDate(preset.birthDate)
    setBirthTime(preset.birthTime)
    setSelectedCity(preset.city)
    setErrors({})
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Dev Mode Presets */}
      {DEV_PRESETS.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
              Dev Mode
            </span>
          </div>
          <div className="flex gap-2">
            {DEV_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => fillPreset(preset)}
                className="px-3 py-1.5 text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
