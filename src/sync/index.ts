import type { EvaluationType, Exam, Grade, ParticipationEntry, ScheduleSlot, Subject, Task, UserSettings, WeekSystemSettings } from './types'
import supabase from '@/lib/supabase'
import { TABLES } from './config'
import { SyncEngine } from './engine'
import { ExamRepository } from './modules/exams'
import { GradeRepository } from './modules/grades'
import { ParticipationRepository } from './modules/participation'
import { ScheduleRepository } from './modules/schedule'
import { SettingsRepository } from './modules/settings'
import { SubjectRepository } from './modules/subjects'
import { TaskRepository } from './modules/tasks'

// Singleton Instance
let engineInstance: SyncEngine | null = null

export class DatabaseAPI {
  public subjects: SubjectRepository
  public participation: ParticipationRepository
  public grades: GradeRepository
  public settings: SettingsRepository
  public tasks: TaskRepository
  public exams: ExamRepository
  public schedule: ScheduleRepository
  public engine: SyncEngine

  constructor() {
    if (!engineInstance)
      engineInstance = new SyncEngine()
    this.engine = engineInstance

    this.subjects = new SubjectRepository(engineInstance)
    this.participation = new ParticipationRepository(engineInstance)
    this.grades = new GradeRepository(engineInstance)
    this.settings = new SettingsRepository(engineInstance)
    this.tasks = new TaskRepository(engineInstance)
    this.exams = new ExamRepository(engineInstance)
    this.schedule = new ScheduleRepository(engineInstance)
  }

  // --- CORE METHODS ---

  async sync(force = false) {
    return this.engine.triggerSync(force)
  }

  async resetDatabase() {
    // 1. Clear LocalStorage
    TABLES.forEach(t => localStorage.removeItem(`oral_participation_${t}`))
    localStorage.removeItem('onboarding_completed')

    // 2. Clear IndexedDB (best effort)
    try {
      if (typeof window !== 'undefined' && window.indexedDB) {
        const dbs = await window.indexedDB.databases()
        dbs.forEach((db) => {
          if (db.name && db.name.includes('oral_participation')) {
            window.indexedDB.deleteDatabase(db.name)
          }
        })
      }
    }
    catch (e) {
      console.warn('Could not clear IndexedDB:', e)
    }
  }

  async clearRemoteDatabase() {
    if (!navigator.onLine) {
      throw new Error('Du musst online sein, um die Cloud-Daten zu löschen.')
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user)
        return

      // CORRECT ORDER: Delete children (Dependents) first, then Parents!
      const tables = [
        'grades',
        'tasks',
        'exams',
        'schedule_slots',
        'participation_entries', // Depends on Evaluation Types & Subjects
        'subjects', // Parent
        'evaluation_types', // Parent
        'week_system_settings',
        'user_settings',
      ]

      for (const table of tables) {
        // Delete all rows belonging to this user
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) {
          console.error(`Failed to clear table ${table}:`, error)
          // We continue trying to delete other tables even if one fails
        }
      }
    }
    catch (e) {
      console.error('Error clearing remote db:', e)
      throw e
    }
  }

  // --- COMPATIBILITY LAYER (Legacy Mapping) ---
  getSubjects = () => this.subjects.getAll()
  addSubject = (s: Omit<Subject, 'id' | 'createdAt'>) => this.subjects.add(s)
  updateSubject = (id: string, s: Partial<Subject>) => this.subjects.update(id, s)
  deleteSubject = (id: string) => this.subjects.delete(id)

  getEvaluationTypes = () => this.participation.getEvaluationTypes()
  addEvaluationType = (e: Omit<EvaluationType, 'id'>) => this.participation.addEvaluationType(e)
  updateEvaluationType = (id: string, e: Partial<EvaluationType>) => this.participation.updateEvaluationType(id, e)
  deleteEvaluationType = (id: string) => this.participation.deleteEvaluationType(id)

  getHistory = (limit: number, offset: number) => this.participation.getHistory(limit, offset)
  getEntriesForDate = (date: string) => this.participation.getEntriesForDate(date)
  getEntriesForDateAndSubject = (date: string, subjectId: string) => this.participation.getEntriesForDateAndSubject(date, subjectId)
  getAllEntries = () => this.participation.getAllEntries()
  addEntry = (e: Omit<ParticipationEntry, 'id' | 'timestamp'>) => this.participation.addEntry(e)
  updateEntry = (id: string, e: Partial<ParticipationEntry>) => this.participation.updateEntry(id, e)
  deleteEntry = (id: string) => this.participation.deleteEntry(id)

  getGrades = () => this.grades.getAll()
  getGradesBySubject = (sid: string) => this.grades.getBySubject(sid)
  addGrade = (g: Omit<Grade, 'id' | 'timestamp'>) => this.grades.add(g)
  deleteGrade = (id: string) => this.grades.delete(id)

  getTasks = () => this.tasks.getAll()
  addTask = (t: Omit<Task, 'id' | 'createdAt'>) => this.tasks.add(t)
  updateTask = (id: string, t: Partial<Task>) => this.tasks.update(id, t)
  deleteTask = (id: string) => this.tasks.delete(id)

  getExams = () => this.exams.getAll()
  addExam = (e: Omit<Exam, 'id' | 'createdAt'>) => this.exams.add(e)
  updateExam = (id: string, e: Partial<Exam>) => this.exams.update(id, e)
  deleteExam = (id: string) => this.exams.delete(id)

  getScheduleSlots = () => this.schedule.getAll()
  addScheduleSlot = (s: Omit<ScheduleSlot, 'id' | 'createdAt'>) => this.schedule.add(s)
  deleteScheduleSlot = (id: string) => this.schedule.delete(id)
  clearScheduleSlots = () => this.schedule.clear()

  getUserSettings = () => this.settings.getUserSettings()
  saveUserSettings = (s: Partial<UserSettings>) => this.settings.saveUserSettings(s)
  getWeekSystemSettings = () => this.settings.getWeekSystemSettings()
  saveWeekSystemSettings = (s: Omit<WeekSystemSettings, 'id'>) => this.settings.saveWeekSystemSettings(s)

  initializeDefaults = async () => {
    const types = await this.getEvaluationTypes()
    if (types.length === 0) {
      await this.addEvaluationType({ name: 'Richtig', color: '#10b981', order: 0 })
      await this.addEvaluationType({ name: 'Teilweise richtig', color: '#f59e0b', order: 1 })
      await this.addEvaluationType({ name: 'Falsch', color: '#ef4444', order: 2 })
      await this.addEvaluationType({ name: 'Nicht relevant', color: '#6b7280', order: 3 })
      await this.addEvaluationType({ name: 'Gemeldet', color: '#8b5cf6', order: 4 })
    }
  }
}

export const db = new DatabaseAPI()
export async function getDB() {
  return db
}
export * from './types'
