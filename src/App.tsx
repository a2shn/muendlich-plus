import ParticipationTracker from '@/components/participation-tracker'
import { ThemeProvider } from '@/components/theme-provider'

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="participation-theme"
    >

      <main className="min-h-screen bg-background">
        <ParticipationTracker />
      </main>
    </ThemeProvider>
  )
}
