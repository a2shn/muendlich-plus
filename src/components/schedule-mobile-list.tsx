import type { Subject } from '@/sync'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

interface ScheduleMobileListProps {
  days: string[]
  shortDays: string[]
  periods: { label: string, period: number }[]
  subjects: Subject[]
  getSlot: (day: number, period: number) => any
  onAddSlot: (day: number, period: number, subjectId: string) => void
  onRemoveSlot: (day: number, period: number) => void
}

export function ScheduleMobileList({ shortDays, periods, subjects, getSlot, onAddSlot, onRemoveSlot }: ScheduleMobileListProps) {
  const [activeDay, setActiveDay] = useState(0)

  return (
    <div className="block sm:hidden space-y-4">
      {/* Day Selector */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg overflow-x-auto scrollbar-hide">
        {shortDays.map((day, idx) => (
          <button
            key={day}
            type="button"
            onClick={() => setActiveDay(idx)}
            className={`flex-1 min-w-[40px] py-2 text-sm font-medium rounded-md transition-all ${
              activeDay === idx
                ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5'
                : 'text-muted-foreground hover:bg-background/50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* List of Periods */}
      <div className="space-y-3">
        {periods.map((p) => {
          const slot = getSlot(activeDay, p.period)
          const subject = slot ? subjects.find(s => s.id === slot.subjectId) : null

          return (
            <div key={p.period} className="flex items-center gap-3">
              <div className="w-8 text-center font-bold text-sm text-muted-foreground">{p.label}</div>
              <div className="flex-1">
                {slot && subject
                  ? (
                      <div
                        className="flex items-center justify-between p-3 rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: subject.color }}
                      >
                        <span className="font-medium">{subject.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                          onClick={() => onRemoveSlot(activeDay, p.period)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  : (
                      <Select onValueChange={val => onAddSlot(activeDay, p.period, val)}>
                        <SelectTrigger className="w-full h-12 border-dashed border-muted-foreground/30 text-muted-foreground bg-muted/5 hover:bg-muted/20">
                          <div className="flex items-center gap-2 opacity-50">
                            <Plus className="h-4 w-4" />
                            <span className="text-xs">Freistunde</span>
                          </div>
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
