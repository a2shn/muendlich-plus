"use client"

import { useState, useEffect } from "react"
import { getDB, type GradeReminder as GradeReminderType } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, BellOff } from "lucide-react"

export function GradeReminder() {
  const [reminder, setReminder] = useState<GradeReminderType | null>(null)
  
  // Change state to allow string (for empty input) or number
  const [frequencyInput, setFrequencyInput] = useState<string | number>(7)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    loadReminder()
  }, [])

  useEffect(() => {
    // Only check reminder if we have valid data
    if (enabled && reminder) {
      checkReminder()
    }
  }, [enabled, reminder])

  const loadReminder = async () => {
    try {
      const db = await getDB()
      const data = await db.getGradeReminder()
      if (data) {
        setReminder(data)
        setFrequencyInput(data.frequency)
        setEnabled(data.enabled)
      }
    } catch (error) {
      console.error("[calendar+] Failed to load reminder:", error)
    }
  }

  const checkReminder = () => {
    if (!reminder || !enabled) return

    const now = Date.now()
    if (now >= reminder.nextReminder) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Noten eintragen", {
          body: "Vergessen Sie nicht, den Lehrer nach Ihren Noten zu fragen!",
          icon: "/favicon.ico",
        })
      } else {
        alert("Vergessen Sie nicht, den Lehrer nach Ihren Noten zu fragen!")
      }

      // When checking, we use the current valid reminder frequency
      saveReminder(enabled, reminder.frequency, now)
    }
  }

  const saveReminder = async (isEnabled: boolean, freq: number, lastShown?: number) => {
    try {
      const db = await getDB()
      const now = lastShown || Date.now()
      const nextReminder = now + freq * 24 * 60 * 60 * 1000

      await db.saveGradeReminder({
        enabled: isEnabled,
        frequency: freq,
        lastShown: now,
        nextReminder,
      })

      await loadReminder()
    } catch (error) {
      console.error("[calendar+] Failed to save reminder:", error)
    }
  }

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked)

    if (checked && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission()
    }

    // Ensure we pass a valid number to save, even if input is currently weird
    const validFreq = Number(frequencyInput) || 7
    await saveReminder(checked, validFreq)
  }

  // 1. Just update the UI state while typing (allows empty string)
  const handleInputChange = (value: string) => {
    setFrequencyInput(value)
  }

  // 2. Validate and Save ONLY when the user clicks away (onBlur)
  const handleInputBlur = async () => {
    let val = Number(frequencyInput)

    // Validation: Default to 7 if empty or invalid, clamp between 1 and 30
    if (!val || val < 1) val = 1
    if (val > 30) val = 30

    setFrequencyInput(val) // Snap UI to valid number
    await saveReminder(enabled, val) // Save to DB
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          Noten-Erinnerung
        </CardTitle>
        <CardDescription>Lassen Sie sich daran erinnern, den Lehrer nach Noten zu fragen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="reminder-toggle">Erinnerung aktivieren</Label>
          <Switch id="reminder-toggle" checked={enabled} onCheckedChange={handleToggle} />
        </div>

        {enabled && (
          <div className="space-y-2">
            <Label htmlFor="frequency">Erinnerung alle (Tage)</Label>
            <Input
              id="frequency"
              type="number"
              min="1"
              max="30"
              value={frequencyInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur} // Logic moved here
            />
          </div>
        )}

        {reminder && enabled && (
          <div className="text-sm text-muted-foreground">
            Nächste Erinnerung: {new Date(reminder.nextReminder).toLocaleString("de-DE")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}