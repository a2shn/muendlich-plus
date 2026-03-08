import type { SyncEngine } from '../engine'
import type { Grade } from '../types'

export class GradeRepository {
  constructor(private engine: SyncEngine) {}

  async getAll(): Promise<Grade[]> {
    return this.engine.fetch('grades')
  }

  async getBySubject(subjectId: string): Promise<Grade[]> {
    const grades = await this.getAll()
    return grades.filter(g => g.subjectId === subjectId)
  }

  async add(grade: Omit<Grade, 'id' | 'timestamp'>): Promise<Grade> {
    return this.engine.insert('grades', {
      ...grade,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    })
  }

  async delete(id: string): Promise<void> {
    return this.engine.delete('grades', id)
  }
}
