import type { EvaluationType, Subject } from '@/sync'
import { ArrowRight, Calculator, Calendar, Check, GraduationCap, Info, Loader2, Plus, Trophy, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Tabs } from '@/components/ui/tabs'
import { formatDate } from '@/lib/date-utils'
import { db } from '@/sync'

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')

  // --- DATA STATE ---
  const [gradingSystem, setGradingSystem] = useState<'points' | 'grades'>('grades')
  const [weekSystemEnabled, setWeekSystemEnabled] = useState(false)

  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newTargetGrade, setNewTargetGrade] = useState('')

  // Eval Types
  const [evalTypes, setEvalTypes] = useState<EvaluationType[]>([])
  const [newEvalName, setNewEvalName] = useState('')

  const loadDefaults = async () => {
    // Ensure we have at least the default eval types in memory if DB is empty
    await db.initializeDefaults()
    const [s, e, settings] = await Promise.all([
      db.getSubjects(),
      db.getEvaluationTypes(),
      db.getUserSettings(),
    ])
    setSubjects(s)
    setEvalTypes(e)
    if (settings?.gradingSystem)
      setGradingSystem(settings.gradingSystem)
  }

  useEffect(() => {
    loadDefaults()
  }, [])

  // --- ACTIONS ---

  const handleAddLocalSubject = () => {
    if (!newSubjectName.trim())
      return
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

    // We create a temporary object (mock ID) to show in the list
    // We will save these to DB only at the end
    const newSub: Subject = {
      id: `temp-${Date.now()}`,
      name: newSubjectName,
      color: colors[subjects.length % colors.length],
      order: subjects.length,
      targetGrade: newTargetGrade ? Number.parseFloat(newTargetGrade) : undefined,
      createdAt: Date.now(),
    }

    setSubjects([...subjects, newSub])
    setNewSubjectName('')
    setNewTargetGrade('')
  }

  const handleRemoveLocalSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id))
  }

  const handleAddEvalType = async () => {
    if (!newEvalName.trim())
      return
    // Persist immediately for eval types as they are global config usually
    await db.addEvaluationType({
      name: newEvalName,
      color: '#6b7280',
      order: evalTypes.length,
    })
    setNewEvalName('')
    const updated = await db.getEvaluationTypes()
    setEvalTypes(updated)
  }

  // --- FINALIZATION LOGIC ---

  const handleFinish = async () => {
    setIsProcessing(true)
    setProcessingStatus('Speichere Einstellungen...')

    try {
      // 1. Save Settings
      await db.saveUserSettings({
        gradingSystem,
        onboardingCompleted: true,
      })

      // 2. Save Week System
      if (weekSystemEnabled) {
        await db.saveWeekSystemSettings({
          enabled: true,
          referenceDate: formatDate(new Date()), // Default to today as ref
        })
      }
      else {
        await db.saveWeekSystemSettings({ enabled: false, referenceDate: '' })
      }

      // 3. Save Manually Added Subjects
      // We filter out existing DB subjects (real UUIDs) vs temp ones
      setProcessingStatus('Speichere Fächer...')
      const existingSubjects = await db.getSubjects() // fetch fresh
      const finalSubjectsMap = new Map<string, Subject>() // Name -> Subject

      // Index existing
      existingSubjects.forEach(s => finalSubjectsMap.set(s.name.toLowerCase().trim(), s))

      for (const sub of subjects) {
        if (sub.id.startsWith('temp-')) {
          // Check if already exists by name
          if (!finalSubjectsMap.has(sub.name.toLowerCase().trim())) {
            const saved = await db.addSubject({
              name: sub.name,
              color: sub.color,
              order: sub.order,
              targetGrade: sub.targetGrade,
            })
            finalSubjectsMap.set(saved.name.toLowerCase().trim(), saved)
          }
        }
      }

      // 4. Finalize
      localStorage.setItem('onboarding_completed', 'true')
      onComplete()
      toast.success('Einrichtung abgeschlossen!')
    }
    catch (e) {
      console.error(e)
      toast.error('Ein unerwarteter Fehler ist aufgetreten.')
    }
    finally {
      setIsProcessing(false)
    }
  }

  // --- STEPS UI ---

  const renderStep1 = () => (
    <Card className="border-2 shadow-xl animate-in fade-in slide-in-from-bottom-4">
      <CardHeader>
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
          <Calculator size={24} />
        </div>
        <CardTitle>Wie wirst du benotet?</CardTitle>
        <CardDescription>Wähle dein Notensystem aus.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${gradingSystem === 'grades' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
          onClick={() => setGradingSystem('grades')}
        >
          <div className="text-4xl font-bold text-primary">1 - 6</div>
          <div className="font-medium">Klassisch</div>
        </div>
        <div
          className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${gradingSystem === 'points' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
          onClick={() => setGradingSystem('points')}
        >
          <div className="text-4xl font-bold text-primary">15 - 0</div>
          <div className="font-medium">Punkte (MSS)</div>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={() => setStep(2)}>
          Weiter
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )

  const renderStep2 = () => (
    <Card className="border-2 shadow-xl animate-in fade-in slide-in-from-bottom-4">
      <CardHeader>
        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-500">
          <Calendar size={24} />
        </div>
        <CardTitle>Fächer & Stundenplan</CardTitle>
        <CardDescription>Erstelle Fächer manuell oder lade deinen Stundenplan hoch.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* A/B TOGGLE */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
          <div className="space-y-0.5">
            <Label className="text-base">A/B Wochen?</Label>
            <p className="text-xs text-muted-foreground">Hat deine Schule wechselnde Wochen?</p>
          </div>
          <Switch checked={weekSystemEnabled} onCheckedChange={setWeekSystemEnabled} />
        </div>

        <Tabs defaultValue="manual" className="w-full">
          {/* MANUAL TAB */}
          <div className="space-y-4 mt-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label>Fach</Label>
                <Input placeholder="Mathe" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLocalSubject()} />
              </div>
              <div className="w-20 space-y-2">
                <Label>Ziel</Label>
                <Input placeholder={gradingSystem === 'points' ? '13' : '2.0'} value={newTargetGrade} onChange={e => setNewTargetGrade(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLocalSubject()} />
              </div>
              <Button onClick={handleAddLocalSubject} size="icon"><Plus size={18} /></Button>
            </div>

            <ScrollArea className="h-[150px] border rounded-md p-2 bg-muted/20">
              {subjects.length === 0
                ? (
                    <p className="text-center text-xs text-muted-foreground py-8">Keine Fächer. Füge welche hinzu.</p>
                  )
                : (
                    <div className="flex flex-wrap gap-2">
                      {subjects.map(s => (
                        <Badge key={s.id} variant="secondary" className="pl-2 pr-1 py-1 flex gap-1 items-center">
                          {s.name}
                          <button type="button" onClick={() => handleRemoveLocalSubject(s.id)} className="hover:bg-destructive hover:text-white rounded-full p-0.5 ml-1"><X size={12} /></button>
                        </Badge>
                      ))}
                    </div>
                  )}
            </ScrollArea>
          </div>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep(1)}>Zurück</Button>
        <Button onClick={() => setStep(3)}>
          Weiter
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )

  const renderStep3 = () => (
    <Card className="border-2 shadow-xl animate-in fade-in slide-in-from-bottom-4">
      <CardHeader>
        <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 text-orange-500">
          <GraduationCap size={24} />
        </div>
        <CardTitle>Bewertung</CardTitle>
        <CardDescription>Optionale Kategorien (Meldung, Test, etc.)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {evalTypes.map(et => (
            <div key={et.id} className="flex items-center gap-2 p-2 rounded border text-xs font-medium">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: et.color }} />
              {et.name}
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Input placeholder="Neue Kategorie..." value={newEvalName} onChange={e => setNewEvalName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddEvalType()} />
          <Button variant="secondary" onClick={handleAddEvalType}>Add</Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep(2)}>Zurück</Button>
        <Button onClick={() => setStep(4)}>
          Weiter
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )

  const renderStep4 = () => (
    <Card className="border-2 shadow-xl animate-in fade-in slide-in-from-bottom-4">
      <CardHeader>
        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4 text-green-500">
          <Trophy size={24} />
        </div>
        <CardTitle>Fertig!</CardTitle>
        <CardDescription>Bereit zum Starten?</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="bg-muted/50 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>Hinweis</AlertTitle>
          <AlertDescription className="text-xs">
            Wenn du "Starten" klickst, wird deine Konfiguration gespeichert.
            Danach kannst du im Kalender alles bearbeiten.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep(3)} disabled={isProcessing}>Zurück</Button>
        <Button onClick={handleFinish} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]">
          {isProcessing
            ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {processingStatus || 'Lade...'}
                </>
              )
            : (
                <>
                  App starten
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
        </Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg my-auto">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-primary' : 'w-2 bg-muted'}`} />
          ))}
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>
    </div>
  )
}
