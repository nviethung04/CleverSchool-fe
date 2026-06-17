import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LucideBookOpen, LucideCheckCircle, LucideLock, LucidePlayCircle, LucideStar } from "lucide-react"

export function LearningPath() {
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
    },
    {
      id: 5,
      title: "Bài kiểm tra: Từ vựng và ngữ pháp",
      description: "Kiểm tra kiến thức đã học",
      status: "locked",
      progress: 0,
      type: "test",
      level: "Sơ cấp",
      duration: "15 phút",
      color: "blue",
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
      case "test":
        return <LucideCheckCircle className="h-5 w-5" />
      default:
        return <LucideBookOpen className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <LucideStar className="h-5 w-5 text-cs-yellow" />
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
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>
      <div className="space-y-6 relative z-10">
        {learningModules.map((module) => (
          <div key={module.id} className="flex gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                module.status === "completed"
                  ? "bg-cs-yellow bg-opacity-20"
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
                      ? "bg-cs-yellow bg-opacity-10 text-cs-yellow border-cs-yellow"
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
              {module.status !== "locked" && (
                <Button
                  className={
                    module.status === "completed"
                      ? "rounded-full bg-cs-yellow text-black hover:bg-yellow-400"
                      : "rounded-full bg-cs-blue text-white hover:bg-blue-600"
                  }
                >
                  {module.status === "completed" ? "Xem lại" : "Tiếp tục học"}
                </Button>
              )}
              {module.status === "locked" && (
                <Button variant="outline" className="rounded-full" disabled>
                  Chưa mở khóa
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
