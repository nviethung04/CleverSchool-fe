"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  LucideBookOpen,
  LucideCheckCircle,
  LucideLock,
  LucidePlayCircle,
  LucideArrowUp,
  LucideArrowDown,
} from "lucide-react"

export function LearningPathAnalytics() {
  const [viewMode, setViewMode] = useState<"progress" | "effectiveness">("progress")

  const learningModules = [
    {
      id: 1,
      title: "Từ vựng về động vật",
      description: "Học 20 từ vựng về các loài động vật",
      status: "completed",
      progress: 100,
      type: "vocabulary",
      level: "Sơ cấp",
      duration: "15 phút",
      color: "blue",
      effectiveness: 95,
      effectivenessChange: 5,
      completionTime: "12 phút",
      timeChange: -3,
      tools: ["Wordwall", "Quizizz"],
    },
    {
      id: 2,
      title: "Ngữ pháp: Thì hiện tại đơn",
      description: "Cách sử dụng thì hiện tại đơn trong tiếng Anh",
      status: "completed",
      progress: 100,
      type: "grammar",
      level: "Sơ cấp",
      duration: "20 phút",
      color: "green",
      effectiveness: 85,
      effectivenessChange: -2,
      completionTime: "25 phút",
      timeChange: 5,
      tools: ["Quizizz"],
    },
    {
      id: 3,
      title: "Luyện nghe: Đoạn hội thoại ngắn",
      description: "Luyện nghe với các đoạn hội thoại ngắn hàng ngày",
      status: "in-progress",
      progress: 60,
      type: "listening",
      level: "Sơ cấp",
      duration: "25 phút",
      color: "yellow",
      effectiveness: 78,
      effectivenessChange: 3,
      completionTime: "15 phút",
      timeChange: 0,
      tools: ["TinyTap"],
    },
    {
      id: 4,
      title: "Luyện nói: Giới thiệu bản thân",
      description: "Thực hành giới thiệu bản thân bằng tiếng Anh",
      status: "locked",
      progress: 0,
      type: "speaking",
      level: "Sơ cấp",
      duration: "30 phút",
      color: "orange",
      effectiveness: 0,
      effectivenessChange: 0,
      completionTime: "0 phút",
      timeChange: 0,
      tools: [],
    },
  ]

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "vocabulary":
        return <LucideBookOpen className="h-5 w-5" />
      case "grammar":
        return <LucideBookOpen className="h-5 w-5" />
      case "listening":
        return <LucidePlayCircle className="h-5 w-5" />
      case "speaking":
        return <LucidePlayCircle className="h-5 w-5" />
      default:
        return <LucideBookOpen className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <LucideCheckCircle className="h-5 w-5 text-cs-green" />
      case "in-progress":
        return <LucidePlayCircle className="h-5 w-5 text-cs-blue" />
      case "locked":
        return <LucideLock className="h-5 w-5 text-gray-400" />
      default:
        return null
    }
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "progress" ? "default" : "outline"}
            size="sm"
            className={`rounded-full ${viewMode === "progress" ? "bg-cs-blue text-white" : ""}`}
            onClick={() => setViewMode("progress")}
          >
            Tiến độ
          </Button>
          <Button
            variant={viewMode === "effectiveness" ? "default" : "outline"}
            size="sm"
            className={`rounded-full ${viewMode === "effectiveness" ? "bg-cs-green text-white" : ""}`}
            onClick={() => setViewMode("effectiveness")}
          >
            Hiệu quả
          </Button>
        </div>
      </div>

      <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200 z-0"></div>
      <div className="space-y-6 relative z-10">
        {learningModules.map((module) => (
          <div key={module.id} className="flex gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                module.status === "completed"
                  ? "bg-cs-green bg-opacity-20"
                  : module.status === "in-progress"
                    ? "bg-cs-blue bg-opacity-20"
                    : "bg-gray-100"
              }`}
            >
              {getStatusIcon(module.status)}
            </div>
            <div className={`bg-white rounded-2xl border-2 border-cs-${module.color} p-4 flex-grow card-kid`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold">{module.title}</h3>
                  <p className="text-sm text-gray-500">{module.description}</p>
                </div>
                <Badge
                  variant={
                    module.status === "completed"
                      ? "outline"
                      : module.status === "in-progress"
                        ? "secondary"
                        : "outline"
                  }
                  className={
                    module.status === "completed"
                      ? "bg-cs-green bg-opacity-10 text-cs-green border-cs-green"
                      : module.status === "in-progress"
                        ? "bg-cs-blue bg-opacity-10 text-cs-blue border-cs-blue"
                        : "text-gray-400 bg-gray-50"
                  }
                >
                  {module.status === "completed"
                    ? "Hoàn thành"
                    : module.status === "in-progress"
                      ? "Đang học"
                      : "Chưa mở khóa"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className="text-xs bg-white">
                  {module.level}
                </Badge>
                <Badge variant="outline" className="text-xs bg-white">
                  {module.duration}
                </Badge>
                <Badge variant="outline" className="text-xs flex items-center gap-1 bg-white">
                  {getModuleIcon(module.type)}
                  {module.type === "vocabulary"
                    ? "Từ vựng"
                    : module.type === "grammar"
                      ? "Ngữ pháp"
                      : module.type === "listening"
                        ? "Nghe"
                        : module.type === "speaking"
                          ? "Nói"
                          : "Kiểm tra"}
                </Badge>
              </div>

              {viewMode === "progress" && (
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Tiến độ</span>
                    <span className="text-sm font-medium">{module.progress}%</span>
                  </div>
                  <Progress value={module.progress} className="h-2 bg-gray-100">
                    <div
                      className={`h-full bg-cs-${module.color} rounded-full`}
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </Progress>
                </div>
              )}

              {viewMode === "effectiveness" && module.status !== "locked" && (
                <div className="space-y-3 mb-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Hiệu quả học tập</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{module.effectiveness}%</span>
                        {module.effectivenessChange !== 0 && (
                          <span
                            className={`text-xs ${module.effectivenessChange > 0 ? "text-green-500" : "text-red-500"}`}
                          >
                            {module.effectivenessChange > 0 ? (
                              <LucideArrowUp className="h-3 w-3" />
                            ) : (
                              <LucideArrowDown className="h-3 w-3" />
                            )}
                            {Math.abs(module.effectivenessChange)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <Progress value={module.effectiveness} className="h-2 bg-gray-100">
                      <div
                        className="h-full bg-cs-green rounded-full"
                        style={{ width: `${module.effectiveness}%` }}
                      ></div>
                    </Progress>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Thời gian hoàn thành</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{module.completionTime}</span>
                        {module.timeChange !== 0 && (
                          <span className={`text-xs ${module.timeChange < 0 ? "text-green-500" : "text-red-500"}`}>
                            {module.timeChange < 0 ? (
                              <LucideArrowDown className="h-3 w-3" />
                            ) : (
                              <LucideArrowUp className="h-3 w-3" />
                            )}
                            {Math.abs(module.timeChange)} phút
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {module.tools.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Công cụ sử dụng:</span>{" "}
                  {module.tools.map((tool, index) => (
                    <span key={index}>
                      {tool}
                      {index < module.tools.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
