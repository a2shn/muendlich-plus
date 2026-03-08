'use client'

import type { EvaluationType, Subject } from '@/sync'
import { PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useGlobalAlert } from '@/components/global-alert-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { db } from '@/sync'

interface GradeEntryDialogProps {
  subject: Subject
  evaluationTypes: EvaluationType[]
  onGradeAdded: () => void
}

export function GradeEntryDialog({ subject, onGradeAdded }: GradeEntryDialogProps) {
  const [open, setOpen] = useState(false)
  const [grade, setGrade] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPointsSystem, setIsPointsSystem] = useState(true)

  const { showAlert } = useGlobalAlert()

  useEffect(() => {
    if (open) {
      db.then(async (db) => {
        const settings = await db.getUserSettings()
        setIsPointsSystem(settings?.gradingSystem !== 'grades')
      })
    }
  }, [open])

  const handleSubmit = async () => {
    const val = Number.parseFloat(grade)
    const min = isPointsSystem ? 0 : 1
    const max = isPointsSystem ? 15 : 6

    if (!grade || Number.isNaN(val) || val < min || val > max) {
      await showAlert('Hinweis', `Bitte geben Sie eine gültige ${isPointsSystem ? 'Punktzahl (0-15)' : 'Note (1-6)'} ein.`)
      return
    }

    setIsSubmitting(true)

    try {
      const allEntries = await db.getAllEntries()
      const subjectEntries = allEntries.filter(e => e.subjectId === subject.id)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const now = new Date()

      const relevantEntries = subjectEntries.filter((e) => {
        const entryDate = new Date(e.date)
        return entryDate >= thirtyDaysAgo && entryDate <= now
      })

      const evalCounts: Record<string, number> = {}
      relevantEntries.forEach((entry) => {
        evalCounts[entry.evaluationTypeId] = (evalCounts[entry.evaluationTypeId] || 0) + 1
      })

      await db.addGrade({
        subjectId: subject.id,
        grade: val,
        date: new Date().toISOString().split('T')[0],
        evaluationCombination: JSON.stringify(evalCounts),
      })

      setOpen(false)
      setGrade('')
      onGradeAdded()
    }
    catch (error) {
      console.error('[calendar+] Failed to add grade:', error)
      await showAlert('Fehler', 'Fehler beim Speichern der Note')
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PlusCircle className="h-4 w-4 mr-2" />
          Note eintragen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Note eintragen für
            {subject.name}
          </DialogTitle>
          <DialogDescription>Die letzten 30 Tage an Meldungen werden mit dieser Note verknüpft</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="grade">{isPointsSystem ? 'Punkte (0-15)' : 'Note (1-6)'}</Label>
            <Input
              id="grade"
              type="number"
              min={isPointsSystem ? 0 : 1}
              max={isPointsSystem ? 15 : 6}
              step={isPointsSystem ? 1 : 0.1}
              value={grade}
              onChange={e => setGrade(e.target.value)}
              placeholder={isPointsSystem ? 'z.B. 11' : 'z.B. 2.5'}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
