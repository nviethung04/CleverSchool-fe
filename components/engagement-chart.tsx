"use client"

import { useEffect, useRef } from "react"

export function EngagementChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = 800
    canvas.height = 300

    // Data for the chart (minutes spent learning each day and engagement level)
    const data = [
      { day: "Thứ 2", minutes: 45, engagement: 70 },
      { day: "Thứ 3", minutes: 60, engagement: 85 },
      { day: "Thứ 4", minutes: 30, engagement: 60 },
      { day: "Thứ 5", minutes: 75, engagement: 90 },
      { day: "Thứ 6", minutes: 90, engagement: 95 },
      { day: "Thứ 7", minutes: 120, engagement: 85 },
      { day: "Chủ nhật", minutes: 60, engagement: 75 },
    ]

    // Chart dimensions
    const chartWidth = canvas.width - 60
    const chartHeight = canvas.height - 60
    const barWidth = chartWidth / data.length / 3
    const spacing = barWidth

    // Draw background grid
    ctx.strokeStyle = "#e5e7eb" // gray-200
    ctx.lineWidth = 1

    // Horizontal grid lines
    const numGridLines = 5
    const gridSpacing = chartHeight / numGridLines

    for (let i = 0; i <= numGridLines; i++) {
      const y = 30 + i * gridSpacing
      ctx.beginPath()
      ctx.moveTo(30, y)
      ctx.lineTo(30 + chartWidth, y)
      ctx.stroke()

      // Add labels for y-axis
      const value = Math.round((numGridLines - i) * (Math.max(...data.map((d) => d.minutes)) / numGridLines))
      ctx.fillStyle = "#6b7280" // gray-500
      ctx.font = "12px sans-serif"
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      ctx.fillText(`${value} phút`, 25, y)
    }

    // Draw bars for minutes
    const maxMinutes = Math.max(...data.map((d) => d.minutes))

    for (let i = 0; i < data.length; i++) {
      const x = 30 + i * (barWidth * 3 + spacing) + spacing
      const barHeight = (data[i].minutes / maxMinutes) * chartHeight
      const y = 30 + chartHeight - barHeight

      // Draw bar
      const gradient = ctx.createLinearGradient(x, y, x, 30 + chartHeight)
      gradient.addColorStop(0, "rgba(74, 144, 226, 0.8)") // Clever School-blue
      gradient.addColorStop(1, "rgba(74, 144, 226, 0.4)") // Clever School-blue with opacity

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0])
      ctx.fill()

      // Add data value on top of the bar
      ctx.fillStyle = "#4b5563" // gray-600
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.fillText(`${data[i].minutes}`, x + barWidth / 2, y - 5)
    }

    // Draw bars for engagement
    const maxEngagement = 100 // Engagement is on a scale of 0-100

    for (let i = 0; i < data.length; i++) {
      const x = 30 + i * (barWidth * 3 + spacing) + spacing + barWidth * 1.5
      const barHeight = (data[i].engagement / maxEngagement) * chartHeight
      const y = 30 + chartHeight - barHeight

      // Draw bar
      const gradient = ctx.createLinearGradient(x, y, x, 30 + chartHeight)
      gradient.addColorStop(0, "rgba(126, 217, 87, 0.8)") // Clever School-green
      gradient.addColorStop(1, "rgba(126, 217, 87, 0.4)") // Clever School-green with opacity

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0])
      ctx.fill()

      // Add data value on top of the bar
      ctx.fillStyle = "#4b5563" // gray-600
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.fillText(`${data[i].engagement}%`, x + barWidth / 2, y - 5)

      // Add day label
      ctx.fillStyle = "#6b7280" // gray-500
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillText(data[i].day, x - barWidth / 2, 30 + chartHeight + 5)
    }

    // Add legend
    const legendX = canvas.width - 200
    const legendY = 20

    // Minutes legend
    ctx.fillStyle = "rgba(74, 144, 226, 0.8)" // Clever School-blue
    ctx.beginPath()
    ctx.rect(legendX, legendY, 15, 15)
    ctx.fill()

    ctx.fillStyle = "#4b5563" // gray-600
    ctx.font = "12px sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText("Thời gian học (phút)", legendX + 25, legendY + 7.5)

    // Engagement legend
    ctx.fillStyle = "rgba(126, 217, 87, 0.8)" // Clever School-green
    ctx.beginPath()
    ctx.rect(legendX, legendY + 25, 15, 15)
    ctx.fill()

    ctx.fillStyle = "#4b5563" // gray-600
    ctx.font = "12px sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText("Mức độ tương tác (%)", legendX + 25, legendY + 32.5)
  }, [])

  return (
    <div className="w-full overflow-x-auto">
      <canvas ref={canvasRef} className="min-w-full h-[300px]"></canvas>
    </div>
  )
}
