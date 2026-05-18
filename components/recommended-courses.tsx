import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { LucideBookOpen, LucideHeadphones, LucideMic, LucideBookText, LucideClock } from "lucide-react"

export function RecommendedCourses() {
  const courses = [
    {
      id: 1,
      title: "Luyện nghe tiếng Anh cơ bản",
      description: "Cải thiện kỹ năng nghe với các bài tập thực tế",
      image: "/course-listening.png",
      level: "Sơ cấp",
      duration: "4 tuần",
      lessons: 12,
      type: "listening",
      progress: 0,
      color: "blue",
    },
    {
      id: 2,
      title: "Từ vựng chủ đề thể thao",
      description: "Học từ vựng tiếng Anh về thể thao và hoạt động ngoài trời",
      image: "/course-vocabulary.png",
      level: "Sơ cấp",
      duration: "2 tuần",
      lessons: 8,
      type: "vocabulary",
      progress: 0,
      color: "green",
    },
    {
      id: 3,
      title: "Luyện nói giao tiếp hàng ngày",
      description: "Thực hành nói tiếng Anh trong các tình huống hàng ngày",
      image: "/course-speaking.png",
      level: "Trung cấp",
      duration: "6 tuần",
      lessons: 15,
      type: "speaking",
      progress: 0,
      color: "yellow",
    },
  ]

  const getCourseIcon = (type: string) => {
    switch (type) {
      case "listening":
        return <LucideHeadphones className="h-5 w-5" />
      case "vocabulary":
        return <LucideBookOpen className="h-5 w-5" />
      case "speaking":
        return <LucideMic className="h-5 w-5" />
      case "reading":
        return <LucideBookText className="h-5 w-5" />
      default:
        return <LucideBookOpen className="h-5 w-5" />
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {courses.map((course) => (
        <div
          key={course.id}
          className={`border-2 border-Clever School-${course.color} rounded-2xl overflow-hidden hover:shadow-md transition-shadow game-card`}
        >
          <div className="relative h-[100px]">
            <Image src={course.image || "/placeholder.svg"} alt={course.title} fill className="object-cover" />
            <div className="absolute top-2 right-2">
              <Badge className={`bg-Clever School-${course.color} text-white`}>{course.level}</Badge>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold mb-1">{course.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{course.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="text-xs flex items-center gap-1 bg-white">
                <LucideClock className="h-3 w-3" />
                {course.duration}
              </Badge>
              <Badge variant="outline" className="text-xs flex items-center gap-1 bg-white">
                {getCourseIcon(course.type)}
                {course.type === "listening"
                  ? "Nghe"
                  : course.type === "vocabulary"
                    ? "Từ vựng"
                    : course.type === "speaking"
                      ? "Nói"
                      : "Đọc"}
              </Badge>
              <Badge variant="outline" className="text-xs bg-white">
                {course.lessons} bài học
              </Badge>
            </div>
            <Button
              className={`w-full rounded-full bg-Clever School-${course.color} ${course.color === "yellow" ? "text-black" : "text-white"} hover:bg-opacity-90`}
            >
              Bắt đầu học
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
