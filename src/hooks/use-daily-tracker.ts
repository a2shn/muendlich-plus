import type { ParticipationEntry, Subject } from '@/sync'
import { useCallback, useEffect, useState } from 'react'
import { getCurrentWeekType, getDayOfWeek, isPastDate, parseDate } from '@/lib/date-utils'
import { db } from '@/sync'

export interface DailySubject {
  subject: Subject
  periodLabel: string
  totalEntries: number
}

export function useDailyTracker(date: string, subjects: Subject[]) {
  const [entries, setEntries] = useState<ParticipationEntry[]>([])
  const [todaySubjects, setTodaySubjects] = useState<DailySubject[]>([])
  const [hasSchedule, setHasSchedule] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const isReadOnly = isPastDate(date)

  const loadData = useCallback(async () => {
    try {
      const [loadedEntries, loadedSlots, settings] = await Promise.all([
        db.getEntriesForDate(date),
        db.getScheduleSlots(),
        db.getWeekSystemSettings(),
      ])

      setEntries(loadedEntries)
      setHasSchedule(loadedSlots.length > 0)

      // Calculate Today's Subjects
      const dateObj = parseDate(date)
      const dayOfWeek = getDayOfWeek(dateObj)
      let weekType: 'A' | 'B' = 'A'

      if (settings?.enabled && settings.referenceDate) {
        weekType = getCurrentWeekType(dateObj, settings.referenceDate)
      }

      if (dayOfWeek !== -1 && loadedSlots.length > 0) {
        const todaySlots = loadedSlots.filter((slot) => {
          if (slot.dayOfWeek !== dayOfWeek)
            return false
          if (settings?.enabled)
            return slot.weekType === weekType
          return !slot.weekType
        })

        // Group double periods (1&2, 3&4 etc.)
        const pairs = [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]
        const uniqueList: any[] = []

        pairs.forEach(([p1, p2]) => {
          const s1 = todaySlots.find(s => s.period === p1)
          const s2 = todaySlots.find(s => s.period === p2)

          if (s1 && s2 && s1.subjectId === s2.subjectId) {
            const sub = subjects.find(s => s.id === s1.subjectId)
            if (sub)
              uniqueList.push({ subject: sub, periodLabel: `${p1}./${p2}.`, firstPeriod: p1 })
          }
          else {
            [s1, s2].forEach((s) => {
              if (s) {
                const sub = subjects.find(x => x.id === s.subjectId)
                if (sub)
                  uniqueList.push({ subject: sub, periodLabel: `${s.period}.`, firstPeriod: s.period })
              }
            })
          }
        })

        uniqueList.sort((a, b) => a.firstPeriod - b.firstPeriod)

        // Combine with entry counts
        setTodaySubjects(uniqueList.map(item => ({
          ...item,
          totalEntries: loadedEntries.filter(e => e.subjectId === item.subject.id).length,
        })))
      }
      else {
        setTodaySubjects([])
      }
    }
    catch (e) {
      console.error(e)
    }
    finally {
      setIsLoading(false)
    }
  }, [date, subjects])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --- Actions ---

  const addEntry = async (subjectId: string, evaluationTypeId: string) => {
    if (isReadOnly)
      return
    await db.addEntry({ subjectId, date, evaluationTypeId })
    await loadData()
  }

  const deleteEntry = async (id: string) => {
    if (isReadOnly)
      return
    await db.deleteEntry(id)
    await loadData()
  }

  return {
    entries,
    todaySubjects,
    hasSchedule,
    isLoading,
    isReadOnly,
    addEntry,
    deleteEntry,
  }
}
