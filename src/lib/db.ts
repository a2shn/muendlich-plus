// IndexedDB wrapper for oral participation tracking
interface Subject {
  id: string
  name: string
  color: string
  order: number
  createdAt: number
}

interface ScheduleSlot {
  id: string
  subjectId: string
  dayOfWeek: number // 0=Monday, 1=Tuesday, ..., 4=Friday
  period: number // 1-10
  weekType?: 'A' | 'B' | null // null = both weeks, 'A' = only A week, 'B' = only B week
  createdAt: number
}

interface WeekSystemSettings {
  id: string
  enabled: boolean
  referenceDate: string // YYYY-MM-DD - A reference date that is known to be an A-week
}

interface Grade {
  id: string
  subjectId: string
  grade: number // 0-15 scale
  date: string // YYYY-MM-DD
  evaluationCombination: string // JSON string of evaluation type counts
  note?: string
  timestamp: number
}

interface GradeReminder {
  id: string
  enabled: boolean
  frequency: number // days between reminders
  lastShown: number // timestamp
  nextReminder: number // timestamp
}

interface EvaluationType {
  id: string
  name: string
  color: string
  order: number
}

interface ParticipationEntry {
  id: string
  subjectId: string
  date: string // YYYY-MM-DD format
  evaluationTypeId: string
  note?: string
  timestamp: number
}

interface DayNote {
  id: string
  subjectId: string
  date: string // YYYY-MM-DD format
  note: string
  timestamp: number
}

const DB_NAME = 'OralParticipationDB'
const DB_VERSION = 3

class ParticipationDB {
  public db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Subjects store
        if (!db.objectStoreNames.contains('subjects')) {
          const subjectStore = db.createObjectStore('subjects', { keyPath: 'id' })
          subjectStore.createIndex('order', 'order', { unique: false })
        }

        // Evaluation types store
        if (!db.objectStoreNames.contains('evaluationTypes')) {
          const evalStore = db.createObjectStore('evaluationTypes', { keyPath: 'id' })
          evalStore.createIndex('order', 'order', { unique: false })
        }

        // Participation entries store
        if (!db.objectStoreNames.contains('entries')) {
          const entryStore = db.createObjectStore('entries', { keyPath: 'id' })
          entryStore.createIndex('date', 'date', { unique: false })
          entryStore.createIndex('subjectId', 'subjectId', { unique: false })
          entryStore.createIndex('dateSubject', ['date', 'subjectId'], { unique: false })
        }

        // Day notes store
        if (!db.objectStoreNames.contains('dayNotes')) {
          const noteStore = db.createObjectStore('dayNotes', { keyPath: 'id' })
          noteStore.createIndex('dateSubject', ['date', 'subjectId'], { unique: false })
        }

        if (!db.objectStoreNames.contains('scheduleSlots')) {
          const scheduleStore = db.createObjectStore('scheduleSlots', { keyPath: 'id' })
          scheduleStore.createIndex('subjectId', 'subjectId', { unique: false })
        }
        else if (event.oldVersion < 3) {
          const transaction = (event.target as IDBOpenDBRequest).transaction!
          const scheduleStore = transaction.objectStore('scheduleSlots')
          if (scheduleStore.indexNames.contains('dayPeriod')) {
            scheduleStore.deleteIndex('dayPeriod')
          }
        }

