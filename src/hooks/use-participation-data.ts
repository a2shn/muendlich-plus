import type { EvaluationType, Subject } from '@/sync'
import { useCallback, useEffect, useState } from 'react'
import { db } from '@/sync'

export function useParticipationData() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [evaluationTypes, setEvaluationTypes] = useState<EvaluationType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshSubjects = useCallback(async () => {
    const updated = await db.getSubjects()
    setSubjects(updated)
  }, [])

  const refreshEvaluationTypes = useCallback(async () => {
    const updated = await db.getEvaluationTypes()
    setEvaluationTypes(updated)
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        const [loadedSubjects, loadedEvalTypes] = await Promise.all([
          db.getSubjects(),
          db.getEvaluationTypes(),
        ])
        setSubjects(loadedSubjects)
        setEvaluationTypes(loadedEvalTypes)
      }
      catch (error) {
        console.error('[participation-hook] Failed to load data:', error)
      }
      finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Listen for global DB updates
    const handleDbUpdate = () => {
      refreshSubjects()
      refreshEvaluationTypes()
    }
    window.addEventListener('participation-data-changed', handleDbUpdate)

    return () => {
      window.removeEventListener('participation-data-changed', handleDbUpdate)
    }
  }, [refreshSubjects, refreshEvaluationTypes])

  return {
    subjects,
    evaluationTypes,
    isLoading,
    refreshSubjects,
    refreshEvaluationTypes,
  }
}
