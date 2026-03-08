export interface SyncMutation {
  id: string
  table: string
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  data: any
  timestamp: number
  retryCount?: number
}

// UPDATE: 'completed' entfernt
export interface Task {
  id: string
  subjectId: string
  title: string
  dueDate: string
  description?: string
  createdAt: number
}

export interface Exam {
  id: string
  subjectId: string
  title: string
  date: string
  type: 'Klausur' | 'Test' | 'Referat' | 'Sonstiges'
  topics?: string
  createdAt: number
}

export interface Subject {
  id: string
  name: string
  color: string
  order: number
  targetGrade?: number
  createdAt: number
}

export interface ScheduleSlot {
  id: string
  subjectId: string
  dayOfWeek: number
  period: number
  weekType?: 'A' | 'B' | null
  createdAt: number
}

export interface WeekSystemSettings {
  id: string
  enabled: boolean
  referenceDate: string
}

export interface Grade {
  id: string
  subjectId: string
  grade: number
  date: string
  evaluationCombination: string
  timestamp: number
}

export interface EvaluationType {
  id: string
  name: string
  color: string
  order: number
}

export interface ParticipationEntry {
  id: string
  subjectId: string
  date: string
  evaluationTypeId: string
  timestamp: number
}

export interface UserSettings {
  id: string
  federalState: string
  autoDetectLocation: boolean
  lastSyncedAt?: number
  syncEnabled?: boolean
  gradingSystem?: 'points' | 'grades'
  onboardingCompleted?: boolean
}
