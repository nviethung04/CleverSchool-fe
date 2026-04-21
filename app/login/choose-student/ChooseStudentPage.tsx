"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"

export default function ChooseStudentPage() {
  const router = useRouter()
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const searchParams = useSearchParams()
  const countParam = searchParams.get("count")
  const studentCount = countParam ? Number.parseInt(countParam) : 3
  const validCount = Math.min(Math.max(studentCount, 2), 4)

  const createMockStudents = (count: number) => {
    const allStudents = [
      {
        id: 1,
        name: "Nguyễn Minh Anh",
        age: 8,
        grade: "3",
        avatar: "/avatar-kid1.png",
        lastActive: "2 giờ trước",
        progress: 75,
        courses: 3,
      },
      {
        id: 2,
        name: "Nguyễn Hà Minh",
        age: 10,
        grade: "5",
        avatar: "/avatar-kid2.png",
        lastActive: "Hôm qua",
        progress: 62,
        courses: 4,
      },
      {
        id: 3,
        name: "Nguyễn Thảo My",
        age: 6,
        grade: "1",
        avatar: "/avatar-kid1.png",
        lastActive: "3 ngày trước",
        progress: 45,
        courses: 2,
      },
      {
        id: 4,
        name: "Nguyễn Gia Huy",
        age: 12,
        grade: "7",
        avatar: "/avatar-kid1.png",
        lastActive: "Hôm nay",
        progress: 88,
        courses: 5,
      },
    ]
    return allStudents.slice(0, count)
  }

  const mockStudents = createMockStudents(validCount)

  const handleSelectStudent = (studentId: number) => {
    setSelectedStudent(studentId)
    setTimeout(() => {
      router.push("/dashboard")
    }, 500)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-800 mb-3">Chào mừng phụ huynh!</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Vui lòng chọn tài khoản học sinh mà bạn muốn xem thông tin và theo dõi tiến độ học tập.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className={`w-full flex flex-wrap justify-center gap-6 ${mockStudents.length === 2
            ? "md:grid md:grid-cols-2 md:max-w-3xl"
            : mockStudents.length === 3
              ? "md:grid md:grid-cols-3 md:max-w-4xl"
              : "md:grid md:grid-cols-2 lg:grid-cols-4"
            }`}
        >
          {mockStudents.map((student) => (
            <motion.div
              key={student.id}
              variants={item}
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl w-full ${mockStudents.length <= 3 ? "max-w-xs" : ""
                } ${selectedStudent === student.id ? "ring-4 ring-blue-500 scale-105" : ""}`}
            >
              <div className="p-6 flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4">
                  <Image
                    src={student.avatar || "/placeholder.svg"}
                    alt={student.name}
                    fill
                    className="rounded-full object-cover border-4 border-blue-100"
                  />
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>

                <h3 className="font-bold text-xl text-gray-800 text-center">{student.name}</h3>
                <p className="text-gray-500 text-sm mb-3">
                  Lớp {student.grade} • {student.age} tuổi
                </p>

                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${student.progress}%` }}></div>
                </div>

                <div className="flex justify-between w-full text-sm text-gray-500 mb-4">
                  <span>{student.courses} khóa học</span>
                  <span>Hoạt động: {student.lastActive}</span>
                </div>

                <button
                  onClick={() => handleSelectStudent(student.id)}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Xem tài khoản
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8 text-center">
          <button onClick={() => router.push("/login")} className="text-blue-600 hover:text-blue-800 font-medium">
            Quay lại trang đăng nhập
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <span className="text-sm text-gray-500">Demo số lượng học sinh:</span>
          {[2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => {
                router.push(`/login/choose-student?count=${num}`)
              }}
              className={`px-3 py-1 text-sm rounded-full ${mockStudents.length === num ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
