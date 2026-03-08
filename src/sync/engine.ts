import type { SyncMutation, UserSettings } from './types'
import supabase from '@/lib/supabase'
import { STORAGE_PREFIX, TABLE_MAPPING } from './config'
import { toCamelCase, toSnakeCase } from './utils'

export class SyncEngine {
  private isSyncing = false
  private syncCooldown = false

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.triggerSync())
      // Initial Sync mit kleiner Verzögerung, um React-Mounting abzuwarten
      setTimeout(() => this.triggerSync().catch(console.error), 1000)
    }
  }

  // --- PUBLIC GENERIC CRUD ---

  async fetch<T>(localTable: string, orderBy?: string): Promise<T[]> {
    const remoteTable = TABLE_MAPPING[localTable]

    // Optimierung: Wenn wir offline sind, direkt lokal zurückgeben
    if (this.isOnline() && remoteTable) {
      try {
        let query = supabase.from(remoteTable).select('*')
        if (orderBy)
          query = query.order(orderBy)

        const { data, error } = await query

        // Protection: Leere Remote-Daten nicht übernehmen, falls noch nie gesynct wurde
        const settings = this.getLocalOne<UserSettings>('userSettings')
        const hasSynced = !!settings?.lastSyncedAt

        if (!error && data) {
          if (!hasSynced && data.length === 0) {
            return this.getLocal<T>(localTable)
          }
          const camelData = toCamelCase(data)
          // WICHTIG: setLocal prüft jetzt auf Änderungen, um Loops zu vermeiden
          this.setLocal(localTable, camelData)
          return camelData as T[]
        }
      }
      catch {
        // Silent fail bei Netzwerkfehlern, Fallback auf lokal
      }
    }
    return this.getLocal<T>(localTable)
  }

  async insert<T extends { id: string }>(localTable: string, item: T): Promise<T> {
    const remoteTable = TABLE_MAPPING[localTable]

    const current = this.getLocal<T>(localTable)
    current.push(item)
    this.setLocal(localTable, current)

    if (this.isOnline() && remoteTable) {
      const payload = this.preparePayload(item)
      const { error } = await supabase.from(remoteTable).insert(payload)
      if (error)
        await this.queueAction(localTable, 'INSERT', item)
    }
    else {
      await this.queueAction(localTable, 'INSERT', item)
    }
    return item
  }

  async update<T extends { id: string }>(localTable: string, id: string, updates: Partial<T>): Promise<void> {
    const remoteTable = TABLE_MAPPING[localTable]
    const current = this.getLocal<T>(localTable)
    const index = current.findIndex(i => i.id === id)
    if (index === -1)
      return

    const updatedItem = { ...current[index], ...updates }
    current[index] = updatedItem
    this.setLocal(localTable, current)

    if (this.isOnline() && remoteTable) {
      const payload = this.preparePayload(updates)
      const { error } = await supabase.from(remoteTable).update(payload).eq('id', id)
      if (error)
        await this.queueAction(localTable, 'UPDATE', updatedItem)
    }
    else {
      await this.queueAction(localTable, 'UPDATE', updatedItem)
    }
  }

  async delete(localTable: string, id: string): Promise<void> {
    const remoteTable = TABLE_MAPPING[localTable]
    const current = this.getLocal<any>(localTable)
    this.setLocal(localTable, current.filter(i => i.id !== id))

    if (this.isOnline() && remoteTable) {
      const { error } = await supabase.from(remoteTable).delete().eq('id', id)
      if (error)
        await this.queueAction(localTable, 'DELETE', { id })
    }
    else {
      await this.queueAction(localTable, 'DELETE', { id })
    }
  }

  // --- HELPERS ---

  getLocal<T>(table: string): T[] {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + table)
      return raw ? JSON.parse(raw) : []
    }
    catch { return [] }
  }

  getLocalOne<T>(table: string): T | undefined {
    const data = this.getLocal<T>(table)
    return data.length > 0 ? data[0] : undefined
  }

  setLocal(table: string, data: any[]) {
    const key = STORAGE_PREFIX + table
    const newData = JSON.stringify(data)
    const oldData = localStorage.getItem(key)

    // LOOP FIX: Nur schreiben und Event feuern, wenn sich wirklich etwas geändert hat!
    if (newData !== oldData) {
      localStorage.setItem(key, newData)
      window.dispatchEvent(new Event('participation-data-changed'))
    }
  }

  private isOnline() { return typeof navigator !== 'undefined' && navigator.onLine }

  private preparePayload(item: any) {
    const snake = toSnakeCase(item)
    // Entferne lokale Felder, die Supabase nicht kennt
    delete snake.user_id
    delete snake.userId
    return snake
  }

  // --- SYNC LOGIC ---

  private async queueAction(table: string, type: 'INSERT' | 'UPDATE' | 'DELETE', data: any) {
    const queue = this.getLocal<SyncMutation>('sync_queue')
    queue.push({
      id: crypto.randomUUID(),
      table,
      type,
      data,
      timestamp: Date.now(),
    })
    this.setLocal('sync_queue', queue)
  }

  async triggerSync(force = false) {
    // Verhindere gleichzeitige Syncs und Cooldown (max 1 Sync alle 2 Sekunden, außer forced)
    if (this.isSyncing || (!force && this.syncCooldown) || !this.isOnline())
      return

    const settings = this.getLocalOne<UserSettings>('userSettings')
    if (!force && settings?.syncEnabled === false)
      return

    this.isSyncing = true
    window.dispatchEvent(new Event('participation-sync-start'))

    try {
      // 1. Push Queue (Lokale Änderungen hochladen)
      const queue = this.getLocal<SyncMutation>('sync_queue')
      if (queue.length > 0) {
        queue.sort((a, b) => a.timestamp - b.timestamp)
        const successful: string[] = []

        for (const m of queue) {
          const remoteTable = TABLE_MAPPING[m.table]
          if (!remoteTable)
            continue

          const payload = this.preparePayload(m.data)
          let err = null

          if (m.type === 'INSERT')
            ({ error: err } = await supabase.from(remoteTable).upsert(payload))
          else if (m.type === 'UPDATE')
            ({ error: err } = await supabase.from(remoteTable).update(payload).eq('id', m.data.id))
          else if (m.type === 'DELETE')
            ({ error: err } = await supabase.from(remoteTable).delete().eq('id', m.data.id))

          if (!err)
            successful.push(m.id)
        }

        // Bereinige Queue
        if (successful.length > 0) {
          const freshQueue = this.getLocal<SyncMutation>('sync_queue')
          this.setLocal('sync_queue', freshQueue.filter(m => !successful.includes(m.id)))
        }
      }

      // 2. Pull Data (Daten vom Server laden)
      for (const [local, remote] of Object.entries(TABLE_MAPPING)) {
        const { data } = await supabase.from(remote).select('*')
        if (data) {
          // setLocal prüft jetzt intern auf Änderungen, daher ist das hier sicher
          this.setLocal(local, toCamelCase(data))
        }
      }

      // 3. Update Timestamp
      if (settings) {
        settings.lastSyncedAt = Date.now()
        // Wir nutzen hier direkt localStorage, um einen weiteren Loop durch 'update' zu vermeiden
        const currentSettings = this.getLocal<UserSettings>('userSettings')
        if (currentSettings.length > 0) {
          currentSettings[0].lastSyncedAt = Date.now()
          this.setLocal('userSettings', currentSettings)
        }
      }

      window.dispatchEvent(new Event('participation-sync-end'))
    }
    catch (e) {
      console.error('Sync Error', e)
      window.dispatchEvent(new Event('participation-sync-error'))
    }
    finally {
      this.isSyncing = false
      // Setze Cooldown
      if (!force) {
        this.syncCooldown = true
        setTimeout(() => {
          this.syncCooldown = false
        }, 5000)
      }
    }
  }
}