        if (!db.objectStoreNames.contains('weekSystemSettings')) {
          db.createObjectStore('weekSystemSettings', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('grades')) {
          const gradeStore = db.createObjectStore('grades', { keyPath: 'id' })
          gradeStore.createIndex('subjectId', 'subjectId', { unique: false })
          gradeStore.createIndex('date', 'date', { unique: false })
        }

        if (!db.objectStoreNames.contains('gradeReminder')) {
          db.createObjectStore('gradeReminder', { keyPath: 'id' })
        }
      }
    })
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db)
      throw new Error('Database not initialized')
    const transaction = this.db.transaction(storeName, mode)
    return transaction.objectStore(storeName)
  }

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    const store = this.getStore('subjects')
    return new Promise((resolve, reject) => {
      const request = store.index('order').getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async addSubject(subject: Omit<Subject, 'id' | 'createdAt'>): Promise<Subject> {
    const newSubject: Subject = {
      ...subject,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    const store = this.getStore('subjects', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.add(newSubject)
      request.onsuccess = () => resolve(newSubject)
      request.onerror = () => reject(request.error)
    })
  }

  async updateSubject(id: string, updates: Partial<Subject>): Promise<void> {
    const store = this.getStore('subjects', 'readwrite')
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const subject = getRequest.result
        if (!subject) {
          reject(new Error('Subject not found'))
          return
        }
        const updated = { ...subject, ...updates }
        const putRequest = store.put(updated)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async deleteSubject(id: string): Promise<void> {
    const store = this.getStore('subjects', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Evaluation Types
  async getEvaluationTypes(): Promise<EvaluationType[]> {
    const store = this.getStore('evaluationTypes')
    return new Promise((resolve, reject) => {
      const request = store.index('order').getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async addEvaluationType(evalType: Omit<EvaluationType, 'id'>): Promise<EvaluationType> {
    const newEvalType: EvaluationType = {
      ...evalType,
      id: crypto.randomUUID(),
    }
    const store = this.getStore('evaluationTypes', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.add(newEvalType)
      request.onsuccess = () => resolve(newEvalType)
      request.onerror = () => reject(request.error)
    })
  }

  async updateEvaluationType(id: string, updates: Partial<EvaluationType>): Promise<void> {
    const store = this.getStore('evaluationTypes', 'readwrite')
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const evalType = getRequest.result
        if (!evalType) {
          reject(new Error('Evaluation type not found'))
          return
        }
        const updated = { ...evalType, ...updates }
        const putRequest = store.put(updated)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async deleteEvaluationType(id: string): Promise<void> {
    const store = this.getStore('evaluationTypes', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Participation Entries
  async getEntriesForDate(date: string): Promise<ParticipationEntry[]> {
    const store = this.getStore('entries')
    return new Promise((resolve, reject) => {
      const request = store.index('date').getAll(date)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async getEntriesForDateAndSubject(date: string, subjectId: string): Promise<ParticipationEntry[]> {
    const store = this.getStore('entries')
    return new Promise((resolve, reject) => {
      const request = store.index('dateSubject').getAll([date, subjectId])
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async addEntry(entry: Omit<ParticipationEntry, 'id' | 'timestamp'>): Promise<ParticipationEntry> {
    const newEntry: ParticipationEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    const store = this.getStore('entries', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.add(newEntry)
      request.onsuccess = () => resolve(newEntry)
      request.onerror = () => reject(request.error)
    })
  }

  async updateEntry(id: string, updates: Partial<ParticipationEntry>): Promise<void> {
    const store = this.getStore('entries', 'readwrite')
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const entry = getRequest.result
        if (!entry) {
          reject(new Error('Entry not found'))
          return
        }
        const updated = { ...entry, ...updates }
        const putRequest = store.put(updated)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async deleteEntry(id: string): Promise<void> {
    const store = this.getStore('entries', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Day Notes
  async getDayNote(date: string, subjectId: string): Promise<DayNote | null> {
    const store = this.getStore('dayNotes')
    return new Promise((resolve, reject) => {
      const request = store.index('dateSubject').get([date, subjectId])
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async saveDayNote(note: Omit<DayNote, 'id' | 'timestamp'>): Promise<DayNote> {
    const store = this.getStore('dayNotes', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.index('dateSubject').get([note.date, note.subjectId])
      request.onsuccess = () => {
        const existing = request.result
        const dayNote: DayNote = existing
          ? { ...existing, note: note.note, timestamp: Date.now() }
          : { ...note, id: crypto.randomUUID(), timestamp: Date.now() }

        const putRequest = store.put(dayNote)
        putRequest.onsuccess = () => resolve(dayNote)
        putRequest.onerror = () => reject(putRequest.error)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getScheduleSlots(): Promise<ScheduleSlot[]> {
    const store = this.getStore('scheduleSlots')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async addScheduleSlot(slot: Omit<ScheduleSlot, 'id' | 'createdAt'>): Promise<ScheduleSlot> {
    const newSlot: ScheduleSlot = {
      ...slot,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    const store = this.getStore('scheduleSlots', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.add(newSlot)
      request.onsuccess = () => resolve(newSlot)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteScheduleSlot(id: string): Promise<void> {
    const store = this.getStore('scheduleSlots', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearScheduleSlots(): Promise<void> {
    const store = this.getStore('scheduleSlots', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getGrades(): Promise<Grade[]> {
    const store = this.getStore('grades')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async getGradesBySubject(subjectId: string): Promise<Grade[]> {
    const store = this.getStore('grades')
    return new Promise((resolve, reject) => {
      const request = store.index('subjectId').getAll(subjectId)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async addGrade(grade: Omit<Grade, 'id' | 'timestamp'>): Promise<Grade> {
    const newGrade: Grade = {
      ...grade,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    const store = this.getStore('grades', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.add(newGrade)
      request.onsuccess = () => resolve(newGrade)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteGrade(id: string): Promise<void> {
    const store = this.getStore('grades', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getGradeReminder(): Promise<GradeReminder | null> {
    const store = this.getStore('gradeReminder')
    return new Promise((resolve, reject) => {
      const request = store.get('settings')
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async saveGradeReminder(reminder: Omit<GradeReminder, 'id'>): Promise<void> {
    const data: GradeReminder = { ...reminder, id: 'settings' }
    const store = this.getStore('gradeReminder', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getWeekSystemSettings(): Promise<WeekSystemSettings | null> {
    const store = this.getStore('weekSystemSettings')
    return new Promise((resolve, reject) => {
      const request = store.get('settings')
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async saveWeekSystemSettings(settings: Omit<WeekSystemSettings, 'id'>): Promise<void> {
    const data: WeekSystemSettings = { ...settings, id: 'settings' }
    const store = this.getStore('weekSystemSettings', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Initialize default data
  async initializeDefaults(): Promise<void> {
    const subjects = await this.getSubjects()
    if (subjects.length === 0) {
      await this.addSubject({ name: 'Mathematik', color: '#3b82f6', order: 0 })
      await this.addSubject({ name: 'Deutsch', color: '#ef4444', order: 1 })
      await this.addSubject({ name: 'Englisch', color: '#10b981', order: 2 })
    }

    const evalTypes = await this.getEvaluationTypes()
    if (evalTypes.length === 0) {
      await this.addEvaluationType({ name: 'Richtig', color: '#10b981', order: 0 })
      await this.addEvaluationType({ name: 'Teilweise richtig', color: '#f59e0b', order: 1 })
      await this.addEvaluationType({ name: 'Falsch', color: '#ef4444', order: 2 })
      await this.addEvaluationType({ name: 'Nicht relevant', color: '#6b7280', order: 3 })
      await this.addEvaluationType({ name: 'Gemeldet', color: '#8b5cf6', order: 4 })
    }
  }
}

let dbInstance: ParticipationDB | null = null

export async function getDB(): Promise<ParticipationDB> {
  if (!dbInstance) {
    dbInstance = new ParticipationDB()
    await dbInstance.init()
    await dbInstance.initializeDefaults()
  }
  return dbInstance
}

export type { DayNote, EvaluationType, Grade, GradeReminder, ParticipationEntry, ScheduleSlot, Subject, WeekSystemSettings }
