import { MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useGlobalAlert } from '@/components/global-alert-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BUNDESLAENDER, detectUserState } from '@/lib/holidays'
import { db } from '@/sync'

export function LocationSettings() {
  const [selectedState, setSelectedState] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { showAlert } = useGlobalAlert()

  useEffect(() => {
    db.then(db => db.getUserSettings()).then((settings) => {
      if (settings?.federalState)
        setSelectedState(settings.federalState)
    })
  }, [])

  const handleSave = async (stateCode: string) => {
    setSelectedState(stateCode)

    await db.saveUserSettings({
      federalState: stateCode,
      autoDetectLocation: false,
    })
    window.location.reload()
  }

  const handleAutoDetect = async () => {
    setLoading(true)
    const detected = await detectUserState()
    if (detected) {
      await handleSave(detected)
    }
    else {
      await showAlert('Fehler', 'Standort konnte nicht automatisch ermittelt werden.')
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Standort & Feiertage
        </CardTitle>
        <CardDescription>
          Wählen Sie Ihr Bundesland für die automatische Feiertagsanzeige.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Bundesland</Label>
          <div className="flex gap-2">
            <Select value={selectedState} onValueChange={handleSave}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Bundesland wählen" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BUNDESLAENDER).map(([name, code]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleAutoDetect} disabled={loading}>
              {loading ? '...' : 'Auto'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
