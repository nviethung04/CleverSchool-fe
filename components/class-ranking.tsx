"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { LucideMedal, LucideTrophy, LucideStar } from "lucide-react"

type RankingSubject = "overall" | "english" | "math"

export function ClassRanking({ subject = "overall" }: { subject: RankingSubject }) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "semester">("week")

  // Get the appropriate ranking data based on subject and time range
  const getRankingData = () => {
    if (subject === "english") {
      return englishRanking
    } else if (subject === "math") {
      return mathRanking
    } else {
      return overallRanking
    }
  }

  const rankingData = getRankingData()

  // Find the current user's position
  const currentUserPosition = rankingData.findIndex((student) => student.isCurrentUser)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">
          Lớp 3A - {subject === "overall" ? "Tổng hợp" : subject === "english" ? "Tiếng Anh" : "Toán học"}
        </h3>
        <div className="flex gap-2">
          <Button
            variant={timeRange === "week" ? "default" : "outline"}
            size="sm"
            className={`rounded-full ${timeRange === "week" ? "bg-enspire-yellow text-black" : ""}`}
            onClick={() => setTimeRange("week")}
          >
            Tuần này
          </Button>
          <Button
            variant={timeRange === "month" ? "default" : "outline"}
            size="sm"
            className={`rounded-full ${timeRange === "month" ? "bg-enspire-yellow text-black" : ""}`}
            onClick={() => setTimeRange("month")}
          >
            Tháng này
          </Button>
          <Button
            variant={timeRange === "semester" ? "default" : "outline"}
            size="sm"
            className={`rounded-full ${timeRange === "semester" ? "bg-enspire-yellow text-black" : ""}`}
            onClick={() => setTimeRange("semester")}
          >
            Học kỳ
          </Button>
        </div>
      </div>

      {/* Top 3 Students */}
      <div className="flex justify-center items-end gap-4 mb-8">
        {rankingData.slice(0, 3).map((student, index) => (
          <div key={student.id} className={`flex flex-col items-center ${student.isCurrentUser ? "scale-110" : ""}`}>
            <div className="relative">
              {index === 0 && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <LucideTrophy className="h-8 w-8 text-enspire-yellow" />
                </div>
              )}
              {index === 1 && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <LucideMedal className="h-7 w-7 text-enspire-blue" />
                </div>
              )}
              {index === 2 && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <LucideMedal className="h-6 w-6 text-enspire-green" />
                </div>
              )}
              <div className={`relative ${index === 0 ? "w-20 h-20" : index === 1 ? "w-16 h-16" : "w-14 h-14"}`}>
                <Image
                  src={student.avatar || "/placeholder.svg"}
                  alt={student.name}
                  width={80}
                  height={80}
                  className={`rounded-full border-4 ${
                    index === 0 ? "border-enspire-yellow" : index === 1 ? "border-enspire-blue" : "border-enspire-green"
                  }`}
                />
                <div
                  className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0
                      ? "bg-enspire-yellow text-black"
                      : index === 1
                        ? "bg-enspire-blue text-white"
                        : "bg-enspire-green text-white"
                  }`}
                >
                  {index + 1}
                </div>
              </div>
            </div>
            <p className={`mt-2 font-bold text-sm ${student.isCurrentUser ? "text-enspire-blue" : ""}`}>
              {student.name}
            </p>
            <div className="flex items-center mt-1">
              <LucideStar className="h-4 w-4 text-enspire-yellow" />
              <span className="ml-1 text-sm">{student.points} điểm</span>
            </div>
          </div>
        ))}
      </div>

      {/* Other Rankings */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
        {rankingData.slice(3).map((student, index) => (
          <div
            key={student.id}
            className={`flex items-center p-3 rounded-lg border ${
              student.isCurrentUser ? "bg-enspire-blue bg-opacity-5 border-enspire-blue" : "border-gray-200"
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-500">{index + 4}</div>
            <div className="flex items-center flex-1">
              <Image
                src={student.avatar || "/placeholder.svg"}
                alt={student.name}
                width={40}
                height={40}
                className="rounded-full mr-3"
              />
              <div>
                <p className={`font-medium ${student.isCurrentUser ? "text-enspire-blue" : ""}`}>{student.name}</p>
                <p className="text-xs text-gray-500">Lớp {student.class}</p>
              </div>
            </div>
            <div className="flex items-center">
              <LucideStar className="h-4 w-4 text-enspire-yellow mr-1" />
              <span className="font-medium">{student.points}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Current User's Position (if not in top 10) */}
      {currentUserPosition >= 10 && (
        <>
          <div className="my-2 text-center text-sm text-gray-500">...</div>
          <div className="flex items-center p-3 rounded-lg border bg-enspire-blue bg-opacity-5 border-enspire-blue">
            <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-500">
              {currentUserPosition + 1}
            </div>
            <div className="flex items-center flex-1">
              <Image
                src={rankingData[currentUserPosition].avatar || "/placeholder.svg"}
                alt={rankingData[currentUserPosition].name}
                width={40}
                height={40}
                className="rounded-full mr-3"
              />
              <div>
                <p className="font-medium text-enspire-blue">{rankingData[currentUserPosition].name}</p>
                <p className="text-xs text-gray-500">Lớp {rankingData[currentUserPosition].class}</p>
              </div>
            </div>
            <div className="flex items-center">
              <LucideStar className="h-4 w-4 text-enspire-yellow mr-1" />
              <span className="font-medium">{rankingData[currentUserPosition].points}</span>
            </div>
          </div>
        </>
      )}

      {/* Class Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">Điểm trung bình lớp</p>
          <p className="font-bold text-lg">780</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Số học sinh</p>
          <p className="font-bold text-lg">32</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Xếp hạng lớp</p>
          <p className="font-bold text-lg">2/5</p>
        </div>
      </div>
    </div>
  )
}

// Sample data
const overallRanking = [
  { id: 1, name: "Nguyễn Minh Anh", avatar: "/avatar-kid.png", points: 950, class: "3A", isCurrentUser: true },
  { id: 2, name: "Trần Hà My", avatar: "/avatar-kid1.png", points: 980, class: "3A", isCurrentUser: false },
  { id: 3, name: "Lê Quang Minh", avatar: "/avatar-kid2.png", points: 920, class: "3A", isCurrentUser: false },
  { id: 4, name: "Phạm Hoàng Nam", avatar: "/avatar-kid3.png", points: 890, class: "3A", isCurrentUser: false },
  { id: 5, name: "Vũ Thị Hương", avatar: "/avatar-kid4.png", points: 870, class: "3A", isCurrentUser: false },
  { id: 6, name: "Đặng Minh Khôi", avatar: "/avatar-kid1.png", points: 850, class: "3A", isCurrentUser: false },
  { id: 7, name: "Hoàng Thị Lan", avatar: "/avatar-kid2.png", points: 830, class: "3A", isCurrentUser: false },
  { id: 8, name: "Bùi Quốc Anh", avatar: "/avatar-kid3.png", points: 810, class: "3A", isCurrentUser: false },
  { id: 9, name: "Ngô Thị Thảo", avatar: "/avatar-kid4.png", points: 790, class: "3A", isCurrentUser: false },
  { id: 10, name: "Dương Văn Hùng", avatar: "/avatar-kid1.png", points: 770, class: "3A", isCurrentUser: false },
]

const englishRanking = [
  { id: 1, name: "Trần Hà My", avatar: "/avatar-kid1.png", points: 980, class: "3A", isCurrentUser: false },
  { id: 2, name: "Nguyễn Minh Anh", avatar: "/avatar-kid.png", points: 960, class: "3A", isCurrentUser: true },
  { id: 3, name: "Lê Quang Minh", avatar: "/avatar-kid2.png", points: 930, class: "3A", isCurrentUser: false },
  { id: 4, name: "Phạm Hoàng Nam", avatar: "/avatar-kid3.png", points: 900, class: "3A", isCurrentUser: false },
  { id: 5, name: "Vũ Thị Hương", avatar: "/avatar-kid4.png", points: 880, class: "3A", isCurrentUser: false },
  { id: 6, name: "Đặng Minh Khôi", avatar: "/avatar-kid1.png", points: 860, class: "3A", isCurrentUser: false },
  { id: 7, name: "Hoàng Thị Lan", avatar: "/avatar-kid2.png", points: 840, class: "3A", isCurrentUser: false },
  { id: 8, name: "Bùi Quốc Anh", avatar: "/avatar-kid3.png", points: 820, class: "3A", isCurrentUser: false },
  { id: 9, name: "Ngô Thị Thảo", avatar: "/avatar-kid4.png", points: 800, class: "3A", isCurrentUser: false },
  { id: 10, name: "Dương Văn Hùng", avatar: "/avatar-kid1.png", points: 780, class: "3A", isCurrentUser: false },
]

const mathRanking = [
  { id: 1, name: "Lê Quang Minh", avatar: "/avatar-kid2.png", points: 990, class: "3A", isCurrentUser: false },
  { id: 2, name: "Trần Hà My", avatar: "/avatar-kid1.png", points: 970, class: "3A", isCurrentUser: false },
  { id: 3, name: "Phạm Hoàng Nam", avatar: "/avatar-kid3.png", points: 950, class: "3A", isCurrentUser: false },
  { id: 4, name: "Nguyễn Minh Anh", avatar: "/avatar-kid.png", points: 930, class: "3A", isCurrentUser: true },
  { id: 5, name: "Vũ Thị Hương", avatar: "/avatar-kid4.png", points: 910, class: "3A", isCurrentUser: false },
  { id: 6, name: "Đặng Minh Khôi", avatar: "/avatar-kid1.png", points: 890, class: "3A", isCurrentUser: false },
  { id: 7, name: "Hoàng Thị Lan", avatar: "/avatar-kid2.png", points: 870, class: "3A", isCurrentUser: false },
  { id: 8, name: "Bùi Quốc Anh", avatar: "/avatar-kid3.png", points: 850, class: "3A", isCurrentUser: false },
  { id: 9, name: "Ngô Thị Thảo", avatar: "/avatar-kid4.png", points: 830, class: "3A", isCurrentUser: false },
  { id: 10, name: "Dương Văn Hùng", avatar: "/avatar-kid1.png", points: 810, class: "3A", isCurrentUser: false },
]
