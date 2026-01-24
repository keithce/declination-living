// Geoapify API client for city autocomplete and timezone lookup

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

// Call our server-side proxy to hide API key
export async function searchCities(query: string): Promise<CityResult[]> {
  if (query.length < 2) return []

  try {
    const response = await fetch(
      `/api/geoapify/autocomplete?q=${encodeURIComponent(query)}`
    )

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
export async function getTimezone(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/geoapify/timezone?lat=${lat}&lon=${lon}`
    )

    if (!response.ok) return null

    const data = await response.json()
    return data.timezone?.name || null
  } catch {
    return null
  }
}
