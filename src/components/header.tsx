import type { WeekSystemSettings } from '@/sync'
import { CalendarRange, LogOut, School } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCurrentWeekType, parseDate } from '@/lib/date-utils'
import supabase from '@/lib/supabase'
import { db } from '@/sync'
import { UserNav } from './user-nav'

interface HeaderProps {
  currentDate: string
}

export function Header({ currentDate }: HeaderProps) {
  const [weekSettings, setWeekSettings] = useState<WeekSystemSettings | null>(null)
  const [currentWeekType, setCurrentWeekType] = useState<'A' | 'B'>('A')

  const loadWeekSettings = useCallback(async () => {
    try {
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // The App component will detect the session change and redirect to AuthScreen
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl border bg-background shadow-sm">
            <img
              src="/favicon.svg"
              alt="Logo"
              className="h-full w-full object-cover p-1.5"
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-tight tracking-tight">
              Mündliche Beteiligung
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Student Tracker
            </p>
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Info Pills (Hidden on very small screens, shown as icons on medium) */}
          <UserNav />
          <div className="flex items-center gap-2 mr-2">
            {weekSettings?.enabled && (
              <Badge variant="secondary" className="h-8 gap-1.5 px-2.5 font-medium">
                <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden xs:inline">
                  Woche
                  {currentWeekType}
                </span>
                <span className="xs:hidden">{currentWeekType}</span>
              </Badge>
            )}
            <Badge variant="outline" className="h-8 gap-1.5 px-2.5 hidden sm:flex">
              <School className="h-3.5 w-3.5 text-muted-foreground" />
              <span>2025/26</span>
            </Badge>
          </div>

          <div className="pl-2 border-l h-6 flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Abmelden"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
