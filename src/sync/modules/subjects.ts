import type { SyncEngine } from '../engine'
import type { Subject } from '../types'

export class SubjectRepository {
  constructor(private engine: SyncEngine) {}

  async getAll(): Promise<Subject[]> {
    const data = await this.engine.fetch<Subject>('subjects', 'order')
    return data.sort((a, b) => a.order - b.order)
  }

  async add(subject: Omit<Subject, 'id' | 'createdAt'>): Promise<Subject> {
    return this.engine.insert('subjects', {
      ...subject,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    })
  }

  async update(id: string, updates: Partial<Subject>): Promise<void> {
    return this.engine.update('subjects', id, updates)
  }

  async delete(id: string): Promise<void> {
    return this.engine.delete('subjects', id)
  }
}
