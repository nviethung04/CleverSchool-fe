
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateCourse, GetCourseList, DeleteCourse, UpdateCourse } from "@/lib/api/courses"
import { uploadFile } from "@/lib/api/questions"
import Image from "next/image"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  LucideBookOpen,
  LucideHeadphones,
  LucideMic,
  LucideBookText,
  LucideSearch,
  LucideFilter,
  LucideClock,
  LucidePlus,
  LucideEdit,
  LucideTrash2,
  LucideUsers,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useEffect, useRef } from "react"

const skillTabs = ["listening", "speaking", "reading", "writing"]
const DEFAULT_SCHOOL_ID = 1

export default function AdminCoursesPage() {
  const [selectedSkill, setSelectedSkill] = useState("listening")
  const [showAddCourseDialog, setShowAddCourseDialog] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target: "",
    duration: "",
    level: "",
    type: "listening",
    image: null as string | null,
    status: true
  })

  useEffect(() => {
    getCourseList()
  }, [])

  const getCourseList = async () => {
    try {
      const list = await GetCourseList()
      // console.log('123', list)
      console.log("list nhận được từ API:", list.data.courses)
      setCourses(list.data.courses)
    } catch (err) {
      console.error("Lấy danh sách khóa học thất bại", err)
    }
  }

  const handleCreateCourse = async () => {
    try {
      await CreateCourse({
        name: formData.name,
        description: formData.description,
        target: formData.target,
        duration: formData.duration,
        level: formData.level,
        type: formData.type,
        image: formData.image,
        school_id: DEFAULT_SCHOOL_ID,
      })
      await getCourseList()
      setShowAddCourseDialog(false)
      setFormData({
        name: "",
        description: "",
        target: "",
        duration: "",
        level: "",
        type: "listening",
        image: null,
        status: true
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      console.error("Tạo khóa học thất bại", err)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const result = await uploadFile(file)
      console.log("Full API response:", result)
      console.log("Uploaded URL:", result.data.url) // Truy cập data.url
      setFormData((prev) => ({
        ...prev,
        image: result.data.url, // Lưu URL từ data.url
      }))
    } catch (error) {
      console.error("Tải file thất bại:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khóa học này?")) return;

    try {
      await DeleteCourse(courseId);
      await getCourseList(); // refresh danh sách
    } catch (err) {
      console.error("Xoá khóa học thất bại", err);
    }
  };

  const handleUpdateCourse = async () => {
    if (!selectedCourse) return;

    try {
      await UpdateCourse(selectedCourse.id, {
        ...formData,
        school_id: DEFAULT_SCHOOL_ID,
      });
      await getCourseList();
      setShowAddCourseDialog(false);
      setFormData({
        name: "",
        description: "",
        target: "",
        duration: "",
        level: "",
        type: selectedSkill,
        image: null,
        status: true
      });
      setSelectedCourse(null);
    } catch (err) {
      console.error("Update course failed", err);
    }
  };

  const handleSubmitCourse = async () => {
    console.log("Selected course:", selectedCourse);
    try {
      if (selectedCourse) {
        await UpdateCourse(selectedCourse.id, {
          ...formData,
          school_id: DEFAULT_SCHOOL_ID,
        });
      } else {
        await CreateCourse({
          ...formData,
          school_id: DEFAULT_SCHOOL_ID,
        });
      }

      await getCourseList();
      setShowAddCourseDialog(false);
      setFormData({
        name: "",
        description: "",
        target: "",
        duration: "",
        level: "",
        type: selectedSkill,
        image: null,
        status: true
      });
      setSelectedCourse(null);
    } catch (err) {
      console.error("Submit course failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Quản lý khóa học</h1>
            <p className="text-gray-600">Quản lý và phát triển các khóa học tiếng Anh</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Button className="rounded-full bg-Clever School-green text-white hover:bg-opacity-90" onClick={() =>
              {
                setShowAddCourseDialog(true)
                setSelectedCourse(null);
                setFormData({
                  name: "",
                  description: "",
                  target: "",
                  duration: "",
                  level: "",
                  type: "listening",
                  image: null,
                  status: true, // luôn là "Đang hoạt động"
                });
              } 
               
              }>
              <LucidePlus className="mr-2 h-4 w-4" />
              Tạo khóa học mới
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <LucideSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Tìm kiếm khóa học..." className="pl-10 rounded-full" />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px] rounded-full">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khóa học</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                  <SelectItem value="archived">Đã lưu trữ</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="rounded-full flex items-center gap-2">
                <LucideFilter className="h-4 w-4" />
                Lọc
              </Button>
            </div>
          </div>
        </div>

        {/* Course Categories */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto">
            <TabsTrigger value="all" className="py-2">Tất cả</TabsTrigger>
            <TabsTrigger value="listening" className="py-2">Nghe</TabsTrigger>
            <TabsTrigger value="speaking" className="py-2">Nói</TabsTrigger>
            <TabsTrigger value="reading" className="py-2">Đọc</TabsTrigger>
            <TabsTrigger value="writing" className="py-2">Viết</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard 
                    key={course.id} 
                    course={course} 
                    onDelete={() => handleDeleteCourse(course.id)} 
                    onEdit={() => {
                    setSelectedCourse(course);
                    setFormData({
                      name: course.name || "",
                      description: course.description || "",
                      target: course.target || "",
                      duration: course.duration || "",
                      level: course.level || "",
                      type: course.type || "listening",
                      image: course.image || null,
                      status: course.status,
                    });
                    setShowAddCourseDialog(true);
                  }}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="listening" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter((course) => course.type === "listening").map((course) => (
                <CourseCard 
                    key={course.id} 
                    course={course} 
                    onDelete={() => handleDeleteCourse(course.id)} 
                    onEdit={() => {
                    setSelectedCourse(course);
                    setFormData({
                      name: course.name,
                      description: course.description,
                      target: course.target,
                      duration: course.duration,
                      level: course.level,
                      type: course.type,
                      image: course.image || null,
                      status: course.status,
                    });
                    setShowAddCourseDialog(true);
                  }}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="speaking" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter((course) => course.type === "speaking").map((course) => (
                <CourseCard 
                    key={course.id}
                    course={course} 
                    onDelete={() => handleDeleteCourse(course.id)} 
                    onEdit={() => {
                    setSelectedCourse(course);
                    setFormData({
                      name: course.name,
                      description: course.description,
                      target: course.target,
                      duration: course.duration,
                      level: course.level,
                      type: course.type,
                      image: course.image || null,
                      status: course.status,
                    });
                    setShowAddCourseDialog(true);
                  }}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="reading" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter((course) => course.type === "reading").map((course) => (
                <CourseCard 
                    key={course.id} 
                    course={course} 
                    onDelete={() => handleDeleteCourse(course.id)} 
                    onEdit={() => {
                    setSelectedCourse(course);
                    setFormData({
                      name: course.name,
                      description: course.description,
                      target: course.target,
                      duration: course.duration,
                      level: course.level,
                      type: course.type,
                      image: course.image || null,
                      status: course.status,
                    });
                    setShowAddCourseDialog(true);
                  }}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="writing" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter((course) => course.type === "writing").map((course) => (
                <CourseCard 
                    key={course.id} 
                    course={course} 
                    onDelete={() => handleDeleteCourse(course.id)} 
                    onEdit={() => {
                    setSelectedCourse(course);
                    setFormData({
                      name: course.name,
                      description: course.description,
                      target: course.target,
                      duration: course.duration,
                      level: course.level,
                      type: course.type,
                      image: course.image || null,
                      status: course.status
                    });
                    setShowAddCourseDialog(true);
                  }}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showAddCourseDialog} onOpenChange={setShowAddCourseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCourse ? "Cập nhật khóa học" : "Thêm khóa học mới"}</DialogTitle>
              <DialogDescription>
                Nhập thông tin khóa học để thêm vào hệ thống.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmitCourse();
              }}
            >
              <div>
                <label htmlFor="course-name" className="block mb-1 font-medium">Tên khóa học</label>
                <Input
                  id="course-name"
                  placeholder="Tên khóa học"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="course-description" className="block mb-1 font-medium">Mô tả</label>
                <Textarea
                  id="course-description"
                  placeholder="Mô tả"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="course-objective" className="block mb-1 font-medium">Mục tiêu</label>
                <Input
                  id="course-objective"
                  placeholder="Mục tiêu"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="course-duration" className="block mb-1 font-medium">Thời hạn</label>
                <Input
                  id="course-duration"
                  placeholder="Thời hạn"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="course-level" className="block mb-1 font-medium">Trình độ</label>
                <Input
                  id="course-level"
                  placeholder="Trình độ"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="course-image" className="block mb-1 font-medium">Ảnh đại diện</label>
                <Input
                  id="course-image"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileUpload(file)
                    }
                  }}
                />
              </div>
              <div>
                <label htmlFor="course-type" className="block mb-1 font-medium">Loại kỹ năng</label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="course-type">
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillTabs.map((skill) => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="course-status" className="block mb-1 font-medium">Trạng thái</label>
                <Select
                  value={String(formData.status)}
                  onValueChange={(value) => setFormData({ ...formData, status: value === "true" })}
                >
                  <SelectTrigger id="course-status">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Đang hoạt động</SelectItem>
                    <SelectItem value="false">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isUploading}
                >
                  {selectedCourse ? "Cập nhật" : "Lưu"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddCourseDialog(false)}>
                  Hủy
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

function CourseCard({ course, onDelete, onEdit }: { course: any, onDelete: () => void,  onEdit: () => void}) {
  const getCourseIcon = (type: string) => {
    switch (type) {
      case "listening":
        return <LucideHeadphones className="h-5 w-5" />
      case "speaking":
        return <LucideMic className="h-5 w-5" />
      case "reading":
        return <LucideBookText className="h-5 w-5" />
      case "writing":
        return <LucideBookOpen className="h-5 w-5" />
      default:
        return <LucideBookOpen className="h-5 w-5" />
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-[160px]">
        <Image src={course.image || "/placeholder.svg"} alt={course.name || "Course image"} fill className="object-cover" />
        <div className="absolute top-2 right-2">
          <Badge className="bg-white text-orange-500">{course.level}</Badge>
        </div>
        <div className="absolute top-2 left-2">
          <Badge
            className={
              course.status === true ? "bg-green-500" : course.status === "false" ? "bg-amber-500" : "bg-gray-500"
            }
          >
            {course.status === true ? "Đang hoạt động" : course.status === "false" ? "Bản nháp" : "Đã lưu trữ"}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{course.name}</CardTitle>
        <CardDescription>{course.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <LucideClock className="h-3 w-3" />
            {course.duration}
          </Badge>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            {getCourseIcon(course.type)}
            {course.type === "listening"
              ? "Nghe"
              : course.type === "speaking"
                ? "Nói"
                : course.type === "reading"
                  ? "Đọc"
                  : "Viết"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {course.chapters.length} chương học
          </Badge>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <LucideUsers className="h-3 w-3" />
            {course.student_count} học sinh
          </Badge>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span>Hoàn thành</span>
            <span>{course.completion}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${course.completion}%` }}></div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Thao tác
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onEdit}>
                <LucideEdit className="mr-2 h-4 w-4" />
                Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={onDelete}>
              <LucideTrash2 className="mr-2 h-4 w-4" />
                Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button className="bg-orange-500 hover:bg-orange-600" asChild>
          <Link href={`/admin/courses/${course.id}`}>
            <LucideBookOpen className="mr-2 h-4 w-4" />
            Chi tiết
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}