"use client"

import { useEffect, useRef } from "react"

export function ToolUsageChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = 300
    canvas.height = 300

    // Data for the chart
    const data = [
      { name: "Wordwall", value: 42, color: "#4a90e2" }, // cs-blue
      { name: "Quizizz", value: 35, color: "#ffd900" }, // cs-yellow
      { name: "TinyTap", value: 23, color: "#7ed957" }, // cs-green
    ]

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0)

    // Draw pie chart
    let startAngle = 0
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 40

    data.forEach((item) => {
      // Calculate angles
      const sliceAngle = (2 * Math.PI * item.value) / total

      // Draw slice
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()

      // Fill slice
      ctx.fillStyle = item.color
      ctx.fill()

      // Draw slice border
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      // Calculate label position
      const labelAngle = startAngle + sliceAngle / 2
      const labelRadius = radius * 0.7
      const labelX = centerX + labelRadius * Math.cos(labelAngle)
      const labelY = centerY + labelRadius * Math.sin(labelAngle)

      // Draw label
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`${Math.round((item.value / total) * 100)}%`, labelX, labelY)

      // Update start angle for next slice
      startAngle += sliceAngle
    })

    // Draw center circle (donut hole)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI)
    ctx.fillStyle = "#ffffff"
    ctx.fill()

    // Draw total in center
    ctx.fillStyle = "#4b5563" // gray-600
    ctx.font = "bold 16px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${total}`, centerX, centerY - 10)
    ctx.font = "12px sans-serif"
    ctx.fillText("lượt sử dụng", centerX, centerY + 10)

    // Draw legend
    const legendX = 10
    let legendY = canvas.height - 80

    data.forEach((item) => {
      // Draw legend color box
      ctx.fillStyle = item.color
      ctx.beginPath()
      ctx.rect(legendX, legendY, 15, 15)
      ctx.fill()

      // Draw legend text
      ctx.fillStyle = "#4b5563" // gray-600
      ctx.font = "12px sans-serif"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      ctx.fillText(`${item.name} (${item.value})`, legendX + 25, legendY + 7.5)

      // Update Y position for next legend item
      legendY += 25
    })
  }, [])

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} className="max-w-full h-[200px]"></canvas>
    </div>
  )
}
