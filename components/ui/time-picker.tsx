"use client"

import type * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
}

export function TimePickerDemo({ value, onChange }: TimePickerProps) {
  const [hours, minutes, seconds] = value.split(":").map(Number)

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = Number.parseInt(e.target.value, 10)
    if (isNaN(newHours) || newHours < 0 || newHours > 23) return

    const newValue = `${newHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    onChange(newValue)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = Number.parseInt(e.target.value, 10)
    if (isNaN(newMinutes) || newMinutes < 0 || newMinutes > 59) return

    const newValue = `${hours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    onChange(newValue)
  }

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSeconds = Number.parseInt(e.target.value, 10)
    if (isNaN(newSeconds) || newSeconds < 0 || newSeconds > 59) return

    const newValue = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${newSeconds.toString().padStart(2, "0")}`
    onChange(newValue)
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          Giờ
        </Label>
        <Input
          id="hours"
          className="w-16 h-10"
          type="number"
          min={0}
          max={23}
          value={hours}
          onChange={handleHoursChange}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">
          Phút
        </Label>
        <Input
          id="minutes"
          className="w-16 h-10"
          type="number"
          min={0}
          max={59}
          value={minutes}
          onChange={handleMinutesChange}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="seconds" className="text-xs">
          Giây
        </Label>
        <Input
          id="seconds"
          className="w-16 h-10"
          type="number"
          min={0}
          max={59}
          value={seconds}
          onChange={handleSecondsChange}
        />
      </div>
      <div className="flex h-10 items-center">
        <Clock className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}
