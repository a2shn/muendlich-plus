import type { Grade, Subject } from '@/sync'
import { useCallback, useEffect, useState } from 'react'
import { db } from '@/sync'

interface SubjectStats {
  subjectId: string
  totalEntries: number
  evaluationCounts: Record<string, number>
  lastActivity?: string
}

export function useStatistics(subjects: Subject[]) {
  const [stats, setStats] = useState<SubjectStats[]>([])
  const [totalEntries, setTotalEntries] = useState(0)
  const [grades, setGrades] = useState<Grade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPointsSystem, setIsPointsSystem] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [allGrades, settings, allEntries] = await Promise.all([
        db.getGrades(),
        db.getUserSettings(),
        db.getAllEntries(),
      ])

      setGrades(allGrades)
      setIsPointsSystem(settings?.gradingSystem !== 'grades')

      // Calculate Stats
      const subjectStats: SubjectStats[] = []
      let total = 0

      for (const subject of subjects) {
        const entries = allEntries.filter(e => e.subjectId === subject.id)
        const evaluationCounts: Record<string, number> = {}

        entries.forEach((e) => {
          evaluationCounts[e.evaluationTypeId] = (evaluationCounts[e.evaluationTypeId] || 0) + 1
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
      console.error('[useStatistics] Failed to load data:', error)
    }
    finally {
      setIsLoading(false)
    }
  }, [subjects])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --- Helpers ---
  const getMostActiveSubject = () => {
    if (stats.length === 0)
      return null
    return stats.reduce((prev, current) => (prev.totalEntries > current.totalEntries ? prev : current))
  }

  const getAveragePerSubject = () => {
    if (subjects.length === 0)
      return '0.0'
    return (totalEntries / subjects.length).toFixed(1)
  }

  const getAverageGrade = (subjectId: string): string => {
    const subjectGrades = grades.filter(g => g.subjectId === subjectId)
    if (subjectGrades.length === 0)
      return '—'
    const avg = subjectGrades.reduce((sum, g) => sum + g.grade, 0) / subjectGrades.length
    return avg.toFixed(2)
  }

  return {
    stats,
    totalEntries,
    grades,
    isLoading,
    isPointsSystem,
    loadData, // Expose reload function
    getMostActiveSubject,
    getAveragePerSubject,
    getAverageGrade,
  }
}
