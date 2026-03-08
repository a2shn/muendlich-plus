import type { SyncEngine } from '../engine'
import type { Task } from '../types'

export class TaskRepository {
  constructor(private engine: SyncEngine) {}

  async getAll(): Promise<Task[]> {
    return this.engine.fetch<Task>('tasks')
  }

  async add(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    return this.engine.insert('tasks', {
      ...task,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    })
  }

  async update(id: string, updates: Partial<Task>): Promise<void> {
    return this.engine.update('tasks', id, updates)
  }

  async delete(id: string): Promise<void> {
    return this.engine.delete('tasks', id)
  }
}
