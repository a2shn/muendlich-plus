import type { Subject } from '@/sync'
import { useEffect, useState } from 'react'
import { useGlobalAlert } from '@/components/global-alert-provider'
import { db } from '@/sync'

export const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
  '#64748b',
]

export function useSubjectManager(subjects: Subject[], onSubjectsChange: () => void) {
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectColor, setNewSubjectColor] = useState(PRESET_COLORS[0])
  const [newSubjectGrade, setNewSubjectGrade] = useState('')
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [isPointsSystem, setIsPointsSystem] = useState(true)

  const { showAlert } = useGlobalAlert()

  useEffect(() => {
    db.getUserSettings().then((s) => {
      const isPoints = s?.gradingSystem !== 'grades'
      setIsPointsSystem(isPoints)
      setNewSubjectGrade(isPoints ? '15' : '1')
    })
  }, [])

  const validateGrade = (grade: number) => {
    const min = isPointsSystem ? 0 : 1
    const max = isPointsSystem ? 15 : 6
    return !Number.isNaN(grade) && grade >= min && grade <= max
  }

  const handleAddSubject = async () => {
    if (!newSubjectName.trim())
      return showAlert('Fehler', 'Bitte gib einen Namen ein.')

    const grade = Number.parseFloat(newSubjectGrade)
    if (!validateGrade(grade))
      return showAlert('Fehler', `Ziel muss zwischen ${isPointsSystem ? '0-15' : '1-6'} liegen.`)

    try {
      const order = subjects.length > 0 ? Math.max(...subjects.map(s => s.order)) + 1 : 0
      await db.addSubject({ name: newSubjectName.trim(), color: newSubjectColor, order, targetGrade: grade })

      setNewSubjectName('')
      setNewSubjectGrade(isPointsSystem ? '15' : '1')
      setNewSubjectColor(PRESET_COLORS[(PRESET_COLORS.indexOf(newSubjectColor) + 1) % PRESET_COLORS.length])
      onSubjectsChange()
    }
    catch (e) {
      console.error(e)
      showAlert('Fehler', 'Fach konnte nicht erstellt werden.')
    }
  }

  const handleUpdateSubject = async () => {
    if (!editingSubject?.name.trim())
      return

    if (editingSubject.targetGrade !== undefined && !validateGrade(editingSubject.targetGrade)) {
      return showAlert('Fehler', 'Ungültiges Ziel.')
    }

    try {
      await db.updateSubject(editingSubject.id, {
        name: editingSubject.name,
        color: editingSubject.color,
        targetGrade: editingSubject.targetGrade,
      })
      setEditingSubject(null)
      onSubjectsChange()
    }
    catch (e) {
      console.error(e)
      showAlert('Fehler', 'Konnte nicht gespeichert werden.')
    }
  }

  const handleDeleteSubject = async (id: string) => {
    try {
      await db.deleteSubject(id)
      onSubjectsChange()
    }
    catch (e) {
      console.error(e)
      showAlert('Fehler', 'Löschen fehlgeschlagen.')
    }
  }

  return {
    newSubjectName,
    setNewSubjectName,
    newSubjectColor,
    setNewSubjectColor,
    newSubjectGrade,
    setNewSubjectGrade,
    editingSubject,
    setEditingSubject,
    isPointsSystem,
    handleAddSubject,
    handleUpdateSubject,
    handleDeleteSubject,
  }
}
