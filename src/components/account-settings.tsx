import { Cloud, GraduationCap, Key, Loader2, RefreshCw, Trash2, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAccountSettings } from '@/hooks/use-account-settings'

export function AccountSettings() {
  const {
    syncEnabled,
    gradingSystem,
    isSyncing,
    newPassword,
    setNewPassword,
    isLoading,
    handleResync,
    handleSyncToggle,
    handleGradingSystemChange,
    handleChangePassword,
    handleDeleteAllData,
  } = useAccountSettings()

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <UserCog className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Account & Optionen</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">

        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <Cloud className="h-5 w-5" />
              {' '}
              Synchronisation
            </CardTitle>
            <CardDescription>Datenaustausch mit Cloud</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center border p-4 rounded-lg">
              <div className="space-y-0.5">
                <Label>Cloud-Sync</Label>
                <p className="text-xs text-muted-foreground">Auto-Backup</p>
              </div>
              <Switch checked={syncEnabled} onCheckedChange={handleSyncToggle} />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleResync} disabled={isSyncing || !syncEnabled}>
              {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {' '}
              Jetzt synchronisieren
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <GraduationCap className="h-5 w-5" />
              {' '}
              Notensystem
            </CardTitle>
            <CardDescription>System wählen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>System</Label>
              <Select value={gradingSystem} onValueChange={handleGradingSystemChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Punkte (0-15)</SelectItem>
                  <SelectItem value="grades">Noten (1-6)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <Key className="h-5 w-5" />
              {' '}
              Passwort ändern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Neues Passwort</Label>
              <Input type="password" placeholder="Neues Passwort - min 6 Zeichen" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleChangePassword} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {' '}
              Aktualisieren
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              {' '}
              Danger Zone
            </CardTitle>
            <CardDescription>Nicht widerrufbar.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="destructive" className="w-full" onClick={handleDeleteAllData} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {' '}
              Alles löschen
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
