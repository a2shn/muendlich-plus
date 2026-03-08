import type { Subject } from '@/sync'
import { CalendarDays, Trash2 } from 'lucide-react'
import { useState } from 'react'

// Sub-Components
import { ScheduleDesktopGrid } from '@/components/schedule-desktop-grid'
import { ScheduleMobileList } from '@/components/schedule-mobile-list'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// Hook
import { useScheduleEditor } from '@/hooks/use-schedule-editor'

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']
const SHORT_DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr']
const PERIODS = Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}.`, period: i + 1 }))

interface ScheduleEditorProps {
  subjects: Subject[]
  onScheduleChange?: () => void
}

export function ScheduleEditor({ subjects, onScheduleChange }: ScheduleEditorProps) {
  const {
    schedule,
    weekSettings,
    isLoading,
    handleToggleWeekSystem,
    handleReferenceDateChange,
    handleAddSlot,
    handleRemoveSlot,
    handleClearAll,
  } = useScheduleEditor(onScheduleChange)

  const [activeWeek, setActiveWeek] = useState<'A' | 'B'>('A')

  // Central slot finder logic
  const getSlot = (day: number, period: number, viewWeek: 'A' | 'B' | null) =>
    schedule.find(s =>
      s.dayOfWeek === day
      && s.period === period
      && (weekSettings?.enabled ? s.weekType === viewWeek : !s.weekType),
    )

  if (isLoading)
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Lade Plan...</div>

  // Render logic for grid/list combination
  const renderContent = (viewWeek: 'A' | 'B' | null) => (
    <>
      <div className="mt-4">
        <ScheduleDesktopGrid
          days={DAYS}
          periods={PERIODS}
          weekType={viewWeek}
          subjects={subjects}
          getSlot={(d, p) => getSlot(d, p, viewWeek)}
          onAddSlot={(d, p, s) => handleAddSlot(d, p, s, viewWeek)}
          onRemoveSlot={(d, p) => handleRemoveSlot(d, p, viewWeek)}
        />

        <ScheduleMobileList
          days={DAYS}
          shortDays={SHORT_DAYS}
          periods={PERIODS}
          subjects={subjects}
          getSlot={(d, p) => getSlot(d, p, viewWeek)}
          onAddSlot={(d, p, s) => handleAddSlot(d, p, s, viewWeek)}
          onRemoveSlot={(d, p) => handleRemoveSlot(d, p, viewWeek)}
        />
      </div>
    </>
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">

      {/* 1. Week System Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            Wochensystem
          </CardTitle>
          <CardDescription>Aktiviere dies, falls dein Plan wöchentlich wechselt (A/B).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="week-toggle">A/B Wochen aktiv?</Label>
            <Switch id="week-toggle" checked={weekSettings?.enabled || false} onCheckedChange={handleToggleWeekSystem} />
          </div>
          {weekSettings?.enabled && (
            <div className="pt-2 border-t">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Startdatum der A-Woche</Label>
              <Input type="date" value={weekSettings.referenceDate} onChange={e => handleReferenceDateChange(e.target.value)} className="max-w-[200px]" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Main Schedule Editor */}
      <Card className="overflow-hidden border-t-4 border-t-primary/20">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/10 pb-4">
          <div>
            <CardTitle>Stundenplan</CardTitle>
            <CardDescription>Tippe auf ein Feld, um ein Fach hinzuzufügen.</CardDescription>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Alles löschen</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bist du sicher?</AlertDialogTitle>
                <AlertDialogDescription>Dies löscht alle eingetragenen Stunden unwiderruflich.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-destructive">Alles Löschen</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {weekSettings?.enabled
            ? (
                <Tabs value={activeWeek} onValueChange={v => setActiveWeek(v as 'A' | 'B')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="A">A-Woche</TabsTrigger>
                    <TabsTrigger value="B">B-Woche</TabsTrigger>
                  </TabsList>
                  <TabsContent value="A" className="mt-0">{renderContent('A')}</TabsContent>
                  <TabsContent value="B" className="mt-0">{renderContent('B')}</TabsContent>
                </Tabs>
              )
            : (
                renderContent(null)
              )}
        </CardContent>
      </Card>
    </div>
  )
}
