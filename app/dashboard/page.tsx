import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import Link from "next/link"
import {
  BookOpen,
  Mic,
  BarChart3,
  ClipboardList,
  GraduationCap,
  FileText,
  Calendar,
  ArrowRight,
  Eye,
  Clock,
  Users,
  Award,
} from "lucide-react"
// import { DashboardHeader } from "@/components/dashboard-header"

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      {/* <DashboardHeader /> */}

      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Xin chào, Minh Anh! 👋</h1>
            <p className="text-slate-600">Hôm nay là ngày tuyệt vời để học tiếng Anh!</p>
          </div>
          <div className="mt-6 lg:mt-0 flex gap-3">
            <Button variant="outline" className="gap-2 hover:bg-slate-50 bg-transparent">
              <Calendar className="h-4 w-4" />
              Lịch học
            </Button>
            <Button className="gap-2 bg-slate-900 hover:bg-slate-800">
              <BookOpen className="h-4 w-4" />
              Tiếp tục học
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Learning Progress */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Tiến độ học tập</CardTitle>
                  <CardDescription>Tuần này</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: "Hoàn thành bài học", value: 75, color: "bg-blue-500" },
                { label: "Từ vựng mới", value: 75, color: "bg-green-500", detail: "15/20" },
                { label: "Bài tập hoàn thành", value: 80, color: "bg-amber-500", detail: "8/10" },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-600">{item.detail || `${item.value}%`}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Sắp tới</CardTitle>
                  <CardDescription>Lịch học và sự kiện</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  icon: Calendar,
                  iconBg: "bg-green-50",
                  iconColor: "text-green-600",
                  title: "Lớp học trực tuyến",
                  time: "Hôm nay, 17:00 - 18:00",
                  isHighlight: true,
                },
                {
                  icon: BookOpen,
                  iconBg: "bg-slate-50",
                  iconColor: "text-slate-500",
                  title: "Bài kiểm tra từ vựng",
                  time: "Ngày mai, 15:00",
                  isHighlight: false,
                },
                {
                  icon: Mic,
                  iconBg: "bg-slate-50",
                  iconColor: "text-slate-500",
                  title: "Thực hành nói",
                  time: "Thứ 6, 16:30",
                  isHighlight: false,
                },
              ].map((event, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    event.isHighlight ? "bg-green-50 border border-green-100" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`${event.iconBg} rounded-lg p-2`}>
                    <event.icon className={`h-4 w-4 ${event.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-slate-900">{event.title}</p>
                    <p className="text-xs text-slate-600">{event.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* My Class */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Lớp học của tôi</CardTitle>
                  <CardDescription>Lớp học bạn đang tham gia</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <GraduationCap className="h-6 w-6 text-slate-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">Lớp 5A</h4>
                      <p className="text-sm text-slate-600">Tiếng Anh cơ bản</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Đang học</Badge>
                </div>

                <div className="space-y-3 mb-4">
                  {[
                    { icon: "👩‍🏫", label: "Giáo viên: Cô Nguyễn Thị Hương" },
                    { icon: "👥", label: "Sĩ số: 25 học sinh" },
                    { icon: "🕒", label: "Thời gian: Thứ 2, 4, 6 (17:00 - 18:00)" },
                  ].map((info, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-lg">{info.icon}</span>
                      <p className="text-sm text-slate-700">{info.label}</p>
                    </div>
                  ))}
                </div>

                <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                  <Link href="/classes">Xem chi tiết lớp học</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Scores */}
        <Card className="border-0 shadow-sm mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Điểm số gần nhất</CardTitle>
                <CardDescription>Kết quả các bài kiểm tra gần đây</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="font-semibold text-slate-700">Bài kiểm tra</TableHead>
                    <TableHead className="font-semibold text-slate-700">Điểm</TableHead>
                    <TableHead className="font-semibold text-slate-700">Ngày</TableHead>
                    <TableHead className="font-semibold text-slate-700">Xếp loại</TableHead>
                    <TableHead className="font-semibold text-slate-700">Nhận xét</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      name: "Từ vựng chủ đề gia đình",
                      score: "9/10",
                      date: "Hôm qua",
                      grade: "Xuất sắc",
                      gradeColor: "bg-green-100 text-green-700",
                    },
                    {
                      name: "Ngữ pháp thì quá khứ đơn",
                      score: "8/10",
                      date: "3 ngày trước",
                      grade: "Tốt",
                      gradeColor: "bg-blue-100 text-blue-700",
                    },
                    {
                      name: "Kỹ năng nghe hội thoại",
                      score: "7/10",
                      date: "1 tuần trước",
                      grade: "Khá",
                      gradeColor: "bg-amber-100 text-amber-700",
                    },
                  ].map((result, index) => (
                    <TableRow key={index} className="border-slate-100">
                      <TableCell className="font-medium text-slate-900">{result.name}</TableCell>
                      <TableCell className="font-semibold">{result.score}</TableCell>
                      <TableCell className="text-slate-600">{result.date}</TableCell>
                      <TableCell>
                        <Badge className={result.gradeColor}>{result.grade}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="gap-1 text-slate-600 hover:text-slate-900">
                          <Eye className="h-3 w-3" />
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6 text-center">
              <Button variant="outline" asChild>
                <Link href="/assignments?tab=results" className="gap-2">
                  Xem tất cả điểm số
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My Courses */}
        <Card className="border-0 shadow-sm mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Khóa học của tôi</CardTitle>
                <CardDescription>Khóa học bạn đang tham gia</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Tiếng Anh giao tiếp cơ bản",
                  progress: 75,
                  image: "/course-listening.png",
                  lessons: 12,
                  completed: 9,
                },
                {
                  title: "Từ vựng chủ đề động vật",
                  progress: 60,
                  image: "/course-vocabulary.png",
                  lessons: 10,
                  completed: 6,
                },
                {
                  title: "Ngữ pháp tiếng Anh lớp 5",
                  progress: 40,
                  image: "/course-speaking.png",
                  lessons: 15,
                  completed: 6,
                },
              ].map((course, index) => (
                <Card key={index} className="border-0 shadow-sm overflow-hidden">
                  <div className="relative h-40">
                    <Image src={course.image || "/placeholder.svg"} alt={course.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-semibold text-sm mb-2">{course.title}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/90">{course.progress}% hoàn thành</span>
                        <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                          {course.completed}/{course.lessons} bài học
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                      <div
                        className="h-2 bg-slate-900 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between gap-2">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Chi tiết
                      </Button>
                      <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-xs">
                        Tiếp tục
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button variant="outline" asChild>
                <Link href="/courses" className="gap-2">
                  Xem tất cả khóa học
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assignments & Tests */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Assignments */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Bài tập cần làm</CardTitle>
                  <CardDescription>Danh sách bài tập đang chờ hoàn thành</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  title: "Bài tập từ vựng chủ đề động vật",
                  dueDate: "Hôm nay",
                  course: "Từ vựng chủ đề động vật",
                  status: "urgent",
                },
                {
                  title: "Bài tập ngữ pháp thì hiện tại đơn",
                  dueDate: "Ngày mai",
                  course: "Ngữ pháp tiếng Anh lớp 5",
                  status: "normal",
                },
                {
                  title: "Bài tập nghe và điền từ",
                  dueDate: "3 ngày nữa",
                  course: "Tiếng Anh giao tiếp cơ bản",
                  status: "normal",
                },
              ].map((assignment, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors ${
                    assignment.status === "urgent" ? "border-red-200 bg-red-50" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 mb-1">{assignment.title}</h4>
                      <p className="text-sm text-slate-600">Khóa học: {assignment.course}</p>
                    </div>
                    <Badge
                      className={
                        assignment.status === "urgent" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                      }
                    >
                      {assignment.status === "urgent" ? "Gấp" : "Mới"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      Hạn nộp: {assignment.dueDate}
                    </div>
                    <Button size="sm" className="h-8 text-xs">
                      Làm bài
                    </Button>
                  </div>
                </div>
              ))}
              <div className="text-center pt-2">
                <Button variant="outline" asChild>
                  <Link href="/assignments" className="gap-2">
                    Xem tất cả bài tập
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tests */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Bài kiểm tra sắp tới</CardTitle>
                  <CardDescription>Lịch kiểm tra và đánh giá</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  title: "Kiểm tra từ vựng động vật",
                  date: "Ngày mai, 15:00",
                  course: "Từ vựng chủ đề động vật",
                  duration: "15 phút",
                  status: "upcoming",
                },
                {
                  title: "Kiểm tra ngữ pháp thì hiện tại",
                  date: "Thứ 5, 16:00",
                  course: "Ngữ pháp tiếng Anh lớp 5",
                  duration: "30 phút",
                  status: "normal",
                },
                {
                  title: "Kiểm tra kỹ năng nghe",
                  date: "Thứ 6, 17:00",
                  course: "Tiếng Anh giao tiếp cơ bản",
                  duration: "20 phút",
                  status: "normal",
                },
              ].map((test, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors ${
                    test.status === "upcoming" ? "border-purple-200 bg-purple-50" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 mb-1">{test.title}</h4>
                      <p className="text-sm text-slate-600">Khóa học: {test.course}</p>
                    </div>
                    <Badge
                      className={
                        test.status === "upcoming" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"
                      }
                    >
                      {test.status === "upcoming" ? "Sắp diễn ra" : "Lịch hẹn"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {test.date}
                      </div>
                      <p className="text-xs text-slate-500">Thời lượng: {test.duration}</p>
                    </div>
                    <Button
                      variant={test.status === "upcoming" ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                    >
                      {test.status === "upcoming" ? "Chuẩn bị" : "Nhắc nhở"}
                    </Button>
                  </div>
                </div>
              ))}
              <div className="text-center pt-2">
                <Button variant="outline" asChild>
                  <Link href="/assignments?tab=tests" className="gap-2">
                    Xem tất cả bài kiểm tra
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
