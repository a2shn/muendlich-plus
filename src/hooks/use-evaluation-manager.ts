import type { EvaluationType } from '@/sync'
import { useState } from 'react'
import { useGlobalAlert } from '@/components/global-alert-provider'
import { db } from '@/sync'

export const PRESET_COLORS = [
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#6b7280',
  '#8b5cf6',
  '#3b82f6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#6366f1',
]

export function useEvaluationManager(evaluationTypes: EvaluationType[], onChange: () => void) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editingType, setEditingType] = useState<EvaluationType | null>(null)

  const { showAlert } = useGlobalAlert()

  const handleAdd = async () => {
    if (!newName.trim())
      return showAlert('Fehler', 'Bitte gib einen Namen ein.')

    try {
      const order = evaluationTypes.length > 0 ? Math.max(...evaluationTypes.map(t => t.order)) + 1 : 0
      await db.addEvaluationType({ name: newName.trim(), color: newColor, order })

      setNewName('')
      setNewColor(PRESET_COLORS[(PRESET_COLORS.indexOf(newColor) + 1) % PRESET_COLORS.length])
      onChange()
    }
    catch (e) {
      console.error(e)
      showAlert('Fehler', 'Typ konnte nicht erstellt werden.')
    }
  }

  const handleUpdate = async () => {
    if (!editingType?.name.trim())
      return

    try {
      await db.updateEvaluationType(editingType.id, { name: editingType.name, color: editingType.color })
      setEditingType(null)
      onChange()
    }
    catch (e) {
      console.error(e)
      showAlert('Fehler', 'Änderungen konnten nicht gespeichert werden.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await db.deleteEvaluationType(id)
      onChange()
    }
    catch (e) {
      console.error(e)
      showAlert('Fehler', 'Typ konnte nicht gelöscht werden.')
    }
  }

  return {
    newName,
    setNewName,
    newColor,
    setNewColor,
    editingType,
    setEditingType,
    handleAdd,
    handleUpdate,
    handleDelete,
  }
}
