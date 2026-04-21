"use client"

import { useEffect, useRef } from "react"

export function ProgressChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = 800
    canvas.height = 300

    // Data for the chart (minutes spent learning each day)
    const data = [45, 60, 30, 75, 90, 120, 60]
    const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]

    // Chart dimensions
    const chartWidth = canvas.width - 60
    const chartHeight = canvas.height - 60
    const barWidth = chartWidth / data.length / 2
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
      const value = Math.round((numGridLines - i) * (Math.max(...data) / numGridLines))
      ctx.fillStyle = "#6b7280" // gray-500
      ctx.font = "12px sans-serif"
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      ctx.fillText(`${value} phút`, 25, y)
    }

    // Draw bars
    const maxValue = Math.max(...data)

    for (let i = 0; i < data.length; i++) {
      const x = 30 + i * (barWidth + spacing) + spacing
      const barHeight = (data[i] / maxValue) * chartHeight
      const y = 30 + chartHeight - barHeight

      // Draw bar
      const gradient = ctx.createLinearGradient(x, y, x, 30 + chartHeight)
      gradient.addColorStop(0, "rgba(249, 115, 22, 0.8)") // orange-500
      gradient.addColorStop(1, "rgba(249, 115, 22, 0.4)") // orange-500 with opacity

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0])
      ctx.fill()

      // Add data value on top of the bar
      ctx.fillStyle = "#4b5563" // gray-600
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.fillText(`${data[i]}`, x + barWidth / 2, y - 5)

      // Add day label
      ctx.fillStyle = "#6b7280" // gray-500
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillText(days[i], x + barWidth / 2, 30 + chartHeight + 5)
    }
  }, [])

  return (
    <div className="w-full overflow-x-auto">
      <canvas ref={canvasRef} className="min-w-full h-[300px]"></canvas>
    </div>
  )
}
