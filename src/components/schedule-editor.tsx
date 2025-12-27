import type { ScheduleSlot, Subject, WeekSystemSettings } from '@/lib/db'
import { AlertTriangle, CalendarDays, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/date-utils'
import { getDB } from '@/lib/db'

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']
const DOUBLE_PERIODS = [
  { label: '1./2.', periods: [1, 2] },
  { label: '3./4.', periods: [3, 4] },
  { label: '5./6.', periods: [5, 6] },
  { label: '7./8.', periods: [7, 8] },
  { label: '9./10.', periods: [9, 10] },
]

interface ScheduleEditorProps {
  subjects: Subject[]
  onScheduleChange?: () => void
}

export function ScheduleEditor({ subjects, onScheduleChange }: ScheduleEditorProps) {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [weekSettings, setWeekSettings] = useState<WeekSystemSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeWeek, setActiveWeek] = useState<'A' | 'B'>('A')

  const loadData = useCallback(async () => {
    try {
      const db = await getDB()
      const [slots, settings] = await Promise.all([
        db.getScheduleSlots(),
        db.getWeekSystemSettings(),
      ])
      setSchedule(slots)
      setWeekSettings(settings)
    }
    catch (error) {
      console.error('[calendar+] Failed to load schedule:', error)
    }
    finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleToggleWeekSystem = async (enabled: boolean) => {
    try {
      const db = await getDB()
      const settings: Omit<WeekSystemSettings, 'id'> = {
        enabled,
        referenceDate: formatDate(new Date()),
      }
      await db.saveWeekSystemSettings(settings)
      await loadData()
      onScheduleChange?.()
    }
    catch (error) {
      console.error('[calendar+] Failed to toggle week system:', error)
    }
  }

  const handleReferenceDateChange = async (date: string) => {
    if (!weekSettings)
      return
    try {
      const db = await getDB()
      await db.saveWeekSystemSettings({
        enabled: weekSettings.enabled,
        referenceDate: date,
      })
      await loadData()
    }
    catch (error) {
      console.error('[calendar+] Failed to update reference date:', error)
    }
  }

  const handleAddSlot = async (dayOfWeek: number, doublePeriod: number[], subjectId: string, weekType?: 'A' | 'B' | null) => {
    try {
      const db = await getDB()

      for (const period of doublePeriod) {
        const existing = schedule.find(s =>
          s.dayOfWeek === dayOfWeek
          && s.period === period
          && (weekSettings?.enabled ? s.weekType === weekType : true),
        )
        if (existing) {
          await db.deleteScheduleSlot(existing.id)
        }
      }

      for (const period of doublePeriod) {
        await db.addScheduleSlot({
          dayOfWeek,
          period,
          subjectId,
          weekType: weekSettings?.enabled ? weekType : null,
        })
      }

      await loadData()
      onScheduleChange?.()
    }
    catch (error) {
      console.error('[calendar+] Failed to add schedule slot:', error)
    }
  }

  const handleRemoveSlot = async (dayOfWeek: number, doublePeriod: number[], weekType?: 'A' | 'B' | null) => {
    try {
      const db = await getDB()
      for (const period of doublePeriod) {
        const slot = schedule.find(s =>
          s.dayOfWeek === dayOfWeek
          && s.period === period
          && (weekSettings?.enabled ? s.weekType === weekType : true),
        )
        if (slot) {
          await db.deleteScheduleSlot(slot.id)
        }
      }
      await loadData()
      onScheduleChange?.()
    }
    catch (error) {
      console.error('[calendar+] Failed to remove schedule slot:', error)
    }
  }

  const handleClearAll = async () => {
    try {
      const db = await getDB()
      await db.clearScheduleSlots()
      await loadData()
      onScheduleChange?.()
    }
    catch (error) {
      console.error('[calendar+] Failed to clear schedule:', error)
    }
  }

  const getSlotForDoublePeriod = (dayOfWeek: number, doublePeriod: number[], weekType?: 'A' | 'B' | null) => {
    return schedule.find(s =>
      s.dayOfWeek === dayOfWeek
      && s.period === doublePeriod[0]
      && (weekSettings?.enabled ? s.weekType === weekType : (!s.weekType || s.weekType === null)),
    )
  }

  const getSubjectById = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)
  }

  const renderScheduleGrid = (weekType?: 'A' | 'B' | null) => (
    <ScrollArea className="w-full">
      <div className="min-w-[600px] pb-4">
        <div className="grid grid-cols-[70px_repeat(5,1fr)] gap-2">
          <div className="font-semibold text-xs p-2 text-muted-foreground">Stunde</div>
          {DAYS.map(day => (
            <div key={day} className="font-semibold text-xs sm:text-sm p-2 text-center bg-muted/50 rounded-lg">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 2)}</span>
            </div>
          ))}

          {DOUBLE_PERIODS.map(dp => (
            <div key={dp.label} className="contents">
              <div className="flex items-center justify-center font-bold text-sm p-2 bg-muted rounded-lg">
                {dp.label}
              </div>
              {DAYS.map((dayName, dayIndex) => {
                const slot = getSlotForDoublePeriod(dayIndex, dp.periods, weekType)
                const subject = slot ? getSubjectById(slot.subjectId) : null

                return (
                  <div key={`${dayIndex.toString()}-${dp.label}`} className="relative min-h-[60px]">
                    {slot && subject
                      ? (
                          <div
                            className="h-full p-2 rounded-lg text-sm font-medium text-white flex items-center justify-between gap-1 shadow-sm"
                            style={{ backgroundColor: subject.color }}
                          >
                            <span className="truncate text-xs sm:text-sm">{subject.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-white/20 flex-shrink-0"
                              onClick={() => handleRemoveSlot(dayIndex, dp.periods, weekType)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      : (
                          <Select onValueChange={value => handleAddSlot(dayIndex, dp.periods, value, weekType)}>
                            <SelectTrigger className="h-full min-h-[60px] text-xs border-dashed">
                              <SelectValue placeholder="+" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map(subject => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: subject.color }} />
                                    {subject.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )

  if (isLoading) {
    return <div className="text-center py-8">Lade Stundenplan...</div>
  }

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Erstelle zuerst Fächer im Tab "Fächer", um den Stundenplan zu bearbeiten.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            A/B Wochensystem
          </CardTitle>
          <CardDescription>
            Aktiviere das A/B Wochensystem für einen sich wöchentlich abwechselnden Stundenplan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="week-system-toggle">A/B Wochensystem aktivieren</Label>
            <Switch
              id="week-system-toggle"
              checked={weekSettings?.enabled || false}
              onCheckedChange={handleToggleWeekSystem}
            />
          </div>

          {weekSettings?.enabled && (
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="reference-date">Referenzdatum (A-Woche)</Label>
              <Input
                id="reference-date"
                type="date"
                value={weekSettings.referenceDate}
                onChange={e => handleReferenceDateChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Wähle ein Datum, das in einer bekannten A-Woche liegt. Das System berechnet automatisch alle anderen Wochen.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Stundenplan</CardTitle>
              <CardDescription>Ordne deine Fächer den Doppelstunden zu</CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Alles löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Stundenplan löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dies löscht alle Einträge im Stundenplan. Diese Aktion kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          {weekSettings?.enabled
            ? (
                <Tabs value={activeWeek} onValueChange={value => setActiveWeek(value as 'A' | 'B')}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="A">A-Woche</TabsTrigger>
                    <TabsTrigger value="B">B-Woche</TabsTrigger>
                  </TabsList>
                  <TabsContent value="A">
                    {renderScheduleGrid('A')}
                  </TabsContent>
                  <TabsContent value="B">
                    {renderScheduleGrid('B')}
                  </TabsContent>
                </Tabs>
              )
            : (
                renderScheduleGrid(null)
              )}
        </CardContent>
      </Card>
    </div>
  )
}
