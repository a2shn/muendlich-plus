import type { EvaluationType, ParticipationEntry, Subject } from '@/lib/db'
import { PlusCircle } from 'lucide-react'
import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { getDB } from '@/lib/db'

interface GradeEntryDialogProps {
  subject: Subject
  evaluationTypes: EvaluationType[]
  onGradeAdded: () => void
}

export function GradeEntryDialog({ subject, onGradeAdded }: GradeEntryDialogProps) {
  const [open, setOpen] = useState(false)
  const [grade, setGrade] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!grade || Number.parseFloat(grade) < 1 || Number.parseFloat(grade) > 6) {
      alert('Bitte geben Sie eine Note zwischen 1 und 6 ein')
      return
    }

    setIsSubmitting(true)

    try {
      const db = await getDB()

      // Get recent participation entries for this subject (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const allEntries: ParticipationEntry[] = await new Promise((resolve, reject) => {
        const transaction = db.db!.transaction('entries', 'readonly')
        const store = transaction.objectStore('entries')
        const request = store.getAll()

        request.onsuccess = () => {
          const all = request.result || []
          const filtered = all.filter(
            (e: ParticipationEntry) =>
              e.subjectId === subject.id && new Date(e.date) >= thirtyDaysAgo && new Date(e.date) <= new Date(),
          )
          resolve(filtered)
        }
        request.onerror = () => reject(request.error)
      })

      // Calculate evaluation combination
      const evalCounts: Record<string, number> = {}
      allEntries.forEach((entry) => {
        evalCounts[entry.evaluationTypeId] = (evalCounts[entry.evaluationTypeId] || 0) + 1
      })

      await db.addGrade({
        subjectId: subject.id,
        grade: Number.parseFloat(grade),
        date: new Date().toISOString().split('T')[0],
        evaluationCombination: JSON.stringify(evalCounts),
        note: note || undefined,
      })

      setOpen(false)
      setGrade('')
      setNote('')
      onGradeAdded()
    }
    catch (error) {
      console.error('[calendar+] Failed to add grade:', error)
      alert('Fehler beim Speichern der Note')
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
            <Label htmlFor="grade">Note (0-15)</Label>
            <Input
              id="grade"
              type="number"
              min="0"
              max="15"
              step="0.1"
              value={grade}
              onChange={e => setGrade(e.target.value)}
              placeholder="z.B. 2.5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Notiz (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Zusätzliche Informationen..."
              rows={3}
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
