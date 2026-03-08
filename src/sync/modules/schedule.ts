import type { SyncEngine } from '../engine'
import type { ScheduleSlot } from '../types'
import supabase from '@/lib/supabase'

export class ScheduleRepository {
  constructor(private engine: SyncEngine) {}

  async getAll(): Promise<ScheduleSlot[]> {
    return this.engine.fetch<ScheduleSlot>('scheduleSlots')
  }

  async add(slot: Omit<ScheduleSlot, 'id' | 'createdAt'>): Promise<ScheduleSlot> {
    return this.engine.insert('scheduleSlots', {
      ...slot,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    })
  }

  async delete(id: string): Promise<void> {
    return this.engine.delete('scheduleSlots', id)
  }

  async clear(): Promise<void> {
    this.engine.setLocal('scheduleSlots', [])
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      await supabase.from('schedule_slots').delete().neq('id', '0000')
    }
  }
}
