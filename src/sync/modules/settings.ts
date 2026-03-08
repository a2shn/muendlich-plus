import type { SyncEngine } from '../engine'
import type { UserSettings, WeekSystemSettings } from '../types'

export class SettingsRepository {
  constructor(private engine: SyncEngine) {}

  // --- USER SETTINGS ---
  async getUserSettings(): Promise<UserSettings> {
    const settings = await this.engine.fetch<UserSettings>('userSettings')
    // Since RLS filters by user_id, the user will only ever have one settings object.
    return settings[0] || this.getDefaults()
  }

  async saveUserSettings(updates: Partial<UserSettings>): Promise<void> {
    // Since getDefaults() returns a mock object with a fixed 'settings' ID
    // if nothing is found, we should check if we have a real object or if we're creating one.
    // However, if we're using normal UUIDs, we should ensure 'id' is preserved.

    // We can check if the existing object came from the fetch (real) or getDefaults.
    // A better approach is to check if it's already in the fetched list.
    const all = await this.engine.fetch<UserSettings>('userSettings')
    const real = all[0]

    if (real) {
      await this.engine.update<UserSettings>('userSettings', real.id, updates)
    }
    else {
      // Create new one with a random UUID
      await this.engine.insert<UserSettings>('userSettings', { ...this.getDefaults(), ...updates, id: crypto.randomUUID() })
    }
  }

  // --- WEEK SYSTEM SETTINGS ---
  async getWeekSystemSettings(): Promise<WeekSystemSettings | null> {
    const data = await this.engine.fetch<WeekSystemSettings>('weekSystemSettings')
    return data[0] || null
  }

  async saveWeekSystemSettings(settings: Omit<WeekSystemSettings, 'id'>): Promise<void> {
    const existing = await this.getWeekSystemSettings()
    if (existing) {
      await this.engine.update<WeekSystemSettings>('weekSystemSettings', existing.id, settings)
    }
    else {
      await this.engine.insert<WeekSystemSettings>('weekSystemSettings', { ...settings, id: crypto.randomUUID() })
    }
  }

  private getDefaults(): UserSettings {
    return {
      id: 'default', // Temporary ID until saved
      federalState: '',
      autoDetectLocation: false,
      syncEnabled: true,
      gradingSystem: 'grades',
      onboardingCompleted: false,
    }
  }
}
