"use client"

import { useEffect, useRef } from "react"

export function SkillsRadarChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = 250
    canvas.height = 250

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = 100

    // Skills data (values from 0 to 1)
    const skills = [
      { name: "Nghe", value: 0.7, color: "#4a90e2" }, // Clever School-blue
      { name: "Nói", value: 0.5, color: "#ffd900" }, // Clever School-yellow
      { name: "Đọc", value: 0.8, color: "#7ed957" }, // Clever School-green
      { name: "Viết", value: 0.6, color: "#ff9f00" }, // Clever School-orange
      { name: "Từ vựng", value: 0.75, color: "#4a90e2" }, // Clever School-blue
    ]

    const numSkills = skills.length
    const angleStep = (Math.PI * 2) / numSkills

    // Draw background circles
    ctx.strokeStyle = "#e5e7eb" // gray-200
    ctx.fillStyle = "#f9fafb" // gray-50

    // Draw circles
    for (let i = 1; i <= 4; i++) {
      const circleRadius = (radius * i) / 4
      ctx.beginPath()
      ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Draw axes
    for (let i = 0; i < numSkills; i++) {
      const angle = i * angleStep - Math.PI / 2 // Start from top
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.strokeStyle = "#e5e7eb" // gray-200
      ctx.stroke()

      // Draw skill labels
      const labelX = centerX + (radius + 20) * Math.cos(angle)
      const labelY = centerY + (radius + 20) * Math.sin(angle)

      ctx.fillStyle = "#4b5563" // gray-600
      ctx.font = "12px Quicksand, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(skills[i].name, labelX, labelY)
    }

    // Draw data
    ctx.beginPath()
    for (let i = 0; i < numSkills; i++) {
      const angle = i * angleStep - Math.PI / 2 // Start from top
      const value = skills[i].value
      const x = centerX + radius * value * Math.cos(angle)
      const y = centerY + radius * value * Math.sin(angle)

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fillStyle = "rgba(74, 144, 226, 0.2)" // Clever School-blue with opacity
    ctx.fill()
    ctx.strokeStyle = "#4a90e2" // Clever School-blue
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw data points
    for (let i = 0; i < numSkills; i++) {
      const angle = i * angleStep - Math.PI / 2 // Start from top
      const value = skills[i].value
      const x = centerX + radius * value * Math.cos(angle)
      const y = centerY + radius * value * Math.sin(angle)

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = skills[i].color
      ctx.fill()
    }
  }, [])

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} className="max-w-full"></canvas>
    </div>
  )
}
