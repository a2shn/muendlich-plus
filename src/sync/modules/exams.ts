import type { SyncEngine } from '../engine'
import type { Exam } from '../types'

export class ExamRepository {
  constructor(private engine: SyncEngine) {}

  async getAll(): Promise<Exam[]> {
    return this.engine.fetch<Exam>('exams')
  }

  async add(exam: Omit<Exam, 'id' | 'createdAt'>): Promise<Exam> {
    return this.engine.insert('exams', {
      ...exam,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    })
  }

  async update(id: string, updates: Partial<Exam>): Promise<void> {
    return this.engine.update('exams', id, updates)
  }

  async delete(id: string): Promise<void> {
    return this.engine.delete('exams', id)
  }
}
