import type { EvaluationType, ParticipationEntry, Subject } from '@/lib/db'
import { Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDisplayDate } from '@/lib/date-utils'
import { getDB } from '@/lib/db'

interface HistoricalViewProps {
  subjects: Subject[]
  evaluationTypes: EvaluationType[]
}

interface DayStats {
  date: string
  entries: ParticipationEntry[]
  totalCount: number
  bySubject: Record<string, number>
}

export function HistoricalView({ subjects, evaluationTypes }: HistoricalViewProps) {
  const [history, setHistory] = useState<DayStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadHistory = async () => {
    try {
      const db = await getDB()

      // Get last 30 days
      const days: string[] = []
      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        days.push(formatDate(date))
      }

      const historyData: DayStats[] = []
      for (const date of days) {
        const entries = await db.getEntriesForDate(date)
        if (entries.length > 0) {
          const bySubject: Record<string, number> = {}
          entries.forEach((entry) => {
            bySubject[entry.subjectId] = (bySubject[entry.subjectId] || 0) + 1
          })

          historyData.push({
            date,
            entries,
            totalCount: entries.length,
            bySubject,
          })
        }
      }

      setHistory(historyData)
    }
    catch (error) {
      console.error('[calendar+] Failed to load history:', error)
    }
    finally {
      setIsLoading(false)
    }
  }

  const getSubjectName = (id: string) => {
    return subjects.find(s => s.id === id)?.name || 'Unbekannt'
  }

  const getSubjectColor = (id: string) => {
    return subjects.find(s => s.id === id)?.color || '#6b7280'
  }

  const getEvaluationTypeColor = (id: string) => {
    return evaluationTypes.find(et => et.id === id)?.color || '#6b7280'
  }
  useEffect(() => {
    loadHistory()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">Lade Verlauf...</p>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Noch keine historischen Daten vorhanden.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Erfasse Meldungen im Tab "Heute", um einen Verlauf aufzubauen.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {history.map(day => (
        <Card key={day.date}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{formatDisplayDate(day.date)}</CardTitle>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                {day.totalCount}
                {' '}
                Meldungen
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(day.bySubject).map(([subjectId, count]) => {
                const subjectEntries = day.entries.filter(e => e.subjectId === subjectId)

                return (
                  <div key={subjectId} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSubjectColor(subjectId) }} />
                      <span className="font-medium">{getSubjectName(subjectId)}</span>
                      <span className="text-sm text-muted-foreground">
                        (
                        {count}
                        )
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 ml-5">
                      {subjectEntries.map(entry => (
                        <div
                          key={entry.id}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getEvaluationTypeColor(entry.evaluationTypeId) }}
                          title={entry.note}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
