// Date utility functions for the application
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date())
}

export function isPastDate(dateStr: string): boolean {
  const date = parseDate(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date < today
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseDate(dateStr)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  return date.toLocaleDateString('de-DE', options)
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    dates.push(date)
  }
  return dates
}

export function getDayOfWeek(date: Date): number {
  const day = date.getDay()
  // Convert from Sunday=0 to Monday=0 format, weekend returns -1
  if (day === 0)
    return -1 // Sunday
  if (day === 6)
    return -1 // Saturday
  return day - 1 // Monday=0, Tuesday=1, etc.
}

export function getCurrentWeekType(date: Date, referenceDate: string): 'A' | 'B' {
  const refDate = parseDate(referenceDate)
  const currentDate = new Date(date)

  // Reset to start of week (Monday)
  const getMonday = (d: Date) => {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const refMonday = getMonday(new Date(refDate))
  const currentMonday = getMonday(new Date(currentDate))

  refMonday.setHours(0, 0, 0, 0)
  currentMonday.setHours(0, 0, 0, 0)

  const weeksDiff = Math.floor((currentMonday.getTime() - refMonday.getTime()) / (7 * 24 * 60 * 60 * 1000))

  return weeksDiff % 2 === 0 ? 'A' : 'B'
}
