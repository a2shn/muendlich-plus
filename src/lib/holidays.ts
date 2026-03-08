import { formatDate } from '@/lib/date-utils'

export interface Holiday {
  date: string // YYYY-MM-DD
  fname: string // Name of the holiday
  all_states: string
  // ... other fields from api
}

export const BUNDESLAENDER: Record<string, string> = {
  'Baden-Württemberg': 'BW',
  'Bayern': 'BY',
  'Berlin': 'BE',
  'Brandenburg': 'BB',
  'Bremen': 'HB',
  'Hamburg': 'HH',
  'Hessen': 'HE',
  'Mecklenburg-Vorpommern': 'MV',
  'Niedersachsen': 'NI',
  'Nordrhein-Westfalen': 'NW',
  'Rheinland-Pfalz': 'RP',
  'Saarland': 'SL',
  'Sachsen': 'SN',
  'Sachsen-Anhalt': 'ST',
  'Schleswig-Holstein': 'SH',
  'Thüringen': 'TH',
}

export const STATE_NAMES = Object.keys(BUNDESLAENDER)

export async function detectUserState(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation not supported')
      return resolve(null)
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          // Use OpenStreetMap Nominatim for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { 'Accept-Language': 'de' } },
          )
          const data = await response.json()

          const stateName = data.address?.state
          if (stateName && BUNDESLAENDER[stateName]) {
            resolve(BUNDESLAENDER[stateName])
          }
          else {
            // Fallback: Try to match partial names if exact match fails
            const found = Object.entries(BUNDESLAENDER).find(([key]) => stateName?.includes(key))
            resolve(found ? found[1] : null)
          }
        }
        catch (error) {
          console.error('Failed to detect location:', error)
          resolve(null)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        resolve(null)
      },
      { timeout: 10000, enableHighAccuracy: false }, // Options to make it more robust
    )
  })
}

export async function fetchHolidays(year: number, stateCode: string): Promise<Record<string, Holiday>> {
  try {
    const response = await fetch(`https://feiertage-api.de/api/?jahr=${year}&nur_land=${stateCode}`)
    if (!response.ok)
      throw new Error('Failed to fetch holidays')
    return await response.json()
  }
  catch (error) {
    console.error('Error fetching holidays:', error)
    return {}
  }
}

// --- Smart Logic Helpers ---

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // 0=Sun, 6=Sat
}

/**
 * Finds the next valid school day starting from (and including) the startDate.
 * Skips weekends and any dates present in the holidayMap.
 */
export function getNextValidSchoolDay(startDate: Date, holidayMap: Map<string, string>): { date: Date, reason: string | null } {
  const current = new Date(startDate)
  // Ensure we don't loop forever (e.g., if config is broken), cap at 60 days
  let checks = 0
  let reason: string | null = null

  while (checks < 60) {
    const dateStr = formatDate(current)
    const holidayName = holidayMap.get(dateStr)
    const weekend = isWeekend(current)

    // If it's NOT a holiday and NOT a weekend, we found a valid day
    if (!holidayName && !weekend) {
      return { date: current, reason }
    }

    // If we haven't set a reason yet, set it now (why we skipped the *original* requested date)
    if (!reason) {
      if (holidayName)
        reason = `Feiertag (${holidayName})`
      else if (weekend)
        reason = 'Wochenende'
    }

    // Move to next day
    current.setDate(current.getDate() + 1)
    checks++
  }

  return { date: startDate, reason: null } // Fallback
}
