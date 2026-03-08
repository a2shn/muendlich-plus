import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useGlobalAlert } from '@/components/global-alert-provider'
import supabase from '@/lib/supabase'
import { db } from '@/sync'

export function useAccountSettings() {
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [gradingSystem, setGradingSystem] = useState<'points' | 'grades'>('points')
  const [isSyncing, setIsSyncing] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { showConfirm } = useGlobalAlert()

  useEffect(() => {
    db.getUserSettings().then((s) => {
      setSyncEnabled(s?.syncEnabled !== false)
      setGradingSystem(s?.gradingSystem || 'points')
    })
  }, [])

  const handleResync = async () => {
    setIsSyncing(true)
    try {
      await db.sync(true)
      toast.success('Synchronisiert')
    }
    catch { toast.error('Fehler bei Sync') }
    finally { setIsSyncing(false) }
  }

  const handleSyncToggle = async (checked: boolean) => {
    await db.saveUserSettings({ syncEnabled: checked })
    setSyncEnabled(checked)
    if (checked)
      handleResync()
  }

  const handleGradingSystemChange = async (value: 'points' | 'grades') => {
    await db.saveUserSettings({ gradingSystem: value })
    setGradingSystem(value)
    toast.success(`System geändert zu: ${value}`)
    setTimeout(() => window.location.reload(), 500)
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6)
      return toast.error('Min. 6 Zeichen')
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error)
        throw error
      toast.success('Passwort geändert')
      setNewPassword('')
    }
    catch (e: any) { toast.error(e.message) }
    finally { setIsLoading(false) }
  }

  const handleDeleteAllData = async () => {
    if (!await showConfirm('Alles löschen?', 'ACHTUNG: Löscht Account und Daten unwiderruflich!'))
      return
    setIsLoading(true)
    try {
      await db.clearRemoteDatabase()
      await db.resetDatabase()
      await supabase.auth.signOut()
      toast.success('Gelöscht')
    }
    catch { toast.error('Fehler') }
    finally { setIsLoading(false) }
  }

  return {
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
  }
}
