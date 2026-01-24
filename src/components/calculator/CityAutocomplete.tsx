import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, MapPin, Search } from 'lucide-react'
import type { CityResult } from '@/lib/geoapify'
import { searchCities } from '@/lib/geoapify'

interface CityAutocompleteProps {
  value: CityResult | null
  onChange: (city: CityResult | null) => void
  placeholder?: string
  error?: string
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a city...',
  error,
}: CityAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<CityResult>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      const cities = await searchCities(query)
      setResults(cities)
      setIsLoading(false)
      setHighlightedIndex(0)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (city: CityResult) => {
    onChange(city)
    setQuery('')
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((i) => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        handleSelect(results[highlightedIndex])
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Selected city display */}
      {value ? (
        <div className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
          <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate">{value.displayName}</div>
            <div className="text-sm text-slate-400">
              {value.latitude.toFixed(4)}°, {value.longitude.toFixed(4)}° • {value.timezone}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-slate-400 hover:text-white text-sm"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full pl-12 pr-12 py-4 bg-slate-800/50 border rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors ${
                error ? 'border-red-500/50' : 'border-slate-700'
              }`}
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
            )}
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
              >
                <ul className="max-h-64 overflow-y-auto">
                  {results.map((city, index) => (
                    <li key={city.placeId}>
                      <button
                        type="button"
                        onClick={() => handleSelect(city)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          index === highlightedIndex
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'text-slate-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{city.city}</div>
                          <div className="text-sm text-slate-500 truncate">
                            {city.state && `${city.state}, `}
                            {city.country}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
