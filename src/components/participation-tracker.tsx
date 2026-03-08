import { Loader2 } from 'lucide-react'
import { useState } from 'react'

// Tab Content Components
import { AccountSettings } from '@/components/account-settings'

import { DailyTracker } from '@/components/daily-tracker'
import { EvaluationManager } from '@/components/evaluation-manager'

import { Header } from '@/components/header'
import { HistoricalView } from '@/components/historical-view'
import { ScheduleEditor } from '@/components/schedule-editor'
import { StatisticsView } from '@/components/statistics-view'
import { SubjectManager } from '@/components/subject-manager'
import { TaskCalendar } from '@/components/task-calendar'
// Components
import { TrackerNavigation } from '@/components/tracker-navigation'
import { Tabs, TabsContent } from '@/components/ui/tabs'
// Hooks
import { useParticipationData } from '@/hooks/use-participation-data'
import { formatDate } from '@/lib/date-utils'

export default function ParticipationTracker() {
  // 1. Logic extracted to hook
  const { subjects, evaluationTypes, isLoading, refreshSubjects, refreshEvaluationTypes } = useParticipationData()

  // 2. UI State
  const [currentDate] = useState(() => formatDate(new Date()))
  const [activeTab, setActiveTab] = useState('today')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Lade deine Daten...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      <Header currentDate={currentDate} />

      <div className="flex-1 container mx-auto max-w-7xl p-4 pb-24 sm:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">

          {/* Navigation (Mobile & Desktop) */}
          <TrackerNavigation
            onTabChange={setActiveTab}
            isDrawerOpen={isDrawerOpen}
            setIsDrawerOpen={setIsDrawerOpen}
          />

          {/* Content Area */}
          <div className="min-h-[50vh] animate-in fade-in-50 slide-in-from-bottom-2 duration-300">

            <TabsContent value="today" className="space-y-6 mt-0">
              <DailyTracker
                date={currentDate}
                subjects={subjects}
                evaluationTypes={evaluationTypes}
                onNavigateToSchedule={() => setActiveTab('schedule')}
              />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
              <TaskCalendar subjects={subjects} />
            </TabsContent>

            <TabsContent value="statistics" className="mt-0">
              <StatisticsView subjects={subjects} evaluationTypes={evaluationTypes} />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <HistoricalView subjects={subjects} evaluationTypes={evaluationTypes} />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0">
              <ScheduleEditor subjects={subjects} />
            </TabsContent>

            <TabsContent value="subjects" className="mt-0">
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <SubjectManager subjects={subjects} onSubjectsChange={refreshSubjects} />
                <EvaluationManager
                  evaluationTypes={evaluationTypes}
                  onEvaluationTypesChange={refreshEvaluationTypes}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-0">
              <AccountSettings />
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  )
}
