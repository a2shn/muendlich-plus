import type { Subject } from '@/sync'
import { AlertTriangle, Check, GripVertical, Paintbrush, Pencil, Plus, Target, Trash2 } from 'lucide-react'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { PRESET_COLORS, useSubjectManager } from '@/hooks/use-subject-manager'

interface SubjectManagerProps {
  subjects: Subject[]
  onSubjectsChange: () => void
}

export function SubjectManager({ subjects, onSubjectsChange }: SubjectManagerProps) {
  const {
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
  } = useSubjectManager(subjects, onSubjectsChange)

  return (
    <Card className="h-full border-muted/60 shadow-sm">
      <CardHeader>
        <CardTitle>Fächer verwalten</CardTitle>
        <CardDescription>Ziele und Farben definieren</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* ADD FORM */}
        <div className="space-y-4 p-4 rounded-xl bg-muted/50 border border-muted/60">
          <div className="flex gap-2">
            <Input placeholder="Neues Fach..." value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} className="bg-background flex-1" />
            <div className="relative w-24">
              <Input type="number" value={newSubjectGrade} onChange={e => setNewSubjectGrade(e.target.value)} className="bg-background" />
              <Target className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
            </div>
            <Button onClick={handleAddSubject} size="icon" type="button" className="shrink-0"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2 items-center">
            <Label className="text-xs text-muted-foreground">
              <Paintbrush className="h-3 w-3 inline mr-1" />
              Farbe
            </Label>
            <input type="color" value={newSubjectColor} onChange={e => setNewSubjectColor(e.target.value)} className="h-6 w-8 p-0 border-0 bg-transparent cursor-pointer" />
            {PRESET_COLORS.map(c => <button key={c} type="button" onClick={() => setNewSubjectColor(c)} className={`h-5 w-5 rounded-full ${newSubjectColor === c ? 'ring-2 ring-primary' : ''}`} style={{ backgroundColor: c }} />)}
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-2">
          {subjects.length === 0 && (
            <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl">
              <AlertTriangle className="mx-auto h-6 w-6 mb-2" />
              Keine Fächer
            </div>
          )}

          {subjects.map(subject => (
            <div key={subject.id} className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all">
              <GripVertical className="h-4 w-4 text-muted-foreground/30" />
              <div className="h-4 w-4 rounded-full shadow-sm ring-1 ring-black/5" style={{ backgroundColor: subject.color }} />
              <span className="flex-1 font-medium text-sm truncate">{subject.name}</span>
              {subject.targetGrade && (
                <div className="px-2 py-1 rounded-md bg-muted text-xs font-medium flex gap-1">
                  <Target className="h-3 w-3" />
                  {' '}
                  {subject.targetGrade}
                </div>
              )}

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" type="button" onClick={() => setEditingSubject(subject)}><Pencil className="h-3.5 w-3.5" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" type="button" className="hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Dies löscht alle zugehörigen Daten für "
                        {subject.name}
                        ".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteSubject(subject.id)} className="bg-destructive">Löschen</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* EDIT DIALOG */}
      <Dialog open={!!editingSubject} onOpenChange={open => !open && setEditingSubject(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Fach bearbeiten</DialogTitle></DialogHeader>
          {editingSubject && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={editingSubject.name} onChange={e => setEditingSubject({ ...editingSubject, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>
                  Ziel (
                  {isPointsSystem ? '0-15' : '1-6'}
                  )
                </Label>
                <Input type="number" value={editingSubject.targetGrade} onChange={e => setEditingSubject({ ...editingSubject, targetGrade: Number.parseFloat(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Farbe</Label>
                <div className="flex flex-wrap gap-2">{PRESET_COLORS.map(c => <button key={c} type="button" onClick={() => setEditingSubject({ ...editingSubject, color: c })} className={`h-8 w-8 rounded-full ${editingSubject.color === c ? 'ring-2 ring-primary' : ''}`} style={{ backgroundColor: c }} />)}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setEditingSubject(null)}>Abbrechen</Button>
            <Button type="button" onClick={handleUpdateSubject}>
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
