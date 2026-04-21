"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
// import { DashboardHeader } from "@/components/dashboard-header"
import { useToast } from "@/components/ui/use-toast"
import { Users, Search, Filter, Mail, Phone, Calendar, Activity } from "lucide-react"
import { getClassByUser, type ClassByUserResponse } from "@/lib/api/students"

export default function ClassesPage() {
  const [classData, setClassData] = useState<ClassByUserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchClassData()
  }, [])

  const fetchClassData = async () => {
    try {
      setLoading(true)
      const data = await getClassByUser()
      setClassData(data)
    } catch (error) {
      console.error("Error fetching class data:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin lớp học. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents =
    classData?.students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  if (loading) {
    return (
      <div className="min-h-screen">
        {/* <DashboardHeader /> */}
        <main className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="h-64 bg-slate-200 rounded"></div>
              <div className="lg:col-span-2 h-64 bg-slate-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="min-h-screen">
        {/* <DashboardHeader /> */}
        <main className="container mx-auto px-6 py-8">
          <div className="text-center py-16">
            <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Không tìm thấy thông tin lớp học</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Bạn chưa được phân vào lớp học nào. Vui lòng liên hệ với giáo viên hoặc quản trị viên.
            </p>
            <Button onClick={fetchClassData} className="bg-slate-900 hover:bg-slate-800">
              Thử lại
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* <DashboardHeader /> */}

      <main className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{classData.class.name}</h1>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Đang học</Badge>
            </div>
            <p className="text-slate-600">Lớp học của bạn</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Class Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Thông tin lớp học</CardTitle>
                  <CardDescription>Chi tiết về lớp học</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Teacher Info */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                    <AvatarImage alt="Giáo viên" />
                    <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold text-lg">GV</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">Giáo viên</h3>
                    <p className="font-semibold text-slate-700">
                      {classData.class.teacher_info.name || "Chưa có thông tin"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {classData.class.teacher_info.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-1.5 bg-white rounded-lg">
                        <Mail className="h-4 w-4 text-slate-500" />
                      </div>
                      <span className="text-slate-600">{classData.class.teacher_info.email}</span>
                    </div>
                  )}
                  {classData.class.teacher_info.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-1.5 bg-white rounded-lg">
                        <Phone className="h-4 w-4 text-slate-500" />
                      </div>
                      <span className="text-slate-600">{classData.class.teacher_info.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Class Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
                  <div className="text-2xl font-bold text-slate-900 mb-1">{classData.total_student}</div>
                  <div className="text-sm text-slate-600">Tổng số học sinh</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">{classData.active_students}</div>
                  <div className="text-sm text-slate-600">Đang hoạt động</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader>
              <Tabs defaultValue="students" className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <TabsList className="bg-slate-100">
                    <TabsTrigger
                      value="students"
                      className="data-[state=active]:bg-white data-[state=active]:text-slate-900 gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Học sinh ({classData.students.length})
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Tìm kiếm học sinh..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 w-full sm:w-64 border-slate-200 focus:border-slate-300 focus:ring-slate-200"
                      />
                    </div>
                    <Button variant="outline" size="icon" className="hover:bg-slate-50 bg-transparent">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <TabsContent value="students" className="mt-6">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">
                        {searchTerm ? "Không tìm thấy học sinh nào" : "Chưa có học sinh trong lớp"}
                      </p>
                      {searchTerm && <p className="text-sm text-slate-400 mt-2">Thử tìm kiếm với từ khóa khác</p>}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="relative">
                            <Avatar className="h-14 w-14">
                              <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                              <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                                student.is_activity ? "bg-green-500" : "bg-slate-300"
                              }`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                              <div>
                                <h3 className="font-semibold text-slate-900">{student.name}</h3>
                                <p className="text-sm text-slate-500">@{student.username}</p>
                              </div>
                              <Badge
                                variant={student.is_activity ? "default" : "secondary"}
                                className={
                                  student.is_activity
                                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                                    : "bg-slate-100 text-slate-600"
                                }
                              >
                                <Activity className="h-3 w-3 mr-1" />
                                {student.is_activity ? "Hoạt động" : "Không hoạt động"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                              <Calendar className="h-3 w-3" />
                              Hoạt động: {student.activity_date}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
