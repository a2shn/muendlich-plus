import type { ScheduleSlot, WeekSystemSettings } from '@/sync'
import { useCallback, useEffect, useState } from 'react'
import { formatDate } from '@/lib/date-utils'
import { db } from '@/sync'

export function useScheduleEditor(onScheduleChange?: () => void) {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [weekSettings, setWeekSettings] = useState<WeekSystemSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [slots, settings] = await Promise.all([db.getScheduleSlots(), db.getWeekSystemSettings()])
      setSchedule(slots)
      setWeekSettings(settings)
    }
    catch (error) {
      console.error('[schedule-hook] Failed to load data:', error)
    }
    finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --- Actions ---

  const handleToggleWeekSystem = async (enabled: boolean) => {
    await db.saveWeekSystemSettings({ enabled, referenceDate: formatDate(new Date()) })
    await loadData()
    onScheduleChange?.()
  }

  const handleReferenceDateChange = async (date: string) => {
    if (!weekSettings)
      return
    await db.saveWeekSystemSettings({ enabled: weekSettings.enabled, referenceDate: date })
    await loadData()
  }

  const handleAddSlot = async (dayOfWeek: number, period: number, subjectId: string, weekType?: 'A' | 'B' | null) => {
    const existing = schedule.find(s => s.dayOfWeek === dayOfWeek && s.period === period && (weekSettings?.enabled ? s.weekType === weekType : true))
    if (existing)
      await db.deleteScheduleSlot(existing.id)

    await db.addScheduleSlot({ dayOfWeek, period, subjectId, weekType: weekSettings?.enabled ? weekType : null })
    await loadData()
    onScheduleChange?.()
  }

  const handleRemoveSlot = async (dayOfWeek: number, period: number, weekType?: 'A' | 'B' | null) => {
    const slot = schedule.find(s => s.dayOfWeek === dayOfWeek && s.period === period && (weekSettings?.enabled ? s.weekType === weekType : true))
    if (slot) {
      await db.deleteScheduleSlot(slot.id)
      await loadData()
      onScheduleChange?.()
    }
  }

  const handleClearAll = async () => {
    await db.clearScheduleSlots()
    await loadData()
    onScheduleChange?.()
  }

  return {
    schedule,
    weekSettings,
    isLoading,
    handleToggleWeekSystem,
    handleReferenceDateChange,
    handleAddSlot,
    handleRemoveSlot,
    handleClearAll,
  }
}
