import type { EvaluationType } from '@/lib/db'
import { GripVertical, Paintbrush, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getDB } from '@/lib/db'

interface EvaluationManagerProps {
  evaluationTypes: EvaluationType[]
  onEvaluationTypesChange: () => void
}

const PRESET_COLORS = [
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#6b7280', // gray
  '#8b5cf6', // violet
  '#3b82f6', // blue
  '#ec4899', // pink
  '#14b8a6', // teal
]

export function EvaluationManager({ evaluationTypes, onEvaluationTypesChange }: EvaluationManagerProps) {
  const [newEvalName, setNewEvalName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])

  const handleAddEvaluation = async () => {
    if (!newEvalName.trim())
      return

    try {
      const db = await getDB()
      await db.addEvaluationType({
        name: newEvalName.trim(),
        color: selectedColor,
        order: evaluationTypes.length,
      })
      setNewEvalName('')
      // Keep selected color for workflow speed
      onEvaluationTypesChange()
    }
    catch (error) {
      console.error('[calendar+] Failed to add evaluation type:', error)
    }
  }

  const handleDeleteEvaluation = async (id: string) => {
    if (!confirm('Bewertungstyp wirklich löschen? Bereits erfasste Einträge bleiben erhalten.'))
      return

    try {
      const db = await getDB()
      await db.deleteEvaluationType(id)
      onEvaluationTypesChange()
    }
    catch (error) {
      console.error('[calendar+] Failed to delete evaluation type:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bewertungstypen verwalten</CardTitle>
        <CardDescription>Definiere Kategorien für die Bewertung mündlicher Beiträge</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Neuer Bewertungstyp..."
              value={newEvalName}
              onChange={e => setNewEvalName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddEvaluation()}
              className="flex-1"
            />
            <Button onClick={handleAddEvaluation} size="icon">
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
          {evaluationTypes.length === 0
            ? (
                <p className="text-center text-muted-foreground py-8">Noch keine Bewertungstypen vorhanden.</p>
              )
            : (
                evaluationTypes.map(evalType => (
                  <div
                    key={evalType.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm border border-black/10"
                      style={{ backgroundColor: evalType.color }}
                    />
                    <span className="flex-1 font-medium">{evalType.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEvaluation(evalType.id)}
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
