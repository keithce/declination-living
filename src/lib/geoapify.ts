// Geoapify API client for city autocomplete and timezone lookup

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY

export interface GeoapifyPlace {
  place_id: string
  name: string
  city?: string
  state?: string
  country: string
  country_code: string
  lat: number
  lon: number
  timezone?: {
    name: string
    offset_STD: string
    offset_DST: string
  }
}

export interface GeoapifyAutocompleteResult {
  features: Array<{
    properties: {
      place_id: string
      name?: string
      city?: string
      state?: string
      country: string
      country_code: string
      lat: number
      lon: number
      timezone?: {
        name: string
        offset_STD: string
        offset_DST: string
      }
    }
  }>
}

export interface CityResult {
  placeId: string
  name: string
  city: string
  state?: string
  country: string
  countryCode: string
  latitude: number
  longitude: number
  timezone: string
  displayName: string
}

// Call Geoapify API directly (API key is safe for geocoding APIs)
export async function searchCities(query: string): Promise<Array<CityResult>> {
  if (query.length < 2) return []

  if (!GEOAPIFY_API_KEY) {
    console.error('VITE_GEOAPIFY_API_KEY not configured')
    return []
  }

  try {
    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete')
    url.searchParams.set('text', query)
    url.searchParams.set('type', 'city')
    url.searchParams.set('limit', '10')
    url.searchParams.set('apiKey', GEOAPIFY_API_KEY)

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error('Geoapify search failed:', response.statusText)
      return []
    }

    const data: GeoapifyAutocompleteResult = await response.json()

    return data.features
      .filter((f) => f.properties.city || f.properties.name)
      .map((feature) => {
        const p = feature.properties
        const city = p.city || p.name || ''
        const parts = [city]
        if (p.state) parts.push(p.state)
        parts.push(p.country)

        return {
          placeId: p.place_id,
          name: p.name || city,
          city,
          state: p.state,
          country: p.country,
          countryCode: p.country_code,
          latitude: p.lat,
          longitude: p.lon,
          timezone: p.timezone?.name || 'UTC',
          displayName: parts.join(', '),
        }
      })
  } catch (error) {
    console.error('City search error:', error)
    return []
  }
}

// Get timezone for coordinates
export async function getTimezone(lat: number, lon: number): Promise<string | null> {
  if (!GEOAPIFY_API_KEY) {
    console.error('VITE_GEOAPIFY_API_KEY not configured')
    return null
  }

  try {
    const url = new URL('https://api.geoapify.com/v1/geocode/reverse')
    url.searchParams.set('lat', lat.toString())
    url.searchParams.set('lon', lon.toString())
    url.searchParams.set('apiKey', GEOAPIFY_API_KEY)

    const response = await fetch(url.toString())

    if (!response.ok) return null

    const data = await response.json()
    return data.features?.[0]?.properties?.timezone?.name || null
  } catch {
    return null
  }
}
