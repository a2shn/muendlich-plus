import type { EvaluationType, ParticipationEntry, Subject } from '@/lib/db'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, getWeekDates, isPastDate } from '@/lib/date-utils'
import { getDB } from '@/lib/db'

interface WeeklyScheduleProps {
  subjects: Subject[]
  evaluationTypes: EvaluationType[]
}

export function WeeklySchedule({ subjects, evaluationTypes }: WeeklyScheduleProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Monday
    return new Date(today.setDate(diff))
  })
  const [entriesByDate, setEntriesByDate] = useState<Map<string, ParticipationEntry[]>>(() => new Map())

  const weekDates = getWeekDates(currentWeekStart)

  const loadWeekData = useCallback(async () => {
    try {
      const db = await getDB()
      const entries = new Map<string, ParticipationEntry[]>()

      for (const date of weekDates) {
        const dateStr = formatDate(date)
        const dayEntries = await db.getEntriesForDate(dateStr)
        entries.set(dateStr, dayEntries)
      }

      setEntriesByDate(entries)
    }
    catch (error) {
      console.error('Failed to load week data:', error)
    }
  }, [weekDates])

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newDate)
  }

  const getEntriesForDateAndSubject = (dateStr: string, subjectId: string) => {
    return entriesByDate.get(dateStr)?.filter(e => e.subjectId === subjectId) || []
  }

  const getEvaluationTypeColor = (id: string) => {
    return evaluationTypes.find(et => et.id === id)?.color || '#6b7280'
  }

  const getDayName = (date: Date) => {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    return days[date.getDay()]
  }

  const getDateDisplay = (date: Date) => {
    return `${date.getDate()}.${date.getMonth() + 1}.`
  }

  useEffect(() => {
    loadWeekData()
  }, [currentWeekStart, loadWeekData])

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            Erstelle zuerst Fächer im Tab "Fächer", um die Wochenübersicht zu nutzen.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle>
              Woche
              {' '}
              {weekDates[0].getDate()}
              .
              {weekDates[0].getMonth() + 1}
              . -
              {' '}
              {weekDates[6].getDate()}
              .
              {weekDates[6].getMonth() + 1}
              .
              {weekDates[6].getFullYear()}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Schedule grid */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="grid grid-cols-6 md:grid-cols-8">
          {/* Header row */}
          <div className="col-span-1 md:col-span-2 bg-muted p-3 border-b border-r font-semibold">Fach</div>
          {weekDates.slice(0, 5).map((date) => {
            const dateStr = formatDate(date)
            const isToday = dateStr === formatDate(new Date())
            const isPast = isPastDate(dateStr)

            return (
              <div
                key={dateStr}
                className={`p-3 border-b border-r text-center ${isToday ? 'bg-primary/10' : isPast ? 'bg-muted/50' : 'bg-muted'}`}
              >
                <div className="font-semibold">{getDayName(date)}</div>
                <div className="text-xs text-muted-foreground">{getDateDisplay(date)}</div>
              </div>
            )
          })}

          {/* Subject rows */}

          {subjects.map((subject, subjectIndex) => (
            <div key={subject.id} className="contents">
              {/* Subject name cell */}
              <div
                className={`col-span-1 md:col-span-2 p-3 border-b border-r flex items-center gap-2 ${subjectIndex % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                <span className="font-medium text-sm">{subject.name}</span>
              </div>

              {/* Day cells */}
              {weekDates.slice(0, 5).map((date) => {
                const dateStr = formatDate(date)
                const entries = getEntriesForDateAndSubject(dateStr, subject.id)
                const isToday = dateStr === formatDate(new Date())

                // FIXED: Extracted logic to fix "style/multiline-ternary" error
                let cellBackground = 'bg-muted/10'
                if (isToday) {
                  cellBackground = 'bg-primary/5'
                }
                else if (subjectIndex % 2 === 0) {
                  cellBackground = 'bg-card'
                }

                return (
                  <div
                    key={`${subject.id}-${dateStr}`}
                    className={`p-2 border-b border-r min-h-[60px] ${cellBackground}`}
                  >
                    {entries.length > 0
                      ? (
                          <div className="space-y-1">
                            {/* Total count badge */}
                            <div className="flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-bold">
                                {entries.length}
                              </div>
                            </div>
                            {/* Color dots for evaluation types */}
                            <div className="flex flex-wrap gap-1 justify-center">
                              {entries.slice(0, 10).map((entry, idx) => (
                                <div
                                  key={idx.toString()}
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: getEvaluationTypeColor(entry.evaluationTypeId) }}
                                  title={evaluationTypes.find(et => et.id === entry.evaluationTypeId)?.name}
                                />
                              ))}
                              {entries.length > 10 && (
                                <span className="text-xs text-muted-foreground">
                                  +
                                  {entries.length - 10}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-muted-foreground/30">-</span>
                          </div>
                        )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
