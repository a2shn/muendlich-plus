import { BarChart2, Calendar, CheckSquare, GraduationCap, LayoutDashboard, ListTodo, Menu, Settings2 } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TrackerNavigationProps {
  onTabChange: (tab: string) => void
  isDrawerOpen: boolean
  setIsDrawerOpen: (open: boolean) => void
}

const NAV_ITEMS = [
  { value: 'today', label: 'Heute', icon: LayoutDashboard },
  { value: 'calendar', label: 'Agenda', icon: CheckSquare },
  { value: 'statistics', label: 'Stats', icon: BarChart2 },
  { value: 'history', label: 'Verlauf', icon: ListTodo },
  { value: 'schedule', label: 'Plan', icon: Calendar },
  { value: 'subjects', label: 'Fächer', icon: GraduationCap },
  { value: 'settings', label: 'Optionen', icon: Settings2 },
]

export function TrackerNavigation({ onTabChange, isDrawerOpen, setIsDrawerOpen }: TrackerNavigationProps) {
  return (
    <>
      {/* Mobile: Bottom Navigation Button */}
      <div className="fixed bottom-0 left-0 right-0 p-3 sm:hidden z-40 bg-gradient-to-t from-background via-background/80 to-transparent">
        <Button
          onClick={() => setIsDrawerOpen(true)}
          size="lg"
          className="w-full h-12 rounded-xl shadow-lg border bg-primary text-primary-foreground flex items-center justify-center gap-2"
        >
          <Menu className="h-5 w-5" />
          <span className="font-semibold">Menü öffnen</span>
        </Button>
      </div>

      {/* Mobile: Drawer Navigation */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Navigation</DrawerTitle>
            <DrawerDescription>Wähle einen Bereich aus</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pt-0">
            <TabsList className="flex flex-col items-stretch w-full h-auto bg-transparent gap-2 p-0">
              {NAV_ITEMS.map(item => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  onClick={() => {
                    onTabChange(item.value)
                    setIsDrawerOpen(false)
                  }}
                  className="w-full justify-start gap-4 px-4 py-3 h-auto text-base font-medium data-[state=active]:bg-secondary"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Desktop: Tab Bar */}
      <div className="hidden sm:block">
        <TabsList className="w-full h-12 grid grid-cols-7 gap-1 bg-muted rounded-lg p-1">
          {NAV_ITEMS.map(item => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="flex-row gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </>
  )
}
