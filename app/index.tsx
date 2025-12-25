import ParticipationTracker from "@/components/participation-tracker"
import { createFileRoute } from "@tanstack/react-router"

 export const Route = createFileRoute('/')({ 
   component: Home,
 }) 

function Home() {
  return (
    <main className="min-h-screen bg-background">
      <ParticipationTracker />
    </main>
  )
}
