export const STORAGE_PREFIX = 'oral_participation_'

// Maps local cache keys to Supabase table names
export const TABLE_MAPPING: Record<string, string> = {
  subjects: 'subjects',
  evaluationTypes: 'evaluation_types',
  entries: 'participation_entries',
  scheduleSlots: 'schedule_slots',
  grades: 'grades',
  tasks: 'tasks',
  exams: 'exams',
  weekSystemSettings: 'week_system_settings',
  userSettings: 'user_settings',
}

// List of all local tables to initialize
export const TABLES = [...Object.keys(TABLE_MAPPING), ...['sync_queue']]
