import type { EvaluationType } from '@/sync'
import { AlertTriangle, Check, GripVertical, Paintbrush, Pencil, Plus, Trash2 } from 'lucide-react'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { PRESET_COLORS, useEvaluationManager } from '@/hooks/use-evaluation-manager'

interface EvaluationManagerProps {
  evaluationTypes: EvaluationType[]
  onEvaluationTypesChange: () => void
}

export function EvaluationManager({ evaluationTypes, onEvaluationTypesChange }: EvaluationManagerProps) {
  const {
    newName,
    setNewName,
    newColor,
    setNewColor,
    editingType,
    setEditingType,
    handleAdd,
    handleUpdate,
    handleDelete,
  } = useEvaluationManager(evaluationTypes, onEvaluationTypesChange)

  return (
    <Card className="h-full border-muted/60 shadow-sm">
      <CardHeader>
        <CardTitle>Bewertungstypen</CardTitle>
        <CardDescription>Kategorien definieren (z.B. "Richtig", "Falsch")</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* ADD */}
        <div className="space-y-4 p-4 rounded-xl bg-muted/50 border border-muted/60">
          <div className="flex gap-2">
            <Input placeholder="Neuer Typ..." value={newName} onChange={e => setNewName(e.target.value)} className="bg-background flex-1" />
            <Button onClick={handleAdd} size="icon" className="shrink-0"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2 items-center">
            <Label className="text-xs text-muted-foreground">
              <Paintbrush className="h-3 w-3 inline mr-1" />
              Farbe
            </Label>
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-6 w-8 p-0 border-0 bg-transparent cursor-pointer" />
            {PRESET_COLORS.map(c => <button key={c} type="button" onClick={() => setNewColor(c)} className={`h-5 w-5 rounded-full ${newColor === c ? 'ring-2 ring-primary' : ''}`} style={{ backgroundColor: c }} />)}
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-2">
          {evaluationTypes.length === 0 && (
            <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl">
              <AlertTriangle className="mx-auto h-6 w-6 mb-2" />
              Keine Typen
            </div>
          )}

          {evaluationTypes.map(type => (
            <div key={type.id} className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all">
              <GripVertical className="h-4 w-4 text-muted-foreground/30" />
              <div className="h-4 w-4 rounded-full shadow-sm ring-1 ring-black/5" style={{ backgroundColor: type.color }} />
              <span className="flex-1 font-medium text-sm truncate">{type.name}</span>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" type="button" onClick={() => setEditingType(type)}><Pencil className="h-3.5 w-3.5" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" type="button" className="hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Löschen?</AlertDialogTitle>
                      <AlertDialogDescription>Dies kann Statistiken beeinflussen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(type.id)} className="bg-destructive">Löschen</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* EDIT */}
      <Dialog open={!!editingType} onOpenChange={open => !open && setEditingType(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Typ bearbeiten</DialogTitle></DialogHeader>
          {editingType && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={editingType.name} onChange={e => setEditingType({ ...editingType, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Farbe</Label>
                <div className="flex flex-wrap gap-2">{PRESET_COLORS.map(c => <button key={c} type="button" onClick={() => setEditingType({ ...editingType, color: c })} className={`h-8 w-8 rounded-full ${editingType.color === c ? 'ring-2 ring-primary' : ''}`} style={{ backgroundColor: c }} />)}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setEditingType(null)}>Abbrechen</Button>
            <Button type="button" onClick={handleUpdate}>
              <Check className="mr-2 h-4 w-4" />
              {' '}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
