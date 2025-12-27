import type { EvaluationType, ParticipationEntry, ScheduleSlot, Subject, WeekSystemSettings } from '@/lib/db'
import { AlertCircle, Calendar, Lock, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getCurrentWeekType, getDayOfWeek, isPastDate, parseDate } from '@/lib/date-utils'
import { getDB } from '@/lib/db'

const DOUBLE_PERIOD_LABELS: Record<number, string> = {
  1: '1./2.',
  2: '1./2.',
  3: '3./4.',
  4: '3./4.',
  5: '5./6.',
  6: '5./6.',
  7: '7./8.',
  8: '7./8.',
  9: '9./10.',
  10: '9./10.',
}

interface DailyTrackerProps {
  date: string
  subjects: Subject[]
  evaluationTypes: EvaluationType[]
  onNavigateToSchedule?: () => void
}

export function DailyTracker({ date, subjects, evaluationTypes, onNavigateToSchedule }: DailyTrackerProps) {
  const [entries, setEntries] = useState<ParticipationEntry[]>([])
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({})
  const [isReadOnly] = useState(() => isPastDate(date))
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [_, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [todaySubjects, setTodaySubjects] = useState<{ subject: Subject, periodLabel: string }[]>([])
  const [hasSchedule, setHasSchedule] = useState(false)
  const [__, setWeekSettings] = useState<WeekSystemSettings | null>(null)
  const [___, setCurrentWeekType] = useState<'A' | 'B'>('A')

  const loadData = useCallback(async () => {
    try {
      const db = await getDB()
      const [loadedEntries, loadedSlots, settings] = await Promise.all([
        db.getEntriesForDate(date),
        db.getScheduleSlots(),
        db.getWeekSystemSettings(),
      ])
      setEntries(loadedEntries)
      setScheduleSlots(loadedSlots)
      setHasSchedule(loadedSlots.length > 0)
      setWeekSettings(settings)

      const dateObj = parseDate(date)
      const dayOfWeek = getDayOfWeek(dateObj)

      let weekType: 'A' | 'B' = 'A'
      if (settings?.enabled && settings.referenceDate) {
        weekType = getCurrentWeekType(dateObj, settings.referenceDate)
        setCurrentWeekType(weekType)
      }

      if (dayOfWeek === -1) {
        setTodaySubjects([])
      }
      else if (loadedSlots.length === 0) {
        setTodaySubjects([])
      }
      else {
        const todaySlots = loadedSlots.filter((slot) => {
          if (slot.dayOfWeek !== dayOfWeek)
            return false

          if (settings?.enabled) {
            return slot.weekType === weekType
          }

          return !slot.weekType || slot.weekType === null
        })

        const seenPeriods = new Set<string>()
        const uniqueSlots: { subject: Subject, periodLabel: string, firstPeriod: number }[] = []

        todaySlots.forEach((slot) => {
          const periodLabel = DOUBLE_PERIOD_LABELS[slot.period]
          const key = `${slot.subjectId}-${periodLabel}`

          if (!seenPeriods.has(key)) {
            seenPeriods.add(key)
            // Note: 'subjects' is an external dependency here
            const subject = subjects.find(s => s.id === slot.subjectId)
            if (subject) {
              uniqueSlots.push({
                subject,
                periodLabel,
                firstPeriod: slot.period % 2 === 1 ? slot.period : slot.period - 1,
              })
            }
          }
        })

        uniqueSlots.sort((a, b) => a.firstPeriod - b.firstPeriod)
        setTodaySubjects(uniqueSlots.map(({ subject, periodLabel }) => ({ subject, periodLabel })))
      }

      const notes: Record<string, string> = {}
      for (const subject of subjects) {
        const dayNote = await db.getDayNote(date, subject.id)
        if (dayNote) {
          notes[subject.id] = dayNote.note
        }
      }
      setDayNotes(notes)
    }
    catch (error) {
      console.error('[calendar+] Failed to load entries:', error)
    }
  }, [date, subjects])

  const handleAddEntry = async (subjectId: string, evaluationTypeId: string, note?: string) => {
    if (isReadOnly)
      return

    try {
      const db = await getDB()
      await db.addEntry({
        subjectId,
        date,
        evaluationTypeId,
        note,
      })
      await loadData()
      setAddDialogOpen(false)
    }
    catch (error) {
      console.error('[calendar+] Failed to add entry:', error)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (isReadOnly)
      return

    try {
      const db = await getDB()
      await db.deleteEntry(id)
      await loadData()
    }
    catch (error) {
      console.error('[calendar+] Failed to delete entry:', error)
    }
  }

  const handleSaveDayNote = async (subjectId: string, note: string) => {
    if (isReadOnly)
      return

    try {
      const db = await getDB()
      await db.saveDayNote({ subjectId, date, note })
      setDayNotes(prev => ({ ...prev, [subjectId]: note }))
    }
    catch (error) {
      console.error('[calendar+] Failed to save day note:', error)
    }
  }

  const getSubjectEntries = (subjectId: string) => {
    return entries.filter(entry => entry.subjectId === subjectId)
  }

  const getEvaluationTypeName = (id: string) => {
    return evaluationTypes.find(et => et.id === id)?.name || 'Unbekannt'
  }

  const getEvaluationTypeColor = (id: string) => {
    return evaluationTypes.find(et => et.id === id)?.color || '#6b7280'
  }

  const dateObj = parseDate(date)
  const dayOfWeek = getDayOfWeek(dateObj)
  const isWeekend = dayOfWeek === -1

  useEffect(() => {
    loadData()
  }, [date, subjects, loadData])

  if (isWeekend) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Wochenende - kein Unterricht</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            Erstelle zuerst Fächer im Tab "Fächer", um mit der Erfassung zu beginnen.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!hasSchedule) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <p className="font-medium">Kein Stundenplan eingerichtet</p>
              <p className="text-sm text-muted-foreground">
                Trage zuerst deinen Stundenplan ein, um die heutigen Fächer zu sehen.
              </p>
            </div>
            {onNavigateToSchedule && (
              <Button onClick={onNavigateToSchedule} className="mt-2">
                Zum Stundenplan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (todaySubjects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-2">
              <p className="font-medium">Keine Fächer für heute</p>
              <p className="text-sm text-muted-foreground">
                Für diesen Tag sind keine Fächer im Stundenplan eingetragen.
              </p>
            </div>
            {onNavigateToSchedule && (
              <Button variant="outline" onClick={onNavigateToSchedule} className="mt-2 bg-transparent">
                Stundenplan bearbeiten
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {isReadOnly && (
        <div className="bg-muted border rounded-lg p-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Dieser Tag liegt in der Vergangenheit und kann nicht mehr bearbeitet werden.
          </p>
        </div>
      )}

      {todaySubjects.map(({ subject, periodLabel }) => {
        const subjectEntries = getSubjectEntries(subject.id)
        const totalCount = subjectEntries.length

        return (
          <Card key={`${subject.id}-${periodLabel}`} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center min-w-[48px] h-10 rounded-lg bg-muted text-sm font-bold">
                    {periodLabel}
                  </div>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                  <CardTitle className="text-base sm:text-lg truncate">{subject.name}</CardTitle>
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full flex-shrink-0">
                    <span className="text-base font-bold">{totalCount}</span>
                  </div>
                </div>
                {!isReadOnly && (
                  <Dialog
                    open={addDialogOpen && selectedSubject?.id === subject.id}
                    onOpenChange={(open) => {
                      setAddDialogOpen(open)
                      if (open)
                        setSelectedSubject(subject)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1.5 flex-shrink-0">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Meldung</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Neue Meldung für
                          {subject.name}
                        </DialogTitle>
                        <DialogDescription>Wähle die Bewertung für diese mündliche Beteiligung</DialogDescription>
                      </DialogHeader>
                      <AddEntryForm subject={subject} evaluationTypes={evaluationTypes} onAdd={handleAddEntry} />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {subjectEntries.length === 0
                  ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Noch keine Meldungen</p>
                    )
                  : (
                      <div className="grid gap-2">
                        {subjectEntries.map((entry, index) => (
                          <div
                            key={entry.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center justify-center w-6 h-6 rounded bg-muted text-xs font-medium">
                              {index + 1}
                            </div>
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getEvaluationTypeColor(entry.evaluationTypeId) }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{getEvaluationTypeName(entry.evaluationTypeId)}</div>
                              {entry.note && (
                                <div className="text-xs text-muted-foreground truncate mt-0.5">{entry.note}</div>
                              )}
                            </div>
                            {!isReadOnly && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-50 hover:opacity-100"
                                onClick={() => handleDeleteEntry(entry.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
              </div>

              <div className="pt-3 border-t">
                <Label htmlFor={`note-${subject.id}`} className="text-sm font-medium mb-2 block">
                  Notiz zum Tag
                </Label>
                <Textarea
                  id={`note-${subject.id}`}
                  placeholder="Optionale Notiz für diesen Tag..."
                  value={dayNotes[subject.id] || ''}
                  onChange={e => setDayNotes(prev => ({ ...prev, [subject.id]: e.target.value }))}
                  onBlur={() => handleSaveDayNote(subject.id, dayNotes[subject.id] || '')}
                  disabled={isReadOnly}
                  className="min-h-[70px] resize-none text-sm"
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

interface AddEntryFormProps {
  subject: Subject
  evaluationTypes: EvaluationType[]
  onAdd: (subjectId: string, evaluationTypeId: string, note?: string) => void
}

function AddEntryForm({ subject, evaluationTypes, onAdd }: AddEntryFormProps) {
  const [selectedEvalType, setSelectedEvalType] = useState<string>('')
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    if (!selectedEvalType)
      return
    onAdd(subject.id, selectedEvalType, note.trim() || undefined)
    setSelectedEvalType('')
    setNote('')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Bewertung</Label>
        <div className="grid gap-2">
          {evaluationTypes.map(evalType => (
            <button
              key={evalType.id}
              onClick={() => setSelectedEvalType(evalType.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                selectedEvalType === evalType.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent'
              }`}
            >
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: evalType.color }} />
              <span className="font-medium">{evalType.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="entry-note">Notiz (optional)</Label>
        <Input
          id="entry-note"
          placeholder="z.B. 'Pythagoras erklärt'"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <Button onClick={handleSubmit} disabled={!selectedEvalType} className="w-full">
        Meldung hinzufügen
      </Button>
    </div>
  )
}
