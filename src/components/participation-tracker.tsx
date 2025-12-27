import type { EvaluationType, Subject } from '@/lib/db'
import { BarChart3, BookOpen, Calendar, History, LayoutGrid, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DailyTracker } from '@/components/daily-tracker'
import { EvaluationManager } from '@/components/evaluation-manager'
import { GradeReminder } from '@/components/grade-reminder'
import { Header } from '@/components/header'
import { HistoricalView } from '@/components/historical-view'
import { ScheduleEditor } from '@/components/schedule-editor'
import { StatisticsView } from '@/components/statistics-view'
import { SubjectManager } from '@/components/subject-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/date-utils'
import { getDB } from '@/lib/db'

export default function ParticipationTracker() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [evaluationTypes, setEvaluationTypes] = useState<EvaluationType[]>([])
  const [currentDate] = useState(() => formatDate(new Date()))
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('today')

  useEffect(() => {
    async function loadData() {
      try {
        const db = await getDB()
        const [loadedSubjects, loadedEvalTypes] = await Promise.all([db.getSubjects(), db.getEvaluationTypes()])
        setSubjects(loadedSubjects)
        setEvaluationTypes(loadedEvalTypes)
      }
      catch (error) {
        console.error('[calendar+] Failed to load data:', error)
      }
      finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const refreshSubjects = async () => {
    const db = await getDB()
    const updated = await db.getSubjects()
    setSubjects(updated)
  }

  const refreshEvaluationTypes = async () => {
    const db = await getDB()
    const updated = await db.getEvaluationTypes()
    setEvaluationTypes(updated)
  }

  const handleNavigateToSchedule = () => {
    setActiveTab('schedule')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="text-muted-foreground font-medium">Lade Daten...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header currentDate={currentDate} />

      <div className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1 h-auto mb-4 sm:mb-6">
            <TabsTrigger value="today" className="flex-col gap-1 py-2">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Heute</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex-col gap-1 py-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Statistik</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-col gap-1 py-2">
              <History className="h-4 w-4" />
              <span className="text-xs">Verlauf</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex-col gap-1 py-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="text-xs">Plan</span>
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex-col gap-1 py-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs">Fächer</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-col gap-1 py-2">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Einstellungen</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <DailyTracker
              date={currentDate}
              subjects={subjects}
              evaluationTypes={evaluationTypes}
              onNavigateToSchedule={handleNavigateToSchedule}
            />
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <StatisticsView subjects={subjects} evaluationTypes={evaluationTypes} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <HistoricalView subjects={subjects} evaluationTypes={evaluationTypes} />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <ScheduleEditor subjects={subjects} />
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <SubjectManager subjects={subjects} onSubjectsChange={refreshSubjects} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <GradeReminder />
            <EvaluationManager evaluationTypes={evaluationTypes} onEvaluationTypesChange={refreshEvaluationTypes} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
