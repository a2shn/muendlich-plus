import type { Exam, ScheduleSlot, Task, WeekSystemSettings } from '@/sync'
import { useCallback, useEffect, useState } from 'react'
import { formatDate, getCurrentWeekType, getDayOfWeek } from '@/lib/date-utils'
import { db } from '@/sync'

export function useTaskCalendar() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [weekSettings, setWeekSettings] = useState<WeekSystemSettings | null>(null)

  // Add Form State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newItemType, setNewItemType] = useState<'task' | 'exam'>('task')
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemDate, setNewItemDate] = useState(() => formatDate(new Date()))
  const [newItemSubject, setNewItemSubject] = useState('')
  const [newItemExamType, setNewItemExamType] = useState<Exam['type']>('Klausur')

  const suggestNextDate = useCallback((subjectId: string, currentSlots: ScheduleSlot[], settings: WeekSystemSettings | null) => {
    if (!subjectId || currentSlots.length === 0)
      return

    const subjectSlots = currentSlots.filter(s => s.subjectId === subjectId)
    if (subjectSlots.length === 0)
      return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Look ahead up to 14 days
    for (let i = 1; i <= 14; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() + i)

      const dayOfWeek = getDayOfWeek(checkDate)
      if (dayOfWeek === -1)
        continue // Skip weekends

      let weekType: 'A' | 'B' | null = null
      if (settings?.enabled && settings.referenceDate) {
        weekType = getCurrentWeekType(checkDate, settings.referenceDate)
      }

      const hasSlot = subjectSlots.some(s =>
        s.dayOfWeek === dayOfWeek
        && (settings?.enabled ? (s.weekType === null || s.weekType === weekType) : true),
      )

      if (hasSlot) {
        setNewItemDate(formatDate(checkDate))
        break
      }
    }
  }, [])

  const handleSubjectChange = useCallback((subjectId: string) => {
    setNewItemSubject(subjectId)
    suggestNextDate(subjectId, slots, weekSettings)
  }, [slots, weekSettings, suggestNextDate])

  const loadData = useCallback(async () => {
    try {
      const [t, e, s, ws] = await Promise.all([
        db.tasks.getAll(),
        db.exams.getAll(),
        db.getScheduleSlots(),
        db.getWeekSystemSettings(),
      ])
      const sortFn = (a: any, b: any) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime()
      setTasks(t.sort(sortFn))
      setExams(e.sort(sortFn))
      setSlots(s)
      setWeekSettings(ws)
    }
    catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddItem = async () => {
    if (!newItemTitle || !newItemSubject)
      return

    try {
      if (newItemType === 'task') {
        await db.tasks.add({ subjectId: newItemSubject, title: newItemTitle, dueDate: newItemDate })
      }
      else {
        await db.exams.add({ subjectId: newItemSubject, title: newItemTitle, date: newItemDate, type: newItemExamType })
      }
      setIsAddOpen(false)
      setNewItemTitle('')
      setNewItemDate(formatDate(new Date()))
      loadData()
    }
    catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: string, type: 'task' | 'exam') => {
    try {
      if (type === 'task')
        await db.tasks.delete(id)
      else await db.exams.delete(id)
      loadData()
    }
    catch (e) {
      console.error(e)
    }
  }

  const allItems = [...tasks, ...exams].sort((a, b) => {
    const da = new Date('dueDate' in a ? a.dueDate : a.date).getTime()
    const db = new Date('dueDate' in b ? b.dueDate : b.date).getTime()
    return da - db
  })

  return {
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
    setNewItemSubject: handleSubjectChange,
    newItemExamType,
    setNewItemExamType,
    handleAddItem,
    handleDelete,
  }
}
