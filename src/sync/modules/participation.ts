import type { SyncEngine } from '../engine'
import type { EvaluationType, ParticipationEntry } from '../types'

export class ParticipationRepository {
  constructor(private engine: SyncEngine) {}

  // --- ENTRIES ---
  async getAllEntries(): Promise<ParticipationEntry[]> {
    return this.engine.fetch('entries')
  }

  async getEntriesForDate(date: string): Promise<ParticipationEntry[]> {
    const all = await this.getAllEntries()
    return all.filter(e => e.date === date)
  }

  // Diese Methode fehlte:
  async getEntriesForDateAndSubject(date: string, subjectId: string): Promise<ParticipationEntry[]> {
    const all = await this.getAllEntries()
    return all.filter(e => e.date === date && e.subjectId === subjectId)
  }

  async addEntry(entry: Omit<ParticipationEntry, 'id' | 'timestamp'>): Promise<ParticipationEntry> {
    return this.engine.insert('entries', {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    })
  }

  async updateEntry(id: string, updates: Partial<ParticipationEntry>): Promise<void> {
    return this.engine.update('entries', id, updates)
  }

  async deleteEntry(id: string): Promise<void> {
    return this.engine.delete('entries', id)
  }

  async getHistory(limit: number, offset: number): Promise<ParticipationEntry[]> {
    const all = await this.getAllEntries()
    return all.sort((a, b) => b.date.localeCompare(a.date)).slice(offset, offset + limit)
  }

  // --- EVAL TYPES ---
  async getEvaluationTypes(): Promise<EvaluationType[]> {
    const types = await this.engine.fetch<EvaluationType>('evaluationTypes')
    return types.sort((a, b) => a.order - b.order)
  }

  // Diese Methoden fehlten für evaluationTypes:
  async addEvaluationType(evalType: Omit<EvaluationType, 'id'>): Promise<EvaluationType> {
    return this.engine.insert('evaluationTypes', { ...evalType, id: crypto.randomUUID() })
  }

  async updateEvaluationType(id: string, updates: Partial<EvaluationType>): Promise<void> {
    return this.engine.update('evaluationTypes', id, updates)
  }

  async deleteEvaluationType(id: string): Promise<void> {
    return this.engine.delete('evaluationTypes', id)
  }
}
