import type { EvaluationType, Subject } from '@/sync'
import { Award, BarChart3, Target, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStatistics } from '@/hooks/use-statistics'

interface StatisticsViewProps {
  subjects: Subject[]
  evaluationTypes: EvaluationType[]
}

export function StatisticsView({ subjects, evaluationTypes }: StatisticsViewProps) {
  const {
    stats,
    totalEntries,
    isLoading,
    isPointsSystem,
    getMostActiveSubject,
    getAveragePerSubject,
  } = useStatistics(subjects)

  if (isLoading)
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent" /></div>

  if (subjects.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center text-muted-foreground">Erstelle zuerst Fächer, um Statistiken anzuzeigen.</CardContent></Card>
    )
  }

  const mostActive = getMostActiveSubject()
  const activeSubject = mostActive ? subjects.find(s => s.id === mostActive.subjectId) : null

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard title="Gesamt Meldungen" icon={BarChart3} value={totalEntries} subtitle="Über alle Fächer" />
        <KPICard title="Durchschnitt pro Fach" icon={TrendingUp} value={getAveragePerSubject()} subtitle="Meldungen pro Fach" />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivstes Fach</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {mostActive && activeSubject
              ? (
                  <>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeSubject.color }} />
                      {activeSubject.name}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {mostActive.totalEntries}
                      {' '}
                      Meldungen
                    </p>
                  </>
                )
              : <div className="text-2xl font-bold">—</div>}
          </CardContent>
        </Card>
      </div>

      {/* Per Subject Stats */}
      <Card>
        <CardHeader><CardTitle>Statistiken pro Fach</CardTitle></CardHeader>
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
                    <div>
                      <h3 className="font-semibold text-lg leading-none">{subject.name}</h3>
                      {subject.targetGrade && (
                        <div className="text-xs text-muted-foreground mt-1 flex gap-1">
                          <Target className="h-3 w-3" />
                          {' '}
                          Ziel:
                          {' '}
                          {subject.targetGrade}
                          {' '}
                          {isPointsSystem ? 'NP' : 'Note'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">{stat.totalEntries}</div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-2">
                  {evaluationTypes.map((evalType) => {
                    const count = stat.evaluationCounts[evalType.id] || 0
                    const percentage = stat.totalEntries > 0 ? (count / stat.totalEntries) * 100 : 0
                    return (
                      <div key={evalType.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: evalType.color }} />
                            {' '}
                            {evalType.name}
                          </span>
                          <span className="font-medium">
                            {count}
                            {' '}
                            (
                            {percentage.toFixed(0)}
                            %)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${percentage}%`, backgroundColor: evalType.color }} /></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function KPICard({ title, icon: Icon, value, subtitle }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
}
