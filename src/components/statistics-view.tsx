import type { EvaluationType, Grade, ParticipationEntry, Subject } from '@/lib/db'
import { Award, BarChart3, Calendar, GraduationCap, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDB } from '@/lib/db'
import { GradeEntryDialog } from './grade-entry-dialog'

interface StatisticsViewProps {
  subjects: Subject[]
  evaluationTypes: EvaluationType[]
}

interface SubjectStats {
  subjectId: string
  totalEntries: number
  evaluationCounts: Record<string, number>
  lastActivity?: string
}

interface GradeCorrelation {
  grade: number
  evaluationCounts: Record<string, number>
  count: number
  date: string
  note?: string
}

export function StatisticsView({ subjects, evaluationTypes }: StatisticsViewProps) {
  const [stats, setStats] = useState<SubjectStats[]>([])
  const [totalEntries, setTotalEntries] = useState(0)
  const [grades, setGrades] = useState<Grade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const loadGrades = useCallback(async () => {
    try {
      const db = await getDB()
      const allGrades = await db.getGrades()
      setGrades(allGrades)
    }
    catch (error) {
      console.error('[calendar+] Failed to load grades:', error)
    }
  }, [])
  const getAllEntriesForSubject = useCallback(async (subjectId: string): Promise<ParticipationEntry[]> => {
    const db = await getDB()
    return new Promise((resolve, reject) => {
    // FIX: accessing the raw db property via db.db!
      const transaction = db.db!.transaction('entries', 'readonly')
      const store = transaction.objectStore('entries')
      const request = store.getAll()

      request.onsuccess = () => {
        const allEntries = request.result || []
        const filtered = allEntries.filter((e: ParticipationEntry) => e.subjectId === subjectId)
        resolve(filtered)
      }
      request.onerror = () => reject(request.error)
    })
  }, [])
  const loadStatistics = useCallback(async () => {
    try {
      const subjectStats: SubjectStats[] = []
      let total = 0

      for (const subject of subjects) {
        const entries = await getAllEntriesForSubject(subject.id)
        const evaluationCounts: Record<string, number> = {}

        entries.forEach((entry) => {
          evaluationCounts[entry.evaluationTypeId] = (evaluationCounts[entry.evaluationTypeId] || 0) + 1
        })

        const lastEntry = entries.sort((a, b) => b.timestamp - a.timestamp)[0]

        subjectStats.push({
          subjectId: subject.id,
          totalEntries: entries.length,
          evaluationCounts,
          lastActivity: lastEntry?.date,
        })

        total += entries.length
      }

      setStats(subjectStats)
      setTotalEntries(total)
    }
    catch (error) {
      console.error('[calendar+] Failed to load statistics:', error)
    }
  }, [subjects, getAllEntriesForSubject])

  const loadData = useCallback(async () => {
    try {
      await Promise.all([loadStatistics(), loadGrades()])
    }
    finally {
      setIsLoading(false)
    }
  }, [loadStatistics, loadGrades])

  const getSubjectName = (id: string) => {
    return subjects.find(s => s.id === id)?.name || 'Unbekannt'
  }

  const getSubjectColor = (id: string) => {
    return subjects.find(s => s.id === id)?.color || '#6b7280'
  }

  const getEvaluationTypeName = (id: string) => {
    return evaluationTypes.find(et => et.id === id)?.name || 'Unbekannt'
  }

  const getEvaluationTypeColor = (id: string) => {
    return evaluationTypes.find(et => et.id === id)?.color || '#6b7280'
  }

  const getMostActiveSubject = () => {
    if (stats.length === 0)
      return null
    return stats.reduce((prev, current) => (prev.totalEntries > current.totalEntries ? prev : current))
  }

  const getAveragePerSubject = () => {
    if (subjects.length === 0)
      return 0
    return (totalEntries / subjects.length).toFixed(1)
  }

  const getGradeCorrelations = (subjectId: string): GradeCorrelation[] => {
    return grades
      .filter(g => g.subjectId === subjectId)
      .map(g => ({
        grade: g.grade,
        evaluationCounts: JSON.parse(g.evaluationCombination),
        count: 1,
        date: g.date,
        note: g.note,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const getAverageGrade = (subjectId: string): string => {
    const subjectGrades = grades.filter(g => g.subjectId === subjectId)
    if (subjectGrades.length === 0)
      return '—'
    const avg = subjectGrades.reduce((sum, g) => sum + g.grade, 0) / subjectGrades.length
    return avg.toFixed(2)
  }
  useEffect(() => {
    loadData()
  }, [subjects, loadData])

  const mostActive = getMostActiveSubject()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    )
  }

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">Erstelle zuerst Fächer, um Statistiken anzuzeigen.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Übersicht</TabsTrigger>
        <TabsTrigger value="grades">Noten & Korrelationen</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Overview cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt Meldungen</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEntries}</div>
              <p className="text-xs text-muted-foreground mt-1">Über alle Fächer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durchschnitt pro Fach</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getAveragePerSubject()}</div>
              <p className="text-xs text-muted-foreground mt-1">Meldungen pro Fach</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktivstes Fach</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {mostActive && mostActive.totalEntries > 0
                ? (
                    <>
                      <div className="text-2xl font-bold flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getSubjectColor(mostActive.subjectId) }}
                        />
                        {getSubjectName(mostActive.subjectId)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {mostActive.totalEntries}
                        {' '}
                        Meldungen
                      </p>
                    </>
                  )
                : null}
            </CardContent>
          </Card>
        </div>

        {/* Per subject statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiken pro Fach</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.map((stat) => {
              const subject = subjects.find(s => s.id === stat.subjectId)
              if (!subject)
                return null

              return (
                <div key={stat.subjectId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }} />
                      <h3 className="font-semibold text-lg">{subject.name}</h3>
                      <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                        {stat.totalEntries}
                      </div>
                    </div>
                    {stat.lastActivity && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(stat.lastActivity).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {evaluationTypes.map((evalType) => {
                      const count = stat.evaluationCounts[evalType.id] || 0
                      const percentage = stat.totalEntries > 0 ? (count / stat.totalEntries) * 100 : 0

                      return (
                        <div key={evalType.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: evalType.color }} />
                              <span>{evalType.name}</span>
                            </div>
                            <span className="font-medium">
                              {count}
                              {' '}
                              (
                              {percentage.toFixed(0)}
                              %)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: evalType.color,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="grades" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Noten & Korrelationen</CardTitle>
            <CardDescription>Sehen Sie welche Meldungs-Kombinationen zu welchen Noten führen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {subjects.map((subject) => {
              const correlations = getGradeCorrelations(subject.id)
              const avgGrade = getAverageGrade(subject.id)

              return (
                <div key={subject.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }} />
                      <h3 className="font-semibold text-lg">{subject.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        Ø
                        {avgGrade}
                      </div>
                    </div>
                    <GradeEntryDialog subject={subject} evaluationTypes={evaluationTypes} onGradeAdded={loadData} />
                  </div>

                  {correlations.length === 0
                    ? (
                        <p className="text-sm text-muted-foreground">Noch keine Noten eingetragen</p>
                      )
                    : (
                        <div className="space-y-3">
                          {correlations.map((corr, idx) => (
                            <div key={idx.toString()} className="bg-muted/50 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="text-2xl font-bold">
                                    Note:
                                    {corr.grade.toFixed(1)}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(corr.date).toLocaleDateString('de-DE')}
                                  </span>
                                </div>
                              </div>
                              {corr.note && <p className="text-sm text-muted-foreground italic">{corr.note}</p>}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(corr.evaluationCounts).map(([evalId, count]) => (
                                  <div key={evalId} className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: getEvaluationTypeColor(evalId) }}
                                    />
                                    <span>
                                      {getEvaluationTypeName(evalId)}
                                      :
                                    </span>
                                    <span className="font-semibold">{count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
