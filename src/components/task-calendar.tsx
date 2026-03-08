import type { Exam, Subject, Task } from '@/sync'
import { Calendar as CalendarIcon, Clock, GraduationCap, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTaskCalendar } from '@/hooks/use-task-calendar'

import { formatDate } from '@/lib/date-utils'

interface TaskCalendarProps {
  subjects: Subject[]
}

export function TaskCalendar({ subjects }: TaskCalendarProps) {
  const {
    tasks,
    exams,
    allItems,
    isAddOpen,
    setIsAddOpen,
    newItemType,
    setNewItemType,
    newItemTitle,
    setNewItemTitle,
    newItemDate,
    setNewItemDate,
    newItemSubject,
    setNewItemSubject,
    newItemExamType,
    setNewItemExamType,
    handleAddItem,
    handleDelete,
  } = useTaskCalendar()

  const [activeTab, setActiveTab] = useState('all')

  const getSub = (id: string) => subjects.find(s => s.id === id)

  const renderList = (items: (Task | Exam)[]) => {
    if (items.length === 0)
      return <div className="text-center py-8 text-muted-foreground">Keine Einträge vorhanden.</div>

    const today = formatDate(new Date())
    const overdue = items.filter(i => ('dueDate' in i ? i.dueDate : i.date) < today)
    const dueToday = items.filter(i => ('dueDate' in i ? i.dueDate : i.date) === today)
    const upcoming = items.filter(i => ('dueDate' in i ? i.dueDate : i.date) > today)

    const renderSection = (title: string, list: any[], color: string) => list.length > 0 && (
      <div className="mb-6 space-y-2">
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${color}`}>{title}</h3>
        {list.map((item) => {
          const isTask = 'dueDate' in item
          const date = isTask ? item.dueDate : item.date
          const sub = getSub(item.subjectId)

          return (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: sub?.color || '#808080' }} />
              <div className="h-6 w-6 shrink-0 flex items-center justify-center">
                {isTask ? <div className="h-2 w-2 rounded-full bg-primary" /> : <GraduationCap className="h-5 w-5 text-orange-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.title}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{sub?.name || '?'}</span>
                  {' '}
                  •
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {' '}
                    {new Date(date).toLocaleDateString()}
                  </span>
                  {!isTask && <Badge variant="outline" className="text-[10px] h-4 px-1">{item.type}</Badge>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDelete(item.id, isTask ? 'task' : 'exam')}><Trash2 className="h-4 w-4" /></Button>
            </div>
          )
        })}
      </div>
    )

    return (
      <div>
        {renderSection('Überfällig', overdue, 'text-destructive')}
        {renderSection('Heute', dueToday, 'text-primary')}
        {renderSection('Demnächst', upcoming, 'text-muted-foreground')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">Alles</TabsTrigger>
              <TabsTrigger value="tasks">Aufgaben</TabsTrigger>
              <TabsTrigger value="exams">Klausuren</TabsTrigger>
            </TabsList>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  <span className="hidden xs:inline">Neu</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuer Eintrag</DialogTitle>
                  <DialogDescription>Hausaufgabe oder Klausur erstellen.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Typ</Label>
                    <Select value={newItemType} onValueChange={(v: any) => setNewItemType(v)}>
                      <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task">Hausaufgabe</SelectItem>
                        <SelectItem value="exam">Klausur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Fach</Label>
                    <Select value={newItemSubject} onValueChange={setNewItemSubject}>
                      <SelectTrigger className="col-span-3"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                      <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Titel</Label>
                    <Input value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Datum</Label>
                    <Input type="date" value={newItemDate} onChange={e => setNewItemDate(e.target.value)} className="col-span-3" />
                  </div>
                  {newItemType === 'exam' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Art</Label>
                      <Select value={newItemExamType} onValueChange={(v: any) => setNewItemExamType(v)}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Klausur">Klausur</SelectItem>
                          <SelectItem value="Test">Test</SelectItem>
                          <SelectItem value="Referat">Referat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter><Button onClick={handleAddItem} disabled={!newItemTitle || !newItemSubject}>Speichern</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {' '}
                Agenda
              </CardTitle>
              <CardDescription>Aufgaben und Termine</CardDescription>
            </CardHeader>
            <CardContent>
              <TabsContent value="all" className="mt-0">{renderList(allItems)}</TabsContent>
              <TabsContent value="tasks" className="mt-0">{renderList(tasks)}</TabsContent>
              <TabsContent value="exams" className="mt-0">{renderList(exams)}</TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}
