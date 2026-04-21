"use client"
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { CreateChapter, DeleteChapter, GetChapters , UpdateChapter } from "@/lib/api/chapters"
import { GetUserList, GetUserListAdvanced , CheckUsernameExists } from "@/lib/api/users"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UpdateCourse, GetCourseDetail, GetCourseList } from "@/lib/api/courses"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  LucideChevronLeft,
  LucideEdit,
  LucideTrash2,
  LucideUsers,
  LucideClock,
  LucideCalendar,
  LucidePlus,
  LucideHeadphones,
  LucideBookText,
  LucideMic,
  LucideChevronUp,
  Video,
  FileQuestion,
  ClipboardList,
  FileText,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { deserialize } from "v8"
import { Description } from "@radix-ui/react-toast"
import { title } from "process"
import { error } from "console"
import { use } from "react";
import { uploadFile } from "@/lib/api/questions"
import { CreateLesson, GetLessons } from "@/lib/api/lessons"
import { se } from "date-fns/locale"

export default function CourseDetailPage({ params, onEdit }: { params: { id: string },  onEdit: () => void }) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params)
  const courseId = unwrappedParams.id
  const router = useRouter()
  // const [isUploading, setIsUploading] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState("listening")
  const [isUploading, setIsUploading] = useState(false)
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<any[]>([])
  const [showAddChapterDialog, setShowAddChapterDialog] = useState(false)
  const [course, setCourse] = useState<any>(null);
  const [ShowUpdateCourseDialog, setShowUpdateCourseDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null)
  const DEFAULT_SCHOOL_ID = 1
  const [students, setStudents] = useState<any[]>([])
  // State quản lý Dialog và danh sách chọn
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]); // Danh sách toàn bộ học sinh
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const skillTabs = ["listening", "speaking", "reading", "writing"]
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: true,

  })
  const [showAddLessonDialog, setShowAddLessonDialog] = useState(false)
  const [selectedChapterId, setSelectedChapterId] = useState<string>("")
  const [chapterLessons, setChapterLessons] = useState<Record<number, any[]>>({})
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    type: "video",
  })

  const [formCourse, setFormCourse] = useState({
    name: "",
    description: "",
    target: "",
    duration: "",
    level: "",
    type: "listening",
    image: null as string | null,
    status: true,
  })  

  // Hàm toggle chọn học sinh
  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };


  const handleUserDetail = (userId: string) => {
    router.push(`/admin/users/detail/${userId}`);
  };

  const fetchLessonsForChapter = async (chapterId: number) => {
    try {
      const res = await GetLessons({ chapter_id: chapterId })
      setChapterLessons((prev) => ({ ...prev, [chapterId]: res.data.lessons }))
    } catch (err) {
      console.error("Lỗi khi lấy bài học cho chương:", chapterId, err)
    }
  }

  const handleCreateLesson = async () => {
    try {
      await CreateLesson({
        title: lessonForm.title,
        description: lessonForm.description,
        type: lessonForm.type,
        chapter_id: Number(selectedChapterId),
        status: true, // hoặc 0 nếu là draft
      })
      const updatedChapters = await GetChapters({ course_id: courseId });
      setChapters(updatedChapters.data.chapters);
      setShowAddLessonDialog(false);
      setLessonForm({ title: "", description: "", type: "video" });
    } catch (err) {
      console.error("Tạo bài học thất bại:", err)
    }
  }

  const getCourseDetail = async (courseId: string) => {
    try {
      const courseData = await GetCourseDetail(courseId);
      console.log(courseData);
      return courseData;
    } catch (error) {
      console.error("Failed to fetch course:", error);
      throw error;
    }
  }

  // useEffect(() => {
  //   async function loadCourse() {
  //     try {
  //       const res = await GetCourseDetail(courseId);
  //       setCourse(res.data); // <-- phải lấy data trong response
  //     } catch (error) {
  //       console.error("Error loading course", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   loadCourse();
  // }, [courseId]);


  // Tìm khóa học dựa trên ID
  // const course = courses.find((c) => c.id.toString() === courseId) || courses[0]

  const [expandedLesson, setExpandedLesson] = useState<{ chapterId: number | null; lessonIndex: number | null }>({
    chapterId: null,
    lessonIndex: null,
  })

  const toggleLessonDetail = (chapterId: number, lessonIndex: number) => {
    if (expandedLesson.chapterId === chapterId && expandedLesson.lessonIndex === lessonIndex) {
      setExpandedLesson({ chapterId: null, lessonIndex: null })
    } else {
      setExpandedLesson({ chapterId, lessonIndex })
    }
  }

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


  // const handleCreateChapter = async () => {
  //   try {
  //     await CreateChapter({
  //       title: formData.title,
  //       description: formData.description,
  //     }, courseId)
  //     const updatedList = await GetChapters({ course_id: courseId });
  //     setChapters(updatedList.data.chapters);
  //     setShowAddChapterDialog(false); // Đóng dialog nếu có
  //   } catch (err) {
  //     console.error("tao chuong hoc that bai: ", err)
  //   }
  // }

  const handleSubmitChapter = async () => {
    try {
      if (selectedChapterId) {
        // Nếu đang sửa chương
        await UpdateChapter(selectedChapterId, {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          course_id: courseId, 
        });
      } else {
        // Nếu đang thêm mới chương
        await CreateChapter({
          title: formData.title,
          description: formData.description,
          status: formData.status,
        }, courseId);
      }

      // Sau khi thêm/sửa, reload danh sách chương
      const updatedList = await GetChapters({ course_id: courseId });
      setChapters(updatedList.data.chapters);

      // Đóng dialog và reset form
      setShowAddChapterDialog(false);
      setFormData({
        title: "",
        description: "",
        status: true,
      });
    } catch (err) {
      console.error("Submit chapter failed", err);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
      if (!confirm("Bạn có chắc chắn muốn xóa chương học này?")) return;
      try {
        await DeleteChapter(chapterId);
        await new Promise(resolve => setTimeout(resolve, 300)) 
        const updatedList = await GetChapters({ course_id: courseId });
        setChapters(updatedList.data.chapters);
      } catch (err) {
        console.error("Xoá khóa học thất bại", err);
      }
    };

  // useEffect(() => {
  //   async function fetchChapters() {
  //     try {
  //       const List = await getChapterlist(courseId)
  //       setChapters(List.data.chapters)
  //     } catch (error) {
  //       console.error(error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   fetchChapters();
  // }, [courseId])

  const handleUpdateCourse = async () => {
    try {
      await UpdateCourse(courseId, {
        ...formCourse,
        school_id: DEFAULT_SCHOOL_ID, 
      });
      const res = await getCourseDetail(courseId);
      setCourse(res.data); // Cập nhật lại state với dữ liệu đầy đủ từ server
      setShowUpdateCourseDialog(false);
      // setCourse(() => ({
      //   ...formCourse,
      //   type: selectedSkill, // nếu type được chọn riêng
      // }));
      setFormCourse({
        name: "",
        description: "",
        target: "",
        duration: "",
        level: "",
        type: selectedSkill,
        image: null, 
        status: true,       
      })
    } catch (err) {
      console.error("Update course fail:", err)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadFile(file);

      const imageUrl = result.data.url;
      console.log("Uploaded image URL:", imageUrl);

      setFormCourse((prev) => ({
        ...prev,
        image: imageUrl, // Cập nhật image mới vào formCourse
      }));
    } catch (error) {
      console.error("Tải file thất bại:", error);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    async function fetchCourseAndChapters() {
      try {
        const [courseRes, chapterRes] = await Promise.all([
          GetCourseDetail(courseId),
          GetChapters({ course_id: courseId }),
        ]);

        setCourse(courseRes.data);
        setChapters(chapterRes.data.chapters);

        // Gọi API GetLessons cho từng chương
        chapterRes.data.chapters.forEach((chapter: any) => {
          fetchLessonsForChapter(chapter.id)
        })

      } catch (err) {
        console.error("Lỗi khi tải khóa học hoặc chương học", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCourseAndChapters();
  }, [courseId]);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await GetUserListAdvanced({ course_id: courseId, role_id: 3 });
        setStudents(res.data.users || []);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách học sinh:", err);
      }
    }
    if (courseId) fetchStudents();
  }, [courseId]);

  useEffect(() => {
    async function fetchAllStudents() {
      try {
        const res = await GetUserList(3);
        setAllStudents(res.data.users || []);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách tất cả học sinh:", err);
      }
    } 
    if (showAddStudentDialog) fetchAllStudents();
  }, [showAddStudentDialog]);


  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb và nút quay lại */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0 hover:bg-transparent">
            <Link href="/admin/courses" className="flex items-center text-gray-500 hover:text-gray-700">
              <LucideChevronLeft className="h-4 w-4 mr-1" />
              Quay lại danh sách khóa học
            </Link>
          </Button>
        </div>

        {/* Thông tin khóa học */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <div className="relative h-[240px]">
                <Image src={course?.image || "/placeholder.svg"} alt={course?.name || "No title"} fill className="object-cover" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white text-orange-500">{course?.level}</Badge>
                </div>
                <div className="absolute top-4 left-4">
                  <Badge
                    className={
                      course?.status === true
                        ? "bg-green-500"
                        : course?.status === false
                          ? "bg-amber-500"
                          : "bg-gray-500"
                    }
                  >
                    {course?.status === true
                      ? "Đang hoạt động"
                      : course?.status === false
                        ? "Bản nháp"
                        : "Đã lưu trữ"}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{course?.name}</CardTitle>
                    <CardDescription>{course?.description}</CardDescription>
                  </div>
                  <Button onClick={() => {
                      setShowUpdateCourseDialog(true)
                      setFormCourse({
                        name: course?.name || "",
                        description: course?.description || "",
                        target: course?.target || "",
                        duration: course?.duration || "",
                        level: course?.level || "",
                        type: course?.type || "listening",
                        image: course?.image || null,
                        status: course?.status,
                      })
                    }}>
        
                      <LucideEdit className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 mb-6">
                  <Badge variant="outline" className="flex items-center gap-1 text-sm">
                    <LucideClock className="h-4 w-4" />
                    {course?.duration}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 text-sm">
                    {getCourseIcon(course?.type)}
                    {course?.type === "listening"
                      ? "Nghe"
                      : course?.type === "speaking"
                        ? "Nói"
                        : course?.type === "reading"
                          ? "Đọc"
                          : "Viết"}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 text-sm">
                    <LucideBookOpen className="h-4 w-4" />
                    {course?.chapters.length} chương học
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 text-sm">
                    <LucideUsers className="h-4 w-4" />
                    {course?.student_count} học sinh
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 text-sm">
                    <LucideCalendar className="h-4 w-4" />
                    Cập nhật: 15/04/2025
                  </Badge>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Mô tả chi tiết</h3>
                  <p className="text-gray-600">
                    {course?.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Mục tiêu khóa học</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>
                      Phát triển kỹ năng{" "}
                      {course?.type === "listening"
                        ? "nghe"
                        : course?.type === "speaking"
                          ? "nói"
                          : course?.type === "reading"
                            ? "đọc"
                            : "viết"}{" "}
                      tiếng Anh cơ bản
                    </li>
                    <li>Nâng cao vốn từ vựng trong các tình huống hàng ngày</li>
                    <li>Xây dựng sự tự tin khi giao tiếp bằng tiếng Anh</li>
                    <li>Áp dụng kiến thức vào các tình huống thực tế</li>
                    <li>Chuẩn bị cho các kỳ thi tiếng Anh</li>
                  </ul>
                  {/* {course?.objective?.split("\n").map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))} */}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Thống kê khóa học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hoàn thành trung bình</span>
                    <span>{course?.completion}%</span>
                  </div>
                  <Progress value={course?.completion} className="h-2" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tổng số học sinh</span>
                    <Badge variant="outline" className="flex items-center">
                      <LucideUsers className="h-3.5 w-3.5 mr-1" />
                      {course?.student_count}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tổng số chương học</span>
                    <Badge variant="outline" className="flex items-center">
                      <LucideBookOpen className="h-3.5 w-3.5 mr-1" />
                      {course?.chapters.length} chương
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Thời lượng</span>
                    <Badge variant="outline" className="flex items-center">
                      <LucideClock className="h-3.5 w-3.5 mr-1" />
                      {course?.duration}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cấp độ</span>
                    <Badge variant="outline">{course?.level}</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Hành động nhanh</h4>
                  <div className="space-y-2">
                    <Button className="w-full" asChild>
                      <Link href={`/teacher/courses/${courseId}/students`}>
                        <LucideUsers className="h-4 w-4 mr-2" />
                        Xem danh sách học sinh
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/admin/courses/${courseId}/lessons/create`}>
                        <LucidePlus className="h-4 w-4 mr-2" />
                        Thêm bài học mới
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
              <DialogContent className="max-w-[90vw] h-[80vh] w-full">
                <DialogHeader>
                  <DialogTitle>Chọn học sinh thêm vào khóa học</DialogTitle>
                  <p className="text-gray-500 text-sm mt-1">
                    Đã có {allStudents.length} học sinh. Tích chọn những học sinh muốn thêm vào khóa học.
                  </p>
                </DialogHeader>
                <div className="h-[60vh] overflow-y-auto border rounded bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead>Tên học sinh</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Trường</TableHead>
                        <TableHead>Lớp</TableHead>
                        <TableHead>Địa chỉ</TableHead>
                        <TableHead>SĐT</TableHead>
                        <TableHead>Trong khóa học</TableHead>
                        <TableHead>Loại khỏi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStudents.map(student => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudentIds.includes(student.id)}
                              onCheckedChange={() => toggleStudent(student.id)}
                              disabled={student.inCourse}
                            />
                          </TableCell>
                          <TableCell className="flex items-center gap-2">
                            <Image
                              src={student.avatar || "https://dogily.vn/wp-content/swift-ai/images/wp-content/uploads/2023/01/bb50cbc0e3f23c68be95f34a660e096c-Photoroom-jpg.webp"}
                              alt={student.name}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                            <span>{student.name}</span>
                          </TableCell>
                          <TableCell>{student.email || "—"}</TableCell>
                          <TableCell>{student.user_info?.school?.name || "—"}</TableCell>
                          <TableCell>{student.user_info?.class?.name || "—"}</TableCell>
                          <TableCell>{student.address || "—"}</TableCell>
                          <TableCell>{student.phone_number || "—"}</TableCell>
                          <TableCell>
                            {student.user_info?.courses?.some((c: any) => String(c.id) === String(courseId)) ? (
                              <Badge className="bg-green-500">Đã trong khóa</Badge>
                            ) : (
                              <Badge variant="outline">Chưa trong khóa</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.user_info?.courses?.some((c: any) => String(c.id) === String(courseId)) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveStudent(student.id)}
                              >
                                Loại khỏi
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      // Gọi API thêm các học sinh đã chọn vào khóa học ở đây
                      // await addStudentsToCourse(courseId, selectedStudentIds)
                      setShowAddStudentDialog(false);
                    }}
                    disabled={selectedStudentIds.length === 0}
                  >
                    Thêm vào khóa học
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>
                    Hủy
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={showAddChapterDialog} onOpenChange={setShowAddChapterDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedChapterId ? "Sửa chương học" : "Thêm chương mới"}</DialogTitle>
                  <DialogDescription>
                    {selectedChapterId
                      ? "Chỉnh sửa thông tin chương học."
                      : "Nhập thông tin chương học để thêm vào khóa học."}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <label className="block mb-1 text-sm font-medium">Tên chương</label>
                  <Input
                    placeholder="Tên chương"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  <label className="block mb-1 text-sm font-medium">Mô tả chương</label>
                  <Input
                    placeholder="Mô tả chương"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  <label className="block mb-1 text-sm font-medium">Trạng thái</label>
                  <Select
                    value={String(formData.status)}
                    onValueChange={value => setFormData({ ...formData, status: value === "true" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Đang hoạt động</SelectItem>
                      <SelectItem value="false">Không hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button
                    onClick={async () => {
                      handleSubmitChapter()
                      setShowAddChapterDialog(false);
                    }}
                    disabled={formData.title === ""}
                  >
                    {selectedChapterId ? "Lưu thay đổi" : "Tạo chương"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={ShowUpdateCourseDialog} onOpenChange={setShowUpdateCourseDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cập nhật khóa học</DialogTitle>
                  <DialogDescription>
                    Nhập thông tin khóa học để thêm vào hệ thống.
                  </DialogDescription>
                </DialogHeader>

                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleUpdateCourse();
                  }}
                >
                  <label className="block mb-1 text-sm font-medium">Tên khóa học</label>
                  <Input
                    placeholder="Tên khóa học"
                    value={formCourse.name}
                    onChange={(e) => setFormCourse({ ...formCourse, name: e.target.value })}
                    required
                  />
                  <label htmlFor="course-description" className="block mb-1 font-medium">Mô tả</label>
                  <Textarea
                    id="course-description"
                    placeholder="Mô tả"
                    value={formCourse.description}
                    onChange={(e) => setFormCourse({ ...formCourse, description: e.target.value })}
                    required
                  />
                  <label className="block mb-1 text-sm font-medium">Mục tiêu</label>
                  <Input
                    placeholder="Mục tiêu"
                    value={formCourse.target}
                    onChange={(e) => setFormCourse({ ...formCourse, target: e.target.value })}
                  />
                  <label className="block mb-1 text-sm font-medium">Thời hạn</label>
                  <Input
                    placeholder="Thời hạn"
                    value={formCourse.duration}
                    onChange={(e) => setFormCourse({ ...formCourse, duration: e.target.value })}
                  />
                  <label className="block mb-1 text-sm font-medium">Trình độ</label>
                  <Input
                    placeholder="Trình độ"
                    value={formCourse.level}
                    onChange={(e) => setFormCourse({ ...formCourse, level: e.target.value })}
                  />
                  <label className="block mb-1 text-sm font-medium">Ảnh đại diện</label>
                  <Input
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
                  <label className="block mb-1 text-sm font-medium">Loại kĩ năng</label>
                  <Select value={formCourse.type} onValueChange={(value) => setFormCourse({ ...formCourse, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillTabs.map((skill) => (
                        <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    <label className="block mb-1 text-sm font-medium">Trạng thái</label>
                  <Select
                    value={String(formCourse.status)}
                    onValueChange={(value) => setFormCourse({ ...formCourse, status: value === "true" })}
                  >
                    <SelectTrigger id="course-status">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Đang hoạt động</SelectItem>
                      <SelectItem value="false">Không hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                  <DialogFooter className="mt-4">
                    <Button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      disabled={isUploading}
                    >
                      Cập nhật
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowUpdateCourseDialog(false)}>
                      Hủy
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          {/* ✅ Dialog tạo bài học */}
          <Dialog open={showAddLessonDialog} onOpenChange={setShowAddLessonDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm bài học mới</DialogTitle>
                <DialogDescription>Nhập thông tin để tạo bài học mới trong chương đã chọn.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <label className="block text-sm font-medium">Tên bài học</label>
                <Input
                  placeholder="Tên bài học"
                  value={lessonForm.name}
                  onChange={(e) => setLessonForm({ ...lessonForm, name: e.target.value })}
                />
                <label className="block text-sm font-medium">Mô tả</label>
                <Input
                  placeholder="Mô tả bài học"
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                />
              </div>

              <DialogFooter className="mt-4">
                <Button onClick={handleCreateLesson} disabled={!lessonForm.name}>
                  Tạo bài học
                </Button>
                <Button variant="outline" onClick={() => setShowAddLessonDialog(false)}>
                  Hủy
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Tabs nội dung khóa học */}
        <Tabs defaultValue="content" className="mb-8">
          <TabsList>
            <TabsTrigger value="content">Nội dung khóa học</TabsTrigger>
            <TabsTrigger value="students">Học sinh</TabsTrigger>
            <TabsTrigger value="analytics">Phân tích</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Nội dung khóa học</CardTitle>
                  <Button className="rounded-full bg-enspire-green text-white hover:bg-opacity-90" onClick={() =>
                   {
                      setShowAddChapterDialog(true)
                      setFormData({
                        title: "",
                        description: "",
                        status: true,
                      });
                   }
                  }>
                    <LucidePlus className="h-4 w-4 mr-2" />
                    Thêm chương mới
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {chapters.map((chapter) => (
                    <AccordionItem key={chapter.id} value={`chapter-${chapter.id}`}>
                      <div className="flex justify-between items-center">
                        <AccordionTrigger>{chapter.title}</AccordionTrigger>
                        <div className="flex gap-2 ml-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              // setEditChapterData({ id: chapter.id, title: chapter.title, description: chapter.description });
                              setFormData({ 
                                  title: chapter.title, 
                                  description: chapter.description,
                                  status: chapter.status
                              });
                              setSelectedChapterId(chapter.id);
                              setShowAddChapterDialog(true);
                            }}
                          >
                            <LucideEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              handleDeleteChapter(chapter.id);
                              setSelectedChapterId("");
                            }}
                          >
                            <LucideTrash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                        <AccordionContent>
                          {chapter.lessons?.length > 0 ? (
                            <div className="space-y-4 pt-2">
                              {(chapterLessons[chapter.id] || []).length > 0 ? (
                                  <div className="space-y-2 pt-2">
                                    {chapterLessons[chapter.id].map((lesson) => (
                                      <div key={lesson.id} className="p-2 border rounded">
                                        <strong>{lesson.title}</strong>
                                        <p className="text-sm text-gray-600">{lesson.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500">Chưa có bài học nào</p>
                                )}

                              <Button variant="outline" className="w-full" onClick={() => {
                                  setSelectedChapterId(chapter.id)
                                  setShowAddLessonDialog(true)}}>
        
                                  <LucidePlus className="h-4 w-4 mr-2" />
                                  Thêm bài học mới
                              </Button>
                            </div>
                          ) : (
                            <div className="py-4 text-center">
                              <p className="text-gray-500">Chưa có bài học nào trong chương này</p>
                              <Button variant="outline" className="mt-2" onClick={() => {
                                  setSelectedChapterId(chapter.id);
                                  setShowAddLessonDialog(true);
                                }}>
                                  <LucidePlus className="h-4 w-4 mr-2" />
                                  Thêm bài học mới
                  
                              </Button>
                            </div>
                          )}
                        </AccordionContent>
                      
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Danh sách học sinh</CardTitle>
                  <Button
                    className="rounded-full bg-enspire-green text-white hover:bg-opacity-90"
                    onClick={() => {
                      setShowAddStudentDialog(true);
                    }}
                  >
                    <LucidePlus className="h-4 w-4 mr-2" />
                    Thêm học sinh mới
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">Có {students.length} học sinh đang tham gia khóa học này</p>
                <div className="space-y-4">
                  {/* {Array.from({ length: 5 }).map((_, index) => ( */}
                  {students.length > 0 ? (
                    students.map((student, index) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                      >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
                          {/* <Image
                            src={`/placeholder-hs.png?text=HS${index + 1}`}
                            alt={`Học sinh ${index + 1}`}
                            width={40}
                            height={40}
                          /> */}
                          <Image
                            src={student.avatar || "/placeholder-hs.png"}
                            alt={student.name || `Học sinh ${index + 1}`}
                            width={40}
                            height={40}
                          />
                        </div>
                        {/* <div>
                          <p className="font-medium">Học sinh {index + 1}</p>
                          <p className="text-sm text-gray-500">hocsinh{index + 1}@example.com</p>
                        </div> */}
                        <div>
                          <p className="font-medium">{student.name || `Học sinh ${index + 1}`}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* <Badge
                          className={
                            index % 3 === 0 ? "bg-green-500" : index % 3 === 1 ? "bg-amber-500" : "bg-blue-500"
                          }
                        >
                          {index % 3 === 0 ? "Hoàn thành" : index % 3 === 1 ? "Đang học" : "Mới bắt đầu"}
                        </Badge> */}
                        <Badge className="bg-green-500">Đang học</Badge>
                        <Button onClick={() => handleUserDetail(student.id)} variant="ghost" size="sm">
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  ))) 
                  : (
                    <p className="text-gray-500">Chưa có học sinh nào trong khóa học này</p>
                  )}
                  {/* ))} */}
                </div>
                <div className="mt-4 text-center">
                  <Button variant="outline">Xem tất cả học sinh</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Phân tích khóa học</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-6">
                  Thống kê và phân tích về tiến độ học tập của học sinh trong khóa học
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Tiến độ hoàn thành theo chương</h3>
                    <div className="space-y-3">
                      {Array.isArray(course?.chapters) &&
                        course.chapters.map((chapter, index) => (
                          <div key={chapter.id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>
                                Chương {index + 1}: {chapter.title?.split(":")[1]?.trim() ?? chapter.title}
                              </span>
                              <span>
                                {chapter.lessons?.length
                                  ? Math.round((chapter.completed / chapter.lessons.length) * 100)
                                  : 0}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                chapter.lessons?.length
                                  ? Math.round((chapter.completed / chapter.lessons.length) * 100)
                                  : 0
                              }
                              className="h-2"
                            />
                          </div>
                        ))}

                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Tỷ lệ hoàn thành</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{course?.completion}%</div>
                        <p className="text-xs text-gray-500">Trung bình của tất cả học sinh</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Thời gian học trung bình</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">45 phút</div>
                        <p className="text-xs text-gray-500">Mỗi ngày</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Điểm trung bình</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">8.5/10</div>
                        <p className="text-xs text-gray-500">Trong các bài kiểm tra</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Sample data
// const courses = [
//   {
//     id: 1,
//     title: "Luyện nghe tiếng Anh cơ bản",
//     description: "Cải thiện kỹ năng nghe với các bài tập thực tế",
//     image: "/placeholder.svg?height=160&width=320",
//     level: "Sơ cấp",
//     duration: "4 tuần",
//     lessons: 12,
//     students: 45,
//     type: "listening",
//     completion: 75,
//     status: "active",
//     chapters: [
//       {
//         id: 1,
//         title: "Chương 1: Làm quen với âm tiếng Anh",
//         lessons: [
//           {
//             id: 1,
//             title: "Lesson 1: Introduction to English Sounds",
//             type: "video",
//             duration: "15:00",
//           },
//           {
//             id: 2,
//             title: "Lesson 2: Basic Vocabulary",
//             type: "text",
//             length: 10,
//           },
//           {
//             id: 3,
//             title: "Lesson 3: Listening Practice",
//             type: "quiz",
//             questions: 5,
//           },
//           {
//             id: 4,
//             title: "Lesson 4: Assignment 1",
//             type: "assignment",
//             dueDate: "2024-04-01",
//           },
//         ],
//         completed: 3,
//       },
//       {
//         id: 2,
//         title: "Chương 2: Nghe và nhận diện từ vựng",
//         lessons: [
//           {
//             id: 5,
//             title: "Lesson 5: Vocabulary in Context",
//             type: "video",
//             duration: "12:00",
//           },
//           {
//             id: 6,
//             title: "Lesson 6: Advanced Vocabulary",
//             type: "text",
//             length: 15,
//           },
//           {
//             id: 7,
//             title: "Lesson 7: Listening Comprehension",
//             type: "quiz",
//             questions: 7,
//           },
//           {
//             id: 8,
//             title: "Lesson 8: Assignment 2",
//             type: "assignment",
//             dueDate: "2024-04-08",
//           },
//         ],
//         completed: 2,
//       },
//       {
//         id: 3,
//         title: "Chương 3: Nghe hiểu đoạn hội thoại ngắn",
//         lessons: [
//           {
//             id: 9,
//             title: "Lesson 9: Short Dialogues",
//             type: "video",
//             duration: "18:00",
//           },
//           {
//             id: 10,
//             title: "Lesson 10: Common Phrases",
//             type: "text",
//             length: 12,
//           },
//           {
//             id: 11,
//             title: "Lesson 11: Dialogue Practice",
//             type: "quiz",
//             questions: 6,
//           },
//           {
//             id: 12,
//             title: "Lesson 12: Final Assignment",
//             type: "assignment",
//             dueDate: "2024-04-15",
//           },
//         ],
//         completed: 1,
//       },
//     ],
//   },
//   {
//     id: 2,
//     title: "Luyện nói giao tiếp hàng ngày",
//     description: "Thực hành nói tiếng Anh trong các tình huống hàng ngày",
//     image: "/placeholder.svg?height=160&width=320",
//     level: "Trung cấp",
//     duration: "6 tuần",
//     lessons: 15,
//     students: 32,
//     type: "speaking",
//     completion: 0,
//     status: "draft",
//     chapters: [
//       {
//         id: 1,
//         title: "Chương 1: Chào hỏi và giới thiệu",
//         lessons: [],
//         completed: 0,
//       },
//       {
//         id: 2,
//         title: "Chương 2: Giao tiếp tại nhà hàng",
//         lessons: [],
//         completed: 0,
//       },
//       {
//         id: 3,
//         title: "Chương 3: Giao tiếp khi đi mua sắm",
//         lessons: [],
//         completed: 0,
//       },
//     ],
//   },
// ]
