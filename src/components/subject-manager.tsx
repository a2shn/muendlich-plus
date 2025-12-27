import type { Subject } from '@/lib/db'
import { GripVertical, Paintbrush, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getDB } from '@/lib/db'

interface SubjectManagerProps {
  subjects: Subject[]
  onSubjectsChange: () => void
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
]

export function SubjectManager({ subjects, onSubjectsChange }: SubjectManagerProps) {
  const [newSubjectName, setNewSubjectName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])

  const handleAddSubject = async () => {
    if (!newSubjectName.trim())
      return

    try {
      const db = await getDB()
      await db.addSubject({
        name: newSubjectName.trim(),
        color: selectedColor,
        order: subjects.length,
      })
      setNewSubjectName('')
      // Keep the selected color or reset it? Let's keep it for workflow speed
      onSubjectsChange()
    }
    catch (error) {
      console.error('[calendar+] Failed to add subject:', error)
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Fach wirklich löschen? Alle zugehörigen Einträge bleiben erhalten.'))
      return

    try {
      const db = await getDB()
      await db.deleteSubject(id)
      onSubjectsChange()
    }
    catch (error) {
      console.error('[calendar+] Failed to delete subject:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fächer verwalten</CardTitle>
        <CardDescription>Erstelle und verwalte deine Schulfächer für die tägliche Erfassung</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Neues Fach eingeben..."
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
              className="flex-1"
            />
            <Button onClick={handleAddSubject} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground ml-1">
              Farbe wählen
            </label>
            <div className="flex flex-wrap gap-3 items-center">
              {/* Custom Color Picker */}
              <div className="relative group">
                <div
                  className="w-10 h-10 rounded-md border shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110"
                  style={{ backgroundColor: selectedColor }}
                >
                  <Paintbrush className="h-4 w-4 text-white mix-blend-difference opacity-70" />
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={e => setSelectedColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Eigene Farbe wählen"
                  />
                </div>
              </div>

              <div className="w-px h-8 bg-border mx-1" />

              {/* Presets */}
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="w-8 h-8 rounded-md transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      border: selectedColor === color ? '2px solid currentColor' : '1px solid transparent',
                      outline: selectedColor === color ? '2px solid #000' : 'none',
                      outlineOffset: '1px',
                      opacity: selectedColor === color ? 1 : 0.7,
                    }}
                    aria-label={`Farbe ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {subjects.length === 0
            ? (
                <p className="text-center text-muted-foreground py-8">
                  Noch keine Fächer vorhanden. Erstelle dein erstes Fach oben.
                </p>
              )
            : (
                subjects.map(subject => (
                  <div
                    key={subject.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm border border-black/10"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="flex-1 font-medium">{subject.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
        </div>
      </CardContent>
    </Card>
  )
}
