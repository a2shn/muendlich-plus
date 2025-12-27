import type { WeekSystemSettings } from '@/lib/db'
import { useCallback, useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { formatDisplayDate, getCurrentWeekType, parseDate } from '@/lib/date-utils'
import { getDB } from '@/lib/db'

interface HeaderProps {
  currentDate: string
}

export function Header({ currentDate }: HeaderProps) {
  const [weekSettings, setWeekSettings] = useState<WeekSystemSettings | null>(null)
  const [currentWeekType, setCurrentWeekType] = useState<'A' | 'B'>('A')

  const loadWeekSettings = useCallback(async () => {
    try {
      const db = await getDB()
      const settings = await db.getWeekSystemSettings()
      setWeekSettings(settings)

      if (settings?.enabled && settings.referenceDate) {
        const dateObj = parseDate(currentDate)
        const weekType = getCurrentWeekType(dateObj, settings.referenceDate)
        setCurrentWeekType(weekType)
      }
    }
    catch (error) {
      console.error('[calendar+] Failed to load week settings:', error)
    }
  }, [currentDate])
  useEffect(() => {
    loadWeekSettings()
  }, [currentDate, loadWeekSettings])
  return (
    <header className="border-b bg-card sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mündliche Beteiligung</h1>
            <p className="text-sm text-muted-foreground mt-1">{formatDisplayDate(currentDate)}</p>
          </div>
          <div className="flex items-center gap-3">
            {weekSettings?.enabled && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Woche</div>
                <div className="text-sm font-bold">
                  {currentWeekType}
                  -Woche
                </div>
              </div>
            )}
            <div className="text-right hidden sm:block">
              <div className="text-xs text-muted-foreground">Schuljahr</div>
              <div className="text-sm font-medium">2024/2025</div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
