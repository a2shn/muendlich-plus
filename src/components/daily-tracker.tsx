import type { EvaluationType, Subject } from '@/sync'
import { AlertCircle, Calendar, Lock, Plus, Target, Trash2 } from 'lucide-react'
import { useState } from 'react'
// Components
import { Button } from '@/components/ui/button'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useDailyTracker } from '@/hooks/use-daily-tracker'

import { getDayOfWeek, parseDate } from '@/lib/date-utils'

interface DailyTrackerProps {
  date: string
  subjects: Subject[]
  evaluationTypes: EvaluationType[]
  onNavigateToSchedule?: () => void
}

export function DailyTracker({ date, subjects, evaluationTypes, onNavigateToSchedule }: DailyTrackerProps) {
  const { entries, todaySubjects, hasSchedule, isReadOnly, addEntry, deleteEntry } = useDailyTracker(date, subjects)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)

  const isWeekend = getDayOfWeek(parseDate(date)) === -1

  // --- States ---
  if (isWeekend)
    return <EmptyState icon={AlertCircle} text="Wochenende - kein Unterricht" />
  if (subjects.length === 0)
    return <EmptyState icon={AlertCircle} text="Erstelle zuerst Fächer im Tab 'Fächer'." />
  if (!hasSchedule)
    return <EmptyState icon={Calendar} text="Kein Stundenplan gefunden" action={onNavigateToSchedule} actionText="Zum Stundenplan" />
  if (todaySubjects.length === 0)
    return <EmptyState icon={AlertCircle} text="Keine Fächer für heute" action={onNavigateToSchedule} actionText="Stundenplan bearbeiten" />

  return (
    <div className="space-y-4">
      {isReadOnly && (
        <div className="bg-muted border rounded-lg p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-5 w-5" />
          {' '}
          Vergangene Tage können nicht bearbeitet werden.
        </div>
      )}

      {todaySubjects.map(({ subject, periodLabel, totalEntries }) => {
        const subjectEntries = entries.filter(e => e.subjectId === subject.id)

        return (
          <Card key={`${subject.id}-${periodLabel}`} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">

                {/* Header Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center min-w-[48px] h-10 rounded-lg bg-muted text-sm font-bold">{periodLabel}</div>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                  <div className="flex flex-col min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">{subject.name}</CardTitle>
                    {subject.targetGrade && (
                      <div className="text-[10px] text-muted-foreground flex gap-1">
                        <Target className="h-3 w-3" />
                        {' '}
                        Ziel:
                        {' '}
                        {subject.targetGrade}
                        {' '}
                        NP
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-base font-bold">{totalEntries}</div>
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
                        <Button size="sm" className="gap-1.5">
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
                          <DialogDescription>Bewertung wählen</DialogDescription>
                        </DialogHeader>
                        <AddEntryForm
                          subject={subject}
                          evaluationTypes={evaluationTypes}
                          onAdd={(sid, eid) => {
                            addEntry(sid, eid)
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Entries List */}
              <div className="space-y-2">
                {subjectEntries.length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-2">Noch keine Meldungen</p>
                  : (
                      <div className="grid gap-2">
                        {subjectEntries.map((entry, idx) => {
                          const et = evaluationTypes.find(e => e.id === entry.evaluationTypeId)
                          return (
                            <div key={entry.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card">
                              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs">{idx + 1}</div>
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: et?.color }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{et?.name}</div>
                              </div>
                              {!isReadOnly && <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 hover:opacity-100" onClick={() => deleteEntry(entry.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                            </div>
                          )
                        })}
                      </div>
                    )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function EmptyState({ icon: Icon, text, action, actionText }: { icon: any, text: string, action?: () => void, actionText?: string }) {
  return (
    <Card>
      <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
        <Icon className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{text}</p>
        {action && <Button onClick={action} variant="outline">{actionText}</Button>}
      </CardContent>
    </Card>
  )
}

function AddEntryForm({ subject, evaluationTypes, onAdd }: { subject: Subject, evaluationTypes: EvaluationType[], onAdd: (s: string, e: string) => void }) {
  const [selected, setSelected] = useState('')
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {evaluationTypes.map(et => (
          <button key={et.id} type="button" onClick={() => setSelected(et.id)} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${selected === et.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:bg-accent'}`}>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: et.color }} />
            <span className="font-medium">{et.name}</span>
          </button>
        ))}
      </div>
      <Button onClick={() => onAdd(subject.id, selected)} disabled={!selected} className="w-full">Hinzufügen</Button>
    </div>
  )
}
