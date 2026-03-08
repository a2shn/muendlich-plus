import type { Session } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast, Toaster } from 'sonner'
import { AuthScreen } from '@/components/auth-screen'
import { GlobalAlertProvider } from '@/components/global-alert-provider'
import { OnboardingWizard } from '@/components/onboarding-wizard'
import ParticipationTracker from '@/components/participation-tracker'
import { ThemeProvider } from '@/components/theme-provider'
import supabase from '@/lib/supabase'
import { db } from '@/sync'

// Shared Loading Component
export function LoadingScreen({ text = 'Lade App...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground font-medium animate-pulse">{text}</p>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // -- STATUS NOTIFICATIONS --
  useEffect(() => {
    const onSyncStart = () => toast.loading('Synchronisiere...', { id: 'sync-status' })
    const onSyncEnd = () => toast.success('Synchronisiert', { id: 'sync-status', duration: 2000 })
    const onSyncError = () => toast.error('Fehler beim Synchronisieren', { id: 'sync-status' })

    const onOffline = () => toast.warning('Du bist offline. Änderungen werden lokal gespeichert.', {
      id: 'net-status',
      duration: Infinity,
    })
    const onOnline = () => {
      toast.dismiss('net-status')
      toast.success('Wieder online!')
    }

    window.addEventListener('participation-sync-start', onSyncStart)
    window.addEventListener('participation-sync-end', onSyncEnd)
    window.addEventListener('participation-sync-error', onSyncError)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)

    if (!navigator.onLine) {
      onOffline()
    }

    return () => {
      window.removeEventListener('participation-sync-start', onSyncStart)
      window.removeEventListener('participation-sync-end', onSyncEnd)
      window.removeEventListener('participation-sync-error', onSyncError)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  // -- CHECK LOCK & ONBOARDING STATUS --
  const checkStatus = async (currentSession: Session | null) => {
    if (!currentSession) {
      setLoading(false)
      return
    }

    try {
      // 1. Get User Settings
      const settings = await db.getUserSettings()

      // 2. Onboarding Check
      const subjects = await db.getSubjects()

      // Strict Check
      if (settings?.onboardingCompleted === false) {
        setShowOnboarding(true)
        setLoading(false)
        return
      }

      // Fallback
      if (settings?.onboardingCompleted === true) {
        setShowOnboarding(false)
        setLoading(false)
        return
      }

      // Legacy/Offline Fallback
      const isCompleteLocal = localStorage.getItem('onboarding_completed') === 'true'
      const hasSubjects = subjects.length > 0

      if (!isCompleteLocal && !hasSubjects) {
        setShowOnboarding(true)
      }
      else {
        setShowOnboarding(false)
      }
    }
    catch (e) {
      console.error('Failed to load app status', e)
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      checkStatus(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        await db.resetDatabase()
        setSession(null)
        localStorage.removeItem('onboarding_completed')
      }
      else if (session) {
        setSession(session)
        checkStatus(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    window.dispatchEvent(new Event('participation-data-changed'))
  }

  // FIX: Show LoadingScreen instead of null (Black Screen)
  if (loading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="participation-theme">
        <LoadingScreen />
      </ThemeProvider>
    )
  }

  if (!session) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="participation-theme">
        <AuthScreen />
        <Toaster />
      </ThemeProvider>
    )
  }

  return (
    <GlobalAlertProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="participation-theme">
        <GlobalAlertProvider>
          <main className="min-h-screen bg-background">
            {showOnboarding
              ? (
                  <OnboardingWizard onComplete={handleOnboardingComplete} />
                )
              : (
                  <ParticipationTracker />
                )}
          </main>
          <Toaster closeButton position="bottom-right" />
        </GlobalAlertProvider>
      </ThemeProvider>
    </GlobalAlertProvider>
  )
}
