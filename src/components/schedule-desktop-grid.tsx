import type { Subject } from '@/sync'
import { Plus, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

interface ScheduleDesktopGridProps {
  days: string[]
  periods: { label: string, period: number }[]
  weekType: 'A' | 'B' | null
  subjects: Subject[]
  getSlot: (day: number, period: number) => any
  onAddSlot: (day: number, period: number, subjectId: string) => void
  onRemoveSlot: (day: number, period: number) => void
}

export function ScheduleDesktopGrid({ days, periods, subjects, getSlot, onAddSlot, onRemoveSlot }: ScheduleDesktopGridProps) {
  return (
    <div className="hidden sm:block">
      <ScrollArea className="w-full border rounded-md bg-card">
        <div className="min-w-[700px] p-4">
          <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-2">
            {/* Header */}
            <div className="font-semibold text-xs p-2 text-muted-foreground self-center">Stunde</div>
            {days.map(day => (
              <div key={day} className="font-semibold text-sm p-2 text-center bg-muted/30 rounded-lg">
                {day}
              </div>
            ))}

            {/* Grid Content */}
            {periods.map(p => (
              <div key={p.label} className="contents">
                <div className="flex items-center justify-center font-bold text-sm bg-muted/30 rounded-lg text-muted-foreground">
                  {p.label}
                </div>
                {days.map((day, dayIndex) => {
                  const slot = getSlot(dayIndex, p.period)
                  const subject = slot ? subjects.find(s => s.id === slot.subjectId) : null

                  return (
                    <div key={`${day}-${p.period}`} className="relative h-[64px] group">
                      {slot && subject
                        ? (
                            <div
                              className="h-full p-2 rounded-lg text-sm font-medium text-white flex flex-col justify-center shadow-sm hover:brightness-110 transition-all relative overflow-hidden"
                              style={{ backgroundColor: subject.color }}
                            >
                              <span className="truncate relative z-10">{subject.name}</span>
                              <button
                                type="button"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-white/90 hover:text-white bg-black/10 rounded p-0.5"
                                onClick={() => onRemoveSlot(dayIndex, p.period)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )
                        : (
                            <Select onValueChange={val => onAddSlot(dayIndex, p.period, val)}>
                              <SelectTrigger className="h-full w-full border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 bg-transparent hover:bg-muted/10 text-transparent hover:text-muted-foreground transition-all">
                                <Plus className="h-5 w-5 mx-auto opacity-50" />
                              </SelectTrigger>
                              <SelectContent>
                                {subjects.map(sub => (
                                  <SelectItem key={sub.id} value={sub.id}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />
                                      {sub.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
